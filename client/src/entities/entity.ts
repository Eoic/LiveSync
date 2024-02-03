import * as PIXI from 'pixi.js';
import { Position } from '../core/types';

export class Entity {
    private _id: string;
    private _sprite: PIXI.Sprite;
    private _positionsBuffer: Array<{ timestamp: number, position: Position }>;

    public get id() {
        return this._id
    }

    public get sprite() {
        return this._sprite;
    }

    public get positionsBuffer() {
        return this._positionsBuffer;
    }

    constructor(id: string, sprite: PIXI.Sprite) {
        this._id = id;
        this._sprite = sprite;
        this._positionsBuffer = [];
    }

    public setColor(color: number) {
        this._sprite.tint = color;
    }

    public applyInput(input: Position) {
        this._sprite.position.set(input.x, input.y);
    }

    public addPositionToBuffer(positionData: { timestamp: number, position: Position }) {
        this._positionsBuffer.push(positionData);
    }
}
