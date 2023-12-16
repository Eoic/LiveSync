import { Toolbar } from '.';
import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { useEffect, useRef, useCallback } from 'react';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../../constants';

// https://davidfig.github.io/pixi-viewport/

const Scene = () => {
    const rootRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<PIXI.Application | null>(null);
    const viewportRef = useRef<Viewport | null>(null);
    const dragPointRef = useRef<PIXI.IPointData | null>(null);
    const dragTargetRef = useRef<PIXI.IDisplayObjectExtended | null>(null);
    const intervalId = useRef<number | undefined>();
    const socketRef = useRef<WebSocket | null>(null);
    const marker = useRef<PIXI.Sprite | null>(null);

    // Awful, but keep this for now.
    // const [_mousePosition, _setMousePosition] = useState({ x: 0, y: 0 });
    const _mousePositionRef = useRef({ x: 0, y: 0 });

    const setMousePosition = (position: { x: number, y: number}) => {
        // _setMousePosition(position);
        _mousePositionRef.current = position;
    }

    const getMousePosition = () => {
        return _mousePositionRef.current;
    }
    // ---

    const handleResize = useCallback(() => {
        if (viewportRef.current === null || appRef.current === null) {
            return;
        }

        appRef.current.resize();
        viewportRef.current.resize(window.innerWidth, window.innerHeight);
    }, [viewportRef, appRef]);

    const handleDrag = useCallback((event: PIXI.FederatedPointerEvent) => {
        if (!dragTargetRef.current || !dragPointRef.current) {
            return;
        }

        const delta = event.getLocalPosition(dragTargetRef.current.parent);
        dragTargetRef.current.x = delta.x - dragPointRef.current.x;
        dragTargetRef.current.y = delta.y - dragPointRef.current.y;
    }, []);

    const handleDragStart = useCallback((event: PIXI.FederatedPointerEvent) => {
        event.stopPropagation();
        dragTargetRef.current = event.target as PIXI.DisplayObject;
        dragPointRef.current = event.getLocalPosition(event.target.parent as PIXI.DisplayObject);
        dragPointRef.current.x -= dragTargetRef.current.x;
        dragPointRef.current.y -= dragTargetRef.current.y;
        dragTargetRef.current.parent.on('pointermove', handleDrag);
    }, [handleDrag]);

    const handleDragEnd = useCallback((event: PIXI.FederatedPointerEvent) => {
        if (!dragTargetRef.current) {
            return;
        }

        event.stopPropagation();
        dragTargetRef.current.parent.off('pointermove', handleDrag);
    }, [handleDrag]);

    const handlePointerMove = useCallback((event: MouseEvent) => {
        event.stopPropagation();
        // const worldCenter = viewportRef.current!.center;
        const worldPos = viewportRef.current!.toWorld({ x: event.clientX, y: event.clientY });
        // const worldOffset = { x: WORLD_WIDTH / 2 - worldCenter.x, y: WORLD_HEIGHT / 2 - worldCenter.y };
        // const worldPosNoOffset = { x: worldPos.x + worldOffset.x, y: worldPos.y + worldOffset.y }
        setMousePosition(worldPos);
    }, []);

    const sendWorldPosition = useCallback(() => {
        if (getMousePosition() && socketRef.current !== null && socketRef.current.readyState === 1) {
            // console.log("Sending position...");
            const payload = JSON.stringify({ type: 'position', position: getMousePosition() });
            socketRef.current.send(payload);
        }
    }, []);

    const handleMessage = (event: MessageEvent) => {
        const data = JSON.parse(event.data);

        switch (data.type) {
            case 'position':
                if (marker.current) {
                    // console.log("setting position to", data.position)
                    marker.current.position.set(data.position.x, data.position.y);
                }

                // console.log(data.position);
                break;

            default:
                break;
        }
    }

    useEffect(() => {
        if (!rootRef.current || appRef.current) {
            return;
        }

        const app = new PIXI.Application<HTMLCanvasElement>({
            width: window.innerWidth,
            height: window.innerHeight,
            resizeTo: window,
            backgroundColor: 0x2F2F2F,
            autoDensity: true,
            antialias: true,
        });

        rootRef.current.appendChild(app.view);

        const viewport = new Viewport({
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            worldWidth: WORLD_WIDTH,
            worldHeight: WORLD_HEIGHT,
            events: app.renderer.events,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        app.stage.addChild(viewport);

        viewport
            .drag()
            .pinch()
            .wheel()
            .clampZoom({
                minScale: 0.15,
                maxScale: 12.50,
            });


        const worldCanvas = viewport.addChild(new PIXI.Sprite(PIXI.Texture.WHITE))
        worldCanvas.tint = 0x3F00FF;
        worldCanvas.width = WORLD_WIDTH;
        worldCanvas.height = WORLD_HEIGHT;
        worldCanvas.position.set(0, 0);
        worldCanvas.interactive = true

        window.addEventListener('pointermove', handlePointerMove);

        const square = viewport.addChild(new PIXI.Sprite(PIXI.Texture.WHITE));
        square.tint = 0xFF0FFA;
        square.width = square.height = 150;
        square.position.set(500, 700);
        square.eventMode = 'dynamic';

        square.on('pointerdown', handleDragStart);
        square.on('pointerup', handleDragEnd);
        square.on('pointerupoutside', handleDragEnd);
        marker.current = square;

        // PIXI.Assets.load('react.png').then((texture) => {
        //     const react = new PIXI.Sprite(texture);
        //     react.x = app.renderer.width / 2;
        //     react.y = app.renderer.height / 2;
        //     react.anchor.x = 0.5;
        //     react.anchor.y = 0.5;
        //     app.stage.addChild(react);

        //     app.ticker.add(() => {
        //         react.rotation += 0.01;
        //     })
        // }).catch((error) => {
        //     console.log(error);
        // })

        viewport.fit();
        viewport.moveCenter(WORLD_WIDTH / 2, WORLD_HEIGHT / 2)

        appRef.current = app;
        viewportRef.current = viewport;

        return () => {
            // console.log('Why is this called?')
            // window.removeEventListener('pointermove', handlePointerMove);
        }
    }, [
        rootRef,
        appRef,
        handleDragStart,
        handleDragEnd,
        handlePointerMove
    ]);

    useEffect(() => {
        intervalId.current = setInterval(sendWorldPosition, 10);
        return () => clearInterval(intervalId.current);
    }, [sendWorldPosition]);

    useEffect(() => {
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [handleResize]);

    useEffect(() => {
        if (socketRef.current !== null) {
            return;
        }

        // console.log('Setting up WebSocket instance.');
        const socket = new WebSocket('ws://localhost:6789');
        socket.addEventListener('message', handleMessage);
        socketRef.current = socket;
    }, []);

    return (
        <>
            <Toolbar mousePosition={getMousePosition()} />
            <div ref={rootRef} />
        </>
    );
};

export default Scene;
