import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { BACKGROUND_COLOR, WORLD_HEIGHT, WORLD_WIDTH } from './constants';
import { Position } from './types';

export class Scene {
    private app: PIXI.Application<HTMLCanvasElement>;
    private viewport: Viewport;

    constructor() {
        this.app = new PIXI.Application({
            width: window.innerWidth,
            height: window.innerHeight,
            resizeTo: window,
            backgroundColor: BACKGROUND_COLOR,
            autoDensity: true,
            antialias: true
        });

        this.viewport = new Viewport({
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            worldWidth: WORLD_WIDTH,
            worldHeight: WORLD_HEIGHT,
            events: this.app.renderer.events,
        });

        document.body.appendChild(this.app.view);

        this.app.stage.addChild(this.viewport);
        this.viewport
            .drag()
            .pinch()
            .wheel()
            .clampZoom({
                minScale: 0.15,
                maxScale: 12.50,
            });

        this.setupWorldPlane();

        this.viewport.fit();
        this.viewport.moveCenter(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
    }

    setupWorldPlane() {
        const worldPlane =  this.viewport.addChild(new PIXI.Sprite(PIXI.Texture.WHITE))
        worldPlane.tint = 0x3F00FF;
        worldPlane.width = WORLD_WIDTH;
        worldPlane.height = WORLD_HEIGHT;
        worldPlane.position.set(0, 0);
        worldPlane.interactive = true;

        this.createShape({ x: 500, y: 700 }, 150);
    }

    createShape(position: Position, size: number, color: number = 0xFF0FFA) {
        const shape = new PIXI.Sprite(PIXI.Texture.WHITE);
        shape.tint = color;
        shape.width = shape.height = size;
        shape.position.set(position.x, position.y);
        shape.eventMode = 'dynamic';
        this.viewport.addChild(shape);
    }
}
