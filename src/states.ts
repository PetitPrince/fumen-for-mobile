import {
    AnimationState,
    CommentType,
    GradientPattern,
    ModeTypes,
    Piece,
    Platforms,
    Screens,
    TouchTypes,
} from './lib/enums';
import { HyperStage } from './lib/hyper';
import { Box } from './components/box';
import { PageEnv } from './env';
import { Block } from './state_types';
import { PrimitivePage } from './history_task';
import { generateKey } from './lib/random';
import konva from 'konva';
import { Page } from './lib/fumen/types';
import { Field } from './lib/fumen/field';
import { getURLQuery } from './params';

const VERSION = PageEnv.Version;

// Immutableにする
export interface State {
    field: Block[];
    sentLine: Block[];
    comment: {
        text: string;
        isChanged: boolean;
        changeKey: string;
    };
    display: {
        width: number;
        height: number;
    };
    hold?: Piece;
    nexts?: Piece[];
    play: {
        status: AnimationState;
        intervalTime: number;
    };
    fumen: {
        currentIndex: number;
        maxPage: number;
        pages: Page[];
        value?: string;
        errorMessage?: string;
        guideLineColor: boolean;
    };
    cache: {
        currentInitField: Field;
        taskKey?: string;
    };
    modal: {
        fumen: boolean;
        menu: boolean;
        append: boolean;
        clipboard: boolean;
        userSettings: boolean;
    };
    temporary: {
        userSettings: {
            ghostVisible: boolean;
            loop: boolean;
            gradient: string;
        };
    };
    handlers: {
        animation?: NodeJS.Timeout;
    };
    events: {
        piece?: Piece;
        drawing: boolean;
        inferences: number[];
        prevPage?: PrimitivePage;
        updated: boolean;
    };
    mode: {
        screen: Screens;
        type: ModeTypes;
        touch: TouchTypes;
        piece: Piece | undefined;
        comment: CommentType;
        ghostVisible: boolean;
        loop: boolean;
        gradient: {
            [piece in Piece]?: GradientPattern;
        };
    };
    history: {
        undoCount: number;
        redoCount: number;
    };
    version: string;
    platform: Platforms;
    controllerDisplay: {
        syncWithEditor: boolean;
    };
}

export const initState: Readonly<State> = {
    field: Array.from({ length: 230 }).map((ignore) => {
        return { piece: Piece.Empty };
    }),
    sentLine: Array.from({ length: 10 }).map((ignore) => {
        return { piece: Piece.Empty };
    }),
    comment: {
        text: '',
        isChanged: false,
        changeKey: generateKey(),
    },
    display: {
        width: window.document.body.clientWidth,
        height: window.document.body.clientHeight,
    },
    hold: undefined,
    nexts: undefined,
    play: {
        status: AnimationState.Pause,
        intervalTime: 1500,
    },
    fumen: {
        currentIndex: 0,
        maxPage: 1,
        pages: [{
            index: 0,
            comment: {
                text: '',
            },
            field: {
                obj: new Field({}),
            },
            flags: {
                colorize: true,
                lock: true,
                mirror: false,
                quiz: false,
                rise: false,
            },
        }],
        value: undefined,
        errorMessage: undefined,
        guideLineColor: true,
    },
    cache: {
        currentInitField: new Field({}),
        taskKey: undefined,
    },
    modal: {
        fumen: false,
        menu: false,
        append: false,
        clipboard: false,
        userSettings: false,
    },
    temporary: {
        userSettings: {
            ghostVisible: true,
            loop: false,
            gradient: '0000000',
        },
    },
    handlers: {
        animation: undefined,
    },
    events: {
        piece: undefined,  // 描画処理中のピースの種類
        drawing: false,
        inferences: [],
        prevPage: undefined,
        updated: false,
    },
    mode: {
        screen: window.location.hash.includes('#/edit') ? Screens.Editor : Screens.Reader,
        type: ModeTypes.DrawingTool,
        touch: TouchTypes.Drawing,
        piece: undefined,  // UI上で選択されているのピースの種類
        comment: CommentType.Writable,
        ghostVisible: true,
        loop: false,
        gradient: {},
    },
    history: {
        undoCount: 0,
        redoCount: 0,
    },
    version: VERSION,
    platform: getPlatform(),
    controllerDisplay: {
        syncWithEditor: false,
    },
};

