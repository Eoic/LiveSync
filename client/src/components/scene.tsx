import { Application } from 'pixi.js';
import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';

export const Scene = () => {
    const rootRef = useRef<HTMLDivElement | null>(null);
    const appRef = useRef<Application | null>(null);

    useEffect(() => {
        if (!rootRef || appRef.current) {
            return;
        }

        const app = new PIXI.Application<HTMLCanvasElement>({
            width: window.innerWidth,
            height: window.innerHeight
        });

        document.body.appendChild(app.view);

        PIXI.Assets.load('react.png').then((texture) => {
            const react = new PIXI.Sprite(texture);
            react.x = app.renderer.width / 2;
            react.y = app.renderer.height / 2;
            react.anchor.x = 0.5;
            react.anchor.y = 0.5;
            app.stage.addChild(react);

            app.ticker.add(() => {
                react.rotation += 0.01;
            })
        }).catch((error) => {
            console.log(error);
        })

        appRef.current = app;
    }, [rootRef, appRef]);

    return (
        <div ref={rootRef} />
    );
}