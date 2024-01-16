import { Position } from '../core/types';

export class InputManager {
    private static instance: InputManager | null;

    private _pointerPosition: Position = { x: 0, y: 0 };
    private _keys: Record<string, boolean> = {};

    private constructor() {
        this.setupListeners();
    }

    public static getInstance(): InputManager {
        if (!InputManager.instance) {
            InputManager.instance = new InputManager();
        }

        return InputManager.instance;
    }

    public get pointerPosition(): Position {
        return this._pointerPosition;
    }

    public isKeyPressed(key: string): boolean {
        return this._keys[key] === true;
    }

    private setupListeners(): void {
        window.addEventListener('pointermove', this.handlePointerMove.bind(this));
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));
    }

    private handlePointerMove(event: PointerEvent): void {
        this._pointerPosition = { x: event.clientX, y: event.clientY };
    }

    private handleKeyDown(event: KeyboardEvent): void {
        this._keys[event.key] = true;
    }

    private handleKeyUp(event: KeyboardEvent): void {
        this._keys[event.key] = false;
    }
}