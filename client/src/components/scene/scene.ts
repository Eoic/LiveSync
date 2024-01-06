import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { BACKGROUND_COLOR, WORLD_HEIGHT, WORLD_WIDTH } from './constants';
import { Position } from './types';
import AlpineJS from 'alpinejs';
import { EventType } from '../../managers/event-manager';

export class Scene {
    private app: PIXI.Application<HTMLCanvasElement>;
    private viewport: Viewport;
    private dragTarget: PIXI.IDisplayObjectExtended | null;
    private dragPosition: PIXI.IPointData | null;
    private players: Map<string, PIXI.Sprite> = new Map();

    constructor() {
        this.dragTarget = null;
        this.dragPosition = null;

        this.handleDrag = this.handleDrag.bind(this);
        this.handleDragStart = this.handleDragStart.bind(this);
        this.handleDragEnd = this.handleDragEnd.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.handlePointerMove = this.handlePointerMove.bind(this);

        this.app = this.setupApp();
        this.viewport = this.setupViewport(this.app);
        this.setupWorldPlane(this.viewport);
        this.setupEvents();

        // console.log(AlpineJS.store('connections').print())
    }

    setupEvents() {
        window.addEventListener('resize', this.handleResize);

        window.addEventListener(EventType.PlayerAdd, async (event: any) => {
            if (event.detail.owner) {
                return;
            }

            const cursor = this.createShape({ x: 0, y: 0 }, 25, { color: 0xFFF000, isDraggable: false });
            this.viewport.addChild(cursor);
            this.players.set(event.detail.id, cursor);
        });

        window.addEventListener(EventType.PlayerRemove, (event: any) => {
            const player = this.players.get(event.detail.id);
            this.players.delete(event.detail.id);

            const childIndex = this.viewport.children.findIndex((item) => item === player);
            this.viewport.removeChildAt(childIndex);
        });

        window.addEventListener(EventType.PlayerPositionChange, (event: any) => {
            const player = this.players.get(event.detail.id);

            if (player) {
                // console.log('Setting position:', event.detail.position);
                player.position.set(event.detail.position.x, event.detail.position.y);
            }
            // this.players.get(event.detail.id)?.position.set(event.detail.position);
            // console.log(event.detail.position);
        });

        window.addEventListener('pointermove', this.handlePointerMove);
    }

    setupApp(): PIXI.Application<HTMLCanvasElement> {
        const app = new PIXI.Application({
            width: window.innerWidth,
            height: window.innerHeight,
            resizeTo: window,
            backgroundColor: BACKGROUND_COLOR,
            autoDensity: true,
            antialias: true
        }) as PIXI.Application<HTMLCanvasElement>;

        document.body.appendChild(app.view);

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

    setupWorldPlane(viewport: Viewport) {
        const plane = viewport.addChild(new PIXI.Sprite(PIXI.Texture.WHITE))
        plane.tint = 0x3F00FF;
        plane.width = WORLD_WIDTH;
        plane.height = WORLD_HEIGHT;
        plane.position.set(0, 0);
        plane.eventMode = 'dynamic';
        
        const shape = this.createShape({ x: 500, y: 700 }, 150);
        viewport.addChild(shape);
    }

    createShape(
        position: Position,
        size: number,
        settings: {
            color: number,
            isDraggable: boolean,
        } = {
                color: 0xFF0FFA,
                isDraggable: false,
            }
    ): PIXI.Sprite {
        const shape = new PIXI.Sprite(PIXI.Texture.WHITE);
        shape.tint = settings.color;
        shape.width = shape.height = size;
        shape.position.set(position.x, position.y);
        shape.eventMode = 'dynamic';
        shape.on('pointerdown', this.handleDragStart);
        shape.on('pointerup', this.handleDragEnd);
        shape.on('pointerupoutside', this.handleDragEnd);
        // this.viewport.addChild(shape);
        return shape;
    }

    /**
     * [EVENT HANDLER]
     * 
     * @param event Pointer event.
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

    handlePointerMove(event: MouseEvent): void {
        event.stopPropagation();

        const worldPosition = this.viewport.toWorld({
            x: event.clientX,
            y: event.clientY,
        });

        const message = JSON.stringify({
            type: 'PLAYER_POSITION',
            payload: { position: worldPosition }
        });

        const socket = AlpineJS.store('socket') as WebSocket;

        if (socket.OPEN) {
            console.log('Sending world position.')
            socket.send(message);
        }
    }
}
