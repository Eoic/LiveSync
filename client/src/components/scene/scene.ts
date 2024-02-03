import * as PIXI from 'pixi.js';
import { Position } from '../../core/types';
import { Entity } from '../../entities';
import { Viewport } from 'pixi-viewport';
import { InputManager } from '../../managers';
import { EventType } from '../../managers/event-manager';
import { BACKGROUND_COLOR, WORLD_HEIGHT, WORLD_WIDTH } from './constants';
import { InMessages, OutMessages } from '../../core/webSocket';
import { NetManager } from '../../managers/net-manager';

export class Scene {
    private viewport: Viewport;
    private app: PIXI.Application<HTMLCanvasElement>;
    private dragTarget: PIXI.IDisplayObjectExtended | null;
    private dragPosition: PIXI.IPointData | null;
    private entities: Map<string, Entity>;
    private ownerEntity: Entity | null;
    private inputSeqId: number = 0;
    private refreshRateHz: number = 60;
    private serverRateHz: number = 60;
    private ticker: PIXI.Ticker;
    private serverMessages: Array<any> = [];
    private pendingInputs: Array<OutMessages.PlayerPosition> = [];

    constructor() {
        this.dragTarget = null;
        this.dragPosition = null;
        this.ownerEntity = null;
        this.entities = new Map();

        // Game loop.
        this.ticker = new PIXI.Ticker();
        this.ticker.maxFPS = this.refreshRateHz;

        // Event handlers.
        this.handleDrag = this.handleDrag.bind(this);
        this.handleDragStart = this.handleDragStart.bind(this);
        this.handleDragEnd = this.handleDragEnd.bind(this);
        this.handleResize = this.handleResize.bind(this);

        // Scene setup.
        this.app = this.setupApp(document.body);
        this.viewport = this.setupViewport(this.app);
        this.setupWorld(this.viewport);
        this.setupEvents();
        this.setupGameLoop();
    }

    setupEvents() {
        window.addEventListener('resize', this.handleResize);

        window.addEventListener(EventType.PlayerAdd, async (event: any) => {
            const entityData = {
                size: 25,
                position: { x: 0, y: 0 },
                settings: { isDraggable: false }
            }

            const playerMarker = this.createShape(entityData.position, entityData.size, entityData.settings);
            const entity = new Entity(event.detail.id, playerMarker);

            if (event.detail.owner) {
                entity.setColor(0x00FFF0);
                this.ownerEntity = entity;
            } else {
                entity.setColor(0xFFF000);
            }

            this.viewport.addChild(entity.sprite);
            this.entities.set(entity.id, entity);
        });

        window.addEventListener(EventType.PlayerRemove, (event: any) => {
            const player = this.entities.get(event.detail.id);
            const childIndex = this.viewport.children.findIndex((item) => item === player?.sprite);
            this.viewport.removeChildAt(childIndex);
            this.entities.delete(event.detail.id);
        });

        window.addEventListener(EventType.WorldState, (event: any) => {
            if (event.detail) {
                this.serverMessages.push(event.detail);
            }
        });
    }

    setupGameLoop() {
        this.ticker.add((_deltaTime) => {
            this.processServerMessages();

            if (!this.ownerEntity) {
                return;
            }
    
            this.processInputs();
            this.interpolateEntities();
        });

        this.ticker.start();
    }

    interpolateEntities() {
        const nowTs = +new Date();
        const renderTs = nowTs - (1000.0 / this.serverRateHz);

        for (const entity of this.entities.values()) {
            if (entity.id === this.ownerEntity!.id) {
                continue;
            }

            const buffer = entity.positionsBuffer;

            while (buffer.length >= 2 && buffer[1].timestamp <= renderTs) {
                buffer.shift();
            }

            if (buffer.length >= 2 && buffer[0].timestamp <= renderTs && renderTs <= buffer[1].timestamp) {
                const { position: pos0, timestamp: ts0 } = buffer[0];
                const { position: pos1, timestamp: ts1 } = buffer[1];
                
                const tsDelta = (ts1 - ts0);
                const ratio = (renderTs - ts0) / tsDelta;

                entity.sprite.position.set(
                    pos0.x + (pos1.x - pos0.x) * ratio,
                    pos0.y + (pos1.y - pos0.y) * ratio,
                );
            }
        }
    }

    processInputs() {
        if (!this.ownerEntity) {
            console.warn('Cannot process player input yet...');
            return;
        }

        const pointerPosition = this.viewport.toWorld(InputManager.getInstance().pointerPosition);

        const positionMessage: OutMessages.PlayerPosition = {
            type: 'PLAYER_POSITION',
            payload: {
                id: this.ownerEntity.id,
                seqId: this.inputSeqId++,
                position: pointerPosition,
            } 
        };

        this.ownerEntity.applyInput(pointerPosition);
        this.pendingInputs.push(positionMessage);
        NetManager.send(positionMessage);
    }

