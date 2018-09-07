import { px, style } from '../lib/types';
import { a, div, i, img, span } from '@hyperapp/html';
import { EditorLayout } from './editor';
import { VNode } from 'hyperapp';
import { parsePieceName, Piece } from '../lib/enums';

export const colorButton = ({ layout, piece, highlight, onclick }: {
    layout: EditorLayout,
    piece: Piece,
    highlight: boolean,
    onclick: (data: { piece: Piece }) => void,
}) => {
    const borderWidth = highlight ? 3 : 1;
    const pieceName = parsePieceName(piece);

    const contents = [
        img({
            src: `img/${pieceName}.svg`,
            height: (0.6 * layout.buttons.size.height) + '',
            style: style({
                margin: 'auto',
            }),
        }),
    ];

    return toolButton({
        borderWidth,
        contents,
        width: layout.buttons.size.width,
        margin: 5,
        backgroundColorClass: 'white',
        textColor: '#333',
        borderColor: highlight ? '#ff5252' : '#333',
        datatest: `btn-piece-${pieceName.toLowerCase()}`,
        key: `btn-piece-${pieceName.toLowerCase()}`,
        onclick: () => onclick({ piece }),
    });
};

export const inferenceButton = ({ layout, highlight, actions }: {
    layout: EditorLayout,
    highlight: boolean,
    actions: {
        selectInferencePieceColor: () => void;
    },
}) => {
    const contents = iconContents({
        height: layout.buttons.size.height,
        description: 'comp',
        iconSize: 22,
        iconName: 'image_aspect_ratio',
    });
    const borderWidth = highlight ? 3 : 1;

    return toolButton({
        borderWidth,
        contents,
        width: layout.buttons.size.width,
        margin: 5,
        backgroundColorClass: 'white',
        textColor: '#333',
        borderColor: highlight ? '#ff5252' : '#333',
        datatest: 'btn-piece-inference',
        key: 'btn-piece-inference',
        onclick: () => actions.selectInferencePieceColor(),
    });
};

export const iconContents = (
    { height, description, iconSize, iconName }: {
        height: number;
        description: string;
        iconSize: number;
        iconName: string;
    },
) => {
    const properties = style({
        display: 'block',
        height: px(height),
        lineHeight: px(height),
        fontSize: px(iconSize),
        border: 'solid 0px #000',
        marginRight: px(2),
        cursor: 'pointer',
    });

    const className = 'material-icons';

    const icon = i({
        className,
        style: properties,
    }, iconName);

    return [icon, ' ', span({ style: style({ fontSize: px(10) }) }, description)];
};

export const switchIconContents = (
    { height, description, iconSize, enable }: {
        height: number;
        description: string;
        iconSize: number;
        enable: boolean;
    },
) => {
    const properties = style({
        display: 'block',
        height: px(height),
        lineHeight: px(height),
        fontSize: px(iconSize),
        border: 'solid 0px #000',
        marginRight: px(2),
        cursor: 'pointer',
    });

    const className = 'material-icons';

    const icon = i({
        className,
        style: properties,
    }, enable ? 'check_box' : 'check_box_outline_blank');

    return [icon, ' ', span({ style: style({ fontSize: px(9) }) }, description)];
};

export const radioIconContents = (
    { height, description, iconSize, enable }: {
        height: number;
        description: string;
        iconSize: number;
        enable: boolean;
    },
) => {
    const properties = style({
        display: 'block',
        height: px(height),
        lineHeight: px(height),
        fontSize: px(iconSize),
        border: 'solid 0px #000',
        marginRight: px(2),
        cursor: 'pointer',
    });

    const className = 'material-icons';

    const icon = i({
        className,
        style: properties,
    }, enable ? 'radio_button_checked' : 'radio_button_unchecked');

    return [icon, ' ', span({ style: style({ fontSize: px(9) }) }, description)];
};