export const resources = {
    modals: {
        menu: undefined as any,
        fumen: undefined as any,
        append: undefined as any,
        clipboard: undefined as any,
        userSettings: undefined as any,
    },
    konva: createKonvaObjects(),
    comment: undefined as ({ text: string, pageIndex: number } | undefined),
    focussedElement: undefined as (string | undefined),
};

interface Box {
    background: konva.Rect;
    pieces: konva.Rect[];
}

// konvaオブジェクトの作成
// 作成コストはやや大きめなので、必要なものは初めに作成する
function createKonvaObjects() {
    const obj = {
        stage: new HyperStage(),
        event: {} as konva.Rect,
        background: {} as konva.Rect,
        fieldMarginLine: {} as konva.Line,
        fieldBlocks: [] as konva.Rect[],
        sentBlocks: [] as konva.Rect[],
        hold: {} as Box,
        nexts: [] as Box[],
        layers: {
            background: new konva.Layer({ name: 'background' }),
            field: new konva.Layer({ name: 'field' }),
            boxes: new konva.Layer({ name: 'boxes' }),
            overlay: new konva.Layer({ name: 'overlay' }),
        },
    };
    const layers = obj.layers;

    // 背景
    {
        const rect = new konva.Rect({
            strokeWidth: 0,
            opacity: 1,
        });

        obj.background = rect;
        layers.background.add(rect);
    }

    // プレイエリアとせり上がりの間
    {
        const line = new konva.Line({
            points: [],
        });

        obj.fieldMarginLine = line;
        layers.background.add(line);
    }

    // フィールドブロック
    {
        const rects = Array.from({ length: 23 * 10 }).map(() => {
            return new konva.Rect({
                strokeWidth: 0,
                opacity: 1,
            });
        });

        obj.fieldBlocks = rects;
        for (const rect of rects) {
            layers.field.add(rect);
        }
    }

    // せり上がりブロック
    {
        const rects = Array.from({ length: 10 }).map(() => {
            return new konva.Rect({
                strokeWidth: 0,
                opacity: 0.75,
            });
        });

        obj.sentBlocks = rects;
        for (const rect of rects) {
            layers.field.add(rect);
        }
    }

    // Hold
    {
        const background = new konva.Rect({
            fill: '#333',
            strokeWidth: 1,
            stroke: '#666',
            opacity: 1,
        });

        const pieces = Array.from({ length: 4 }).map(() => {
            return new konva.Rect({
                fill: '#333',
                strokeWidth: 1,
                stroke: '#666',
                opacity: 1,
            });
        });

        obj.hold = { background, pieces };
        for (const rect of [background].concat(pieces)) {
            layers.boxes.add(rect);
        }
    }

    // Nexts
    {
        const nexts = Array.from({ length: 5 }).map(() => {
            const background = new konva.Rect({
                fill: '#333',
                strokeWidth: 1,
                stroke: '#666',
                opacity: 1,
            });

            const pieces = Array.from({ length: 4 }).map(() => {
                return new konva.Rect({
                    fill: '#333',
                    strokeWidth: 1,
                    stroke: '#666',
                    opacity: 1,
                });
            });

            return { background, pieces };
        });

        obj.nexts = nexts;
        for (const { background, pieces } of nexts) {
            for (const rect of [background].concat(pieces)) {
                layers.boxes.add(rect);
            }
        }
    }

    // Overlay
    // Event Layer
    {
        const rect = new konva.Rect({
            fill: '#333',
            opacity: 0.0,  // 0 ほど透過
            strokeEnabled: false,
            listening: true,
        });

        obj.event = rect;
        layers.overlay.add(rect);
    }

    return obj;
}

// PC or mobileの判定
function getPlatform(): Platforms {
    const urlQuery = getURLQuery();
    const mobile = urlQuery.get('mobile');
    if (mobile && !!Number(mobile)) {
        // URLに設定されている
        return Platforms.Mobile;
    }

    if (navigator.userAgent.match(/iPhone|iPad|Android/)) {
        return Platforms.Mobile;
    }
    return Platforms.PC;
}
