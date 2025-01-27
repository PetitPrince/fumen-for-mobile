import { Component, px, style } from '../lib/types';
import { div, input } from '@hyperapp/html';

interface Props {
    dataTest: string;
    key: string;
    id: string;
    textColor: string;
    backgroundColorClass: string;
    height: number;
    text: string;
    readonly: boolean;
    placeholder?: string;
    currentIndex: number;
    actions: {
        updateCommentText: (data: { text?: string, pageIndex: number }) => void;
        commitCommentText: () => void;
    };
}

interface ButtonState {
    up: 'n' | 'p' | 'h';
    down: 'n' | 'p' | 'h';
    left: 'n' | 'p' | 'h';
    right: 'n' | 'p' | 'h';
    a: 'n' | 'p' | 'h';
    b: 'n' | 'p' | 'h';
    c: 'n' | 'p' | 'h';
}

const controllerStyle = style({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '10px',
});

const dpadStyle = style({
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 20px)',
    gridTemplateRows: 'repeat(3, 20px)',
    gap: '5px',
    marginBottom: '10px',
});

const buttonStyle = style({
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    backgroundColor: '#ccc',
});
const buttonStyleEditor = style({
    ...buttonStyle,
    cursor: 'pointer',
});
const getButtonStyle = (state: 'n' | 'p' | 'h') => {
    switch (state) {
        case 'p':
            return style({ ...buttonStyle, backgroundColor: '#FF3B3B' });
        case 'h':
            return style({ ...buttonStyle, backgroundColor: '#FFA63B' });
        default:
            return buttonStyle;
    }
};
const getButtonStyleForEditor = (state: 'n' | 'p' | 'h') => {
    switch (state) {
        case 'p':
            return style({ ...buttonStyleEditor, backgroundColor: '#FF3B3B' });
        case 'h':
            return style({ ...buttonStyleEditor, backgroundColor: '#FFA63B' });
        default:
            return buttonStyleEditor;
    }
};
const parseButtonState = (text: string): ButtonState => {
    const defaultState: ButtonState = {
        up: 'n',
        down: 'n',
        left: 'n',
        right: 'n',
        a: 'n',
        b: 'n',
        c: 'n',
    };

    const match = text.match(/\[(.*?)\]/);
    if (!match) return defaultState;

    const states = match[1].split('');
    return {
        up: states[0] as 'n' | 'p' | 'h',
        down: states[1] as 'n' | 'p' | 'h',
        left: states[2] as 'n' | 'p' | 'h',
        right: states[3] as 'n' | 'p' | 'h',
        a: states[4] as 'n' | 'p' | 'h',
        b: states[5] as 'n' | 'p' | 'h',
        c: states[6] as 'n' | 'p' | 'h',
    };
};

const cycleButtonState = (state: 'n' | 'p' | 'h'): 'n' | 'p' | 'h' => {
    switch (state) {
        case 'n':
            return 'p';
        case 'p':
            return 'h';
        case 'h':
            return 'n';
    }
};

const updateControllerText = (buttonState: ButtonState): string => {
    return `[${buttonState.up}${buttonState.down}${buttonState.left}${buttonState.right}${buttonState.a}${buttonState.b}${buttonState.c}]`;
};

const isDirectionButton = (button: keyof ButtonState): boolean => {
    return ['up', 'down', 'left', 'right'].includes(button);
};

const handleButtonClick = (button: keyof ButtonState, buttonState: ButtonState, actions: Props['actions'], currentIndex: number) => {
    let newState = { ...buttonState };
    
    if (isDirectionButton(button)) {
        // Reset all direction buttons
        ['up', 'down', 'left', 'right'].forEach(dir => {
            newState[dir as keyof ButtonState] = 'n';
        });
    }
    
    newState[button] = cycleButtonState(buttonState[button]);
    const newText = updateControllerText(newState);
    actions.updateCommentText({ text: newText, pageIndex: currentIndex });
    actions.commitCommentText();
};

const renderControllerForReader = (buttonState: ButtonState) => {
    return div({ style: controllerStyle }, [
        div({ style: dpadStyle }, [
            div(),
            div({ style: getButtonStyle(buttonState.up) }, '↑'),
            div(),
            div(),
            div(),
            div(),
            div({ style: getButtonStyle(buttonState.left) }, '←'),
            div(),
            div({ style: getButtonStyle(buttonState.right) }, '→'),
            div({ style: getButtonStyle(buttonState.a) }, 'A'),
            div({ style: getButtonStyle(buttonState.b) }, 'B'),
            div({ style: getButtonStyle(buttonState.c) }, 'C'),
            div(),
            div({ style: getButtonStyle(buttonState.down) }, '↓'),
            div(),
            div(),
            div(),
            div(),
        ]),
    ]);
};

