import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { BACKGROUND_COLOR, WORLD_HEIGHT, WORLD_WIDTH } from './constants';
import { Position } from './types';
import AlpineJS from 'alpinejs';

export class Scene {
    private app: PIXI.Application<HTMLCanvasElement>;
    private viewport: Viewport;
    private dragTarget: PIXI.IDisplayObjectExtended | null;
    private dragPosition: PIXI.IPointData | null;

    constructor() {
        this.dragTarget = null;
        this.dragPosition = null;

        this.handleDrag = this.handleDrag.bind(this);
        this.handleDragStart = this.handleDragStart.bind(this);
        this.handleDragEnd = this.handleDragEnd.bind(this);
        this.handleResize = this.handleResize.bind(this);

        this.app = this.setupApp();
        this.viewport = this.setupViewport(this.app);
        this.setupWorldPlane(this.viewport);
        this.setupEvents();

        // console.log(AlpineJS.store('connections').print())
    }

    setupEvents() {
        window.addEventListener('resize', this.handleResize);
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
        this.createShape({ x: 500, y: 700 }, 150);
    }

    createShape(position: Position, size: number, color: number = 0xFF0FFA) {
        const shape = new PIXI.Sprite(PIXI.Texture.WHITE);
        shape.tint = color;
        shape.width = shape.height = size;
        shape.position.set(position.x, position.y);
        shape.eventMode = 'dynamic';
        shape.on('pointerdown', this.handleDragStart);
        shape.on('pointerup', this.handleDragEnd);
        shape.on('pointerupoutside', this.handleDragEnd);
        this.viewport.addChild(shape);
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
}