    processServerMessages() {
        for (let i = 0; i < this.serverMessages.length; i++) {
            const message = this.serverMessages.shift()

            for (const [entityId, data] of Object.entries(message)) {
                if (this.ownerEntity && this.ownerEntity.id == entityId) {
                    // Update self.
                    this.ownerEntity.sprite.position.set(
                        (data as any).position.x,
                        (data as any).position.y,
                    );
                
                    let j = 0;

                    while (j < this.pendingInputs.length) {
                        let input = this.pendingInputs[j].payload;

                        if (input.seqId <= (data as any).last_processed_input) {
                            this.pendingInputs.splice(j, 1);
                        } else {
                            this.ownerEntity.applyInput(input.position);
                            j++;
                        }
                    }
                } else {
                    // Update others.
                    const entity = this.entities.get(entityId);
                    
                    entity?.addPositionToBuffer({
                        timestamp: +new Date(),
                        position: (data as any).position
                    });
                }
            }
        }
    }

    setupApp(container: HTMLElement): PIXI.Application<HTMLCanvasElement> {
        const app = new PIXI.Application({
            width: window.innerWidth,
            height: window.innerHeight,
            resizeTo: window,
            backgroundColor: BACKGROUND_COLOR,
            autoDensity: true,
            antialias: true
        }) as PIXI.Application<HTMLCanvasElement>;

        container.appendChild(app.view);

        return app;
    }

    setupViewport(app: PIXI.Application): Viewport {
        const viewport = new Viewport({
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            worldWidth: WORLD_WIDTH,
            worldHeight: WORLD_HEIGHT,
            events: app.renderer.events,
        });

        app.stage.addChild(viewport);

        viewport
            .drag()
            .pinch()
            .wheel()
            .clampZoom({
                minScale: 0.15,
                maxScale: 12.50,
            });

        viewport.fit();
        viewport.moveCenter(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);

        return viewport;
    }

    setupWorld(viewport: Viewport) {
        const shape = this.createShape({ x: 500, y: 700 }, 150, { isDraggable: true });
        viewport.addChild(shape);
    }

    createShape(
        position: Position,
        size: number,
        settings: {
            color?: number,
            isDraggable?: boolean,
        }
    ): PIXI.Sprite {
        if (!settings.color) {
            settings.color = 0xFF0FFA;
        }

        if (!settings.isDraggable) {
            settings.isDraggable = false;
        }

        const shape = new PIXI.Sprite(PIXI.Texture.WHITE);
        shape.tint = settings.color;
        shape.width = shape.height = size;
        shape.position.set(position.x, position.y);

        if (settings.isDraggable) {
            shape.eventMode = 'dynamic';
            shape.on('pointerdown', this.handleDragStart);
            shape.on('pointerup', this.handleDragEnd);
            shape.on('pointerupoutside', this.handleDragEnd);
        } else {
            shape.eventMode = 'none';
            shape.hitArea = new PIXI.Polygon([]);
        }

        return shape;
    }

    /**
     * [EVENT HANDLER]
     * Updates drag target position according to pointer position.
     * @param event {PIXI.FederatedPointerEvent} Pointer event.
     */
    handleDrag(event: PIXI.FederatedPointerEvent): void {
        if (!this.dragTarget || !this.dragPosition) {
            return;
        }

        const parentPosition = event.getLocalPosition(this.dragTarget.parent);
        this.dragTarget.x = parentPosition.x - this.dragPosition.x;
        this.dragTarget.y = parentPosition.y - this.dragPosition.y;
    }

    /**
     * [EVENT HANDLER]
     * Adds event handlers to the draggable, initializes drag target.
     * @param event Pointer event.
     */
    handleDragStart(event: PIXI.FederatedPointerEvent): void {
        event.stopPropagation();
        this.dragTarget = event.target as PIXI.DisplayObject;
        this.dragPosition = event.getLocalPosition(event.target.parent as PIXI.DisplayObject);
        this.dragPosition.x -= this.dragTarget.x;
        this.dragPosition.y -= this.dragTarget.y;
        this.dragTarget.parent.on('pointermove', this.handleDrag);
    }

    /**
     * [EVENT HANDLER]
     * Removes event listeners from the draggable.
     * @param event Pointer event.
     */
    handleDragEnd(event: PIXI.FederatedPointerEvent): void {
        if (!this.dragTarget) {
            return;
        }

        event.stopPropagation();
        this.dragTarget.parent.off('pointermove', this.handleDrag);
    }

    /**
     * [EVENT HANDLER]
     * Resize the scene and viewport.
     */
    handleResize(): void {
        this.app?.resize();
        this.viewport?.resize(window.innerWidth, window.innerHeight);
    }
}
