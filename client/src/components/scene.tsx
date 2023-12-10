import * as PIXI from 'pixi.js';
import { useEffect, useRef, useCallback } from 'react';
import { Viewport } from 'pixi-viewport';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../constants';

// https://davidfig.github.io/pixi-viewport/

export const Scene = () => {
    const rootRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<PIXI.Application | null>(null);
    const viewportRef = useRef<Viewport | null>(null);

    const handleResize = useCallback(() => {
        if (viewportRef.current === null || appRef.current === null) {
            return;
        }

        appRef.current.resize();
        viewportRef.current.resize(window.innerWidth, window.innerHeight);
    }, [viewportRef, appRef]);

    useEffect(() => {
        if (!rootRef.current || appRef.current) {
            return;
        }

        const app = new PIXI.Application<HTMLCanvasElement>({
            width: window.innerWidth,
            height: window.innerHeight,
            resizeTo: window,
        });

        rootRef.current.appendChild(app.view);

        const viewport = new Viewport({
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            worldWidth: WORLD_WIDTH,
            worldHeight: WORLD_HEIGHT,
            events: app.renderer.events
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        app.stage.addChild(viewport as any);

        viewport
            .drag()
            .pinch()
            .wheel()
            // .decelerate()
            .clampZoom({
                minScale: 0.15,
                maxScale: 12.50,
            });


        const sprite = viewport.addChild(new PIXI.Sprite(PIXI.Texture.WHITE))
        sprite.tint = 0xff0FA0
        sprite.width = sprite.height = 100
        sprite.position.set(350, 350)

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
    }, [rootRef, appRef]);

    useEffect(() => {
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [handleResize]);

    return (
        <div ref={rootRef} />
    );
}