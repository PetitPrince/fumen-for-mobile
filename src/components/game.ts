import { HyperHammer, HyperStage } from '../lib/hyper';
import { Component, style } from '../lib/types';
import { main } from '@hyperapp/html';
import konva = require('konva');

interface GameProps {
    key: string;
    canvas: {
        width: number;
        height: number;
    };
    stage: HyperStage;
    hammer: HyperHammer;
    backPage: () => void;
    nextPage: () => void;
}

export const game: Component<GameProps> = (props, children) => {
    const onTap = (event: HammerInput) => {
        if (event.center.x < props.canvas.width / 2) {
            props.backPage();
        } else {
            props.nextPage();
        }
    };
    return main({
        id: 'container',
        key: props.key,
        style: style({
            width: props.canvas.width,
            height: props.canvas.height + 'px',
        }),
        canvas: props.canvas,
        oncreate: (element: HTMLMainElement) => {
            // この時点でcontainer内に新しい要素が作られるため、
            // この要素内には hyperapp 管理下の要素を作らないこと
            const stage = new konva.Stage({
                container: element,
                width: props.canvas.width,
                height: props.canvas.height,
            });

            props.stage.addStage(stage);

            const hammer = new Hammer(element);
            // hammer.get('pinch').set({ enable: true });

            const hyperHammer = props.hammer;
            hyperHammer.register(hammer);
            hyperHammer.tap = onTap;
            hammer.on('tap', hyperHammer.tap);
        },
        onupdate: (element: any, attr: any) => {
            if (attr.canvas.width !== props.canvas.width || attr.canvas.height !== props.canvas.height) {
                props.stage.resize(props.canvas);
            }
            const hyperHammer = props.hammer;
            hyperHammer.tap = onTap;
        },
    }, children);
};
