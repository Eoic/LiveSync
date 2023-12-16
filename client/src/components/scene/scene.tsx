import { Toolbar } from '.';
import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { useEffect, useRef, useCallback, useState } from 'react';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../../constants';

// https://davidfig.github.io/pixi-viewport/

const Scene = () => {
    const rootRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<PIXI.Application | null>(null);
    const viewportRef = useRef<Viewport | null>(null);
    const dragPointRef = useRef<PIXI.IPointData | null>(null);
    const dragTargetRef = useRef<PIXI.IDisplayObjectExtended | null>(null);

    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

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
        
        viewport.onpointermove = (event) => {
            const worldCenter = viewportRef.current!.center;
            const worldPos = viewportRef.current!.toWorld(event.client);
            console.log("World offset:", Math.round(worldPos.x - worldCenter.x), Math.round(worldPos.y - worldCenter.y));
            setMousePosition(viewport.toWorld(event.clientX, event.clientY));
        }

        const square = viewport.addChild(new PIXI.Sprite(PIXI.Texture.WHITE));
        square.tint = 0xFF0FFA;
        square.width = square.height = 150;
        square.position.set(500, 700);
        square.eventMode = 'dynamic';

        square.on('pointerdown', handleDragStart);
        square.on('pointerup', handleDragEnd);
        square.on('pointerupoutside', handleDragEnd);
        

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
    }, [rootRef, appRef, handleDragStart, handleDragEnd]);

    useEffect(() => {
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [handleResize]);

    return (
        <>
            <Toolbar mousePosition={mousePosition} />
            <div ref={rootRef} />
        </>
    );
};

export default Scene;