export const keyButton = (
    { width, height, toolButtonMargin, keyPage, currentIndex, actions }: {
        width: number;
        height: number;
        toolButtonMargin: number;
        keyPage: boolean;
        currentIndex: number;
        actions: {
            changeToRef: (data: { index: number }) => void;
            changeToKey: (data: { index: number }) => void;
        };
    }) => {
    const keyOnclick = keyPage ?
        () => actions.changeToRef({ index: currentIndex })
        : () => actions.changeToKey({ index: currentIndex });

    return switchButton({
        width,
        borderWidth: 1,
        margin: toolButtonMargin,
        backgroundColorClass: 'red',
        textColor: '#333',
        borderColor: '#f44336',
        datatest: 'btn-key-page',
        key: 'btn-key-ref-page',
        contents: switchIconContents({
            height,
            description: 'key',
            iconSize: 18,
            enable: keyPage,
        }),
        onclick: keyOnclick,
        enable: keyPage,
    });
};

export const toolButton = (
    {
        width, backgroundColorClass, textColor, borderColor, borderWidth = 1, borderType = 'solid',
        datatest, key, onclick, contents, flexGrow, margin,
    }: {
        flexGrow?: number;
        width: number;
        margin: number;
        backgroundColorClass: string;
        textColor: string;
        borderColor: string;
        borderWidth?: number;
        borderType?: string;
        datatest: string;
        key: string;
        contents: string | number | (string | number | VNode<{}>)[];
        onclick: (event: MouseEvent) => void;
    }) => {
    return a({
        datatest,
        key,
        href: '#',
        class: `waves-effect z-depth-0 btn ${backgroundColorClass}`,
        style: style({
            flexGrow,
            color: textColor,
            border: `${borderType} ${borderWidth}px ${borderColor}`,
            marginTop: px(margin),
            marginBottom: px(margin),
            width: px(width),
            maxWidth: px(width),
            textAlign: 'center',
        }),
        onclick: (event: MouseEvent) => {
            onclick(event);
            event.stopPropagation();
            event.preventDefault();
        },
    }, [
        div({
            style: {
                width: '100%',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                flexDirection: 'row',
                alignItems: 'center',
            },
        }, contents),
    ]);
};

export const switchButton = (
    {
        width, backgroundColorClass, textColor, borderColor, borderWidth = 1,
        datatest, key, onclick, contents, flexGrow, margin, enable,
    }: {
        flexGrow?: number;
        width: number;
        margin: number;
        backgroundColorClass: string;
        textColor: string;
        borderColor: string;
        borderWidth?: number;
        datatest: string;
        key: string;
        enable: boolean;
        contents: string | number | (string | number | VNode<{}>)[];
        onclick: (event: MouseEvent) => void;
    }) => {
    return a({
        key,
        href: '#',
        class: `waves-effect z-depth-0 btn ${enable ? backgroundColorClass : 'white'}`,
        datatest: `${datatest}-${enable ? 'on' : 'off'}`,
        style: style({
            flexGrow,
            color: enable ? '#fff' : textColor,
            border: enable ? `solid ${borderWidth}px ${borderColor}` : `dashed 1px #333`,
            marginTop: px(margin),
            marginBottom: px(margin),
            width: px(width),
            maxWidth: px(width),
            textAlign: 'center',
        }),
        onclick: (event: MouseEvent) => {
            onclick(event);
            event.stopPropagation();
            event.preventDefault();
        },
    }, [
        div({
            style: {
                width: '100%',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                flexDirection: 'row',
                alignItems: 'center',
            },
        }, contents),
    ]);
};

export const toolSpace = (
    { width, key, flexGrow, margin }: {
        flexGrow?: number;
        width: number;
        margin: number;
        key: string;
    }) => {
    return div({
        key,
        class: 'white',
        style: style({
            flexGrow,
            color: '#fff',
            border: `solid 0px #fff`,
            marginTop: px(margin),
            width: px(width),
            maxWidth: px(width),
            padding: px(0),
            boxSizing: 'border-box',
            textAlign: 'center',
        }),
    }, []);
};