const renderControllerForEditor = (buttonState: ButtonState, actions: Props['actions'], currentIndex: number) => {
    return div({ style: controllerStyle }, [
        div({ style: dpadStyle }, [
            div(),
            div({ style: getButtonStyleForEditor(buttonState.up), onclick: () => handleButtonClick('up', buttonState, actions, currentIndex) }, '↑'),
            div(),
            div(),
            div(),
            div(),
            div({ style: getButtonStyleForEditor(buttonState.left), onclick: () => handleButtonClick('left', buttonState, actions, currentIndex) }, '←'),
            div(),
            div({ style: getButtonStyleForEditor(buttonState.right), onclick: () => handleButtonClick('right', buttonState, actions, currentIndex) }, '→'),
            div({ style: getButtonStyleForEditor(buttonState.a), onclick: () => handleButtonClick('a', buttonState, actions, currentIndex) }, 'A'),
            div({ style: getButtonStyleForEditor(buttonState.b), onclick: () => handleButtonClick('b', buttonState, actions, currentIndex) }, 'B'),
            div({ style: getButtonStyleForEditor(buttonState.c), onclick: () => handleButtonClick('c', buttonState, actions, currentIndex) }, 'C'),
            div(),
            div({ style: getButtonStyleForEditor(buttonState.down), onclick: () => handleButtonClick('down', buttonState, actions, currentIndex) }, '↓'),
            div(),
            div(),
            div(),
            div(),
        ]),
    ]);
};

export const comment: Component<Props> = (
    {
        height, textColor, backgroundColorClass, dataTest, key, id, text,
        readonly, placeholder, currentIndex, actions,
    },
) => {
    const commentStyle = style({
        width: '100%',
        height: px(height),
        lineHeight: px(height),
        fontSize: px(height * 0.6),
        boxSizing: 'border-box',
        textAlign: 'center',
        border: 'none',
        color: textColor,
    });

    const buttonState = parseButtonState(text);

    if (readonly) {
        return div({
            style: style({
                width: '100%',
                height: px(height * 4),
                whiteSpace: 'nowrap',
            }),
        }, [
            renderControllerForReader(buttonState),
            input({
                id,
                key,
                dataTest,
                placeholder,
                value: text.replace(/\[.*?\]/, '').trim(),
                type: 'text',
                className: backgroundColorClass,
                style: commentStyle,
                readonly: 'readonly',
            }),

        ]);
    }

    const oncreate = (element: HTMLInputElement) => {
        element.value = text;
    };

    const update = (event: KeyboardEvent | FocusEvent) => {
        if (event.target !== null) {
            const target = event.target as HTMLInputElement;
            actions.updateCommentText({ text: target.value, pageIndex: currentIndex });
        }
    };

    const blur = (event: KeyboardEvent) => {
        if (event.target !== null) {
            const target = event.target as HTMLInputElement;
            target.blur();
        }
    };

    const onblur = () => {
        actions.commitCommentText();
    };

    let lastComposingOnEnterDown = true;

    const onkeydown = (event: KeyboardEvent) => {
        // 最後にEnterを押されたときのisComposingを記録する
        // IMEで変換しているときはtrueになる
        if (event.key === 'Enter') {
            lastComposingOnEnterDown = event.isComposing;
        }
    };

    const onkeyup = (event: KeyboardEvent) => {
        // 最後にエンターが押されたか (IMEには反応しない)
        if (!event.isComposing && !lastComposingOnEnterDown && event.key === 'Enter') {
            blur(event);
        }
    };

    return div({
        style: style({
            width: '100%',
            height: px(height*4),
            whiteSpace: 'nowrap',
        }),
    }, [
        renderControllerForEditor(buttonState, actions, currentIndex),
        input({
            // `value` を設定すると、（undefinedでも）更新のたびにそれまで入力していた文字も消えてしまうため、使用しない
            id,
            key,
            dataTest,
            placeholder,
            oncreate,
            onblur,
            onkeydown,
            onkeyup,
            oninput: update,
            onfocus: update,
            type: 'text',
            className: backgroundColorClass,
            style: commentStyle,
        })
    ]);
};
