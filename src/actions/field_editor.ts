import { Piece, Rotation, toPositionIndex, TouchTypes } from '../lib/enums';
import { action, actions } from '../actions';
import { NextState, sequence } from './commons';
import { putPieceActions } from './put_piece';
import { drawBlockActions } from './draw_block';
import { fillActions } from './fill';
import { toPrimitivePage, toSinglePageTask } from '../history_task';
import { movePieceActions } from './move_piece';
import { PageFieldOperation, Pages } from '../lib/pages';
import { testLeftRotation, testRightRotation } from '../lib/srs';
import { fillRowActions } from './fill_row';
import { ViewError } from '../lib/errors';
import { Field } from '../lib/fumen/field';
import { getBlockPositions } from '../lib/piece';

export interface FieldEditorActions {
    fixInferencePiece(): action;

    clearInferencePiece(): action;

    resetInferencePiece(): action;

    removeUnsettledItemsInField(): action;

    ontouchStartField(data: { index: number }): action;

    ontouchMoveField(data: { index: number }): action;

    ontouchEnd(): action;

    ontouchStartSentLine(data: { index: number }): action;

    ontouchMoveSentLine(data: { index: number }): action;

    selectPieceColor(data: { piece: Piece }): action;

    selectInferencePieceColor(): action;

    spawnPiece(data: { piece: Piece, guideline: boolean }): action;

    clearPiece(): action;

    rotateToLeft(): action;

    rotateToRight(): action;

    moveToLeft(): action;

    moveToLeftEnd(): action;

    moveToRight(): action;

    moveToRightEnd(): action;

    harddrop(): action;
}

export const fieldEditorActions: Readonly<FieldEditorActions> = {
    fixInferencePiece: () => (state): NextState => {
        switch (state.mode.touch) {
        case TouchTypes.Drawing:
            return drawBlockActions.fixInferencePiece()(state);
        case TouchTypes.Piece:
            return putPieceActions.fixInferencePiece()(state);
        }
        return undefined;
    },
    clearInferencePiece: () => (state): NextState => {
        switch (state.mode.touch) {
        case TouchTypes.Drawing:
            return drawBlockActions.clearInferencePiece()(state);
        case TouchTypes.Piece:
            return putPieceActions.clearInferencePiece()(state);
        }
        return undefined;
    },
    resetInferencePiece: () => (state): NextState => {
        switch (state.mode.touch) {
        case TouchTypes.Drawing:
            return drawBlockActions.resetInferencePiece()(state);
        case TouchTypes.Piece:
            return putPieceActions.resetInferencePiece()(state);
        }
        return undefined;
    },
    removeUnsettledItemsInField: () => (state): NextState => {
        return sequence(state, [
            fieldEditorActions.fixInferencePiece(),
            fieldEditorActions.resetInferencePiece(),
        ]);
    },
    ontouchStartField: ({ index }) => (state): NextState => {
        switch (state.mode.touch) {
        case TouchTypes.Drawing:
            return drawBlockActions.ontouchStartField({ index })(state);
        case TouchTypes.Piece:
            return putPieceActions.ontouchStartField({ index })(state);
        case TouchTypes.MovePiece:
            return movePieceActions.ontouchStartField({ index })(state);
        case TouchTypes.FillRow:
            return fillRowActions.ontouchStartField({ index })(state);
        case TouchTypes.Fill:
            return fillActions.ontouchStartField({ index })(state);
        }
        return undefined;
    },
    ontouchMoveField: ({ index }) => (state): NextState => {
        switch (state.mode.touch) {
        case TouchTypes.Drawing:
            return drawBlockActions.ontouchMoveField({ index })(state);
        case TouchTypes.Piece:
            return putPieceActions.ontouchMoveField({ index })(state);
        case TouchTypes.MovePiece:
            return movePieceActions.ontouchMoveField({ index })(state);
        case TouchTypes.FillRow:
            return fillRowActions.ontouchMoveField({ index })(state);
        case TouchTypes.Fill:
            return fillActions.ontouchMoveField({ index })(state);
        }
        return undefined;
    },
    ontouchEnd: () => (state): NextState => {
        switch (state.mode.touch) {
        case TouchTypes.Drawing:
            return drawBlockActions.ontouchEnd()(state);
        case TouchTypes.Piece:
            return putPieceActions.ontouchEnd()(state);
        case TouchTypes.MovePiece:
            return movePieceActions.ontouchEnd()(state);
        case TouchTypes.FillRow:
            return fillRowActions.ontouchEnd()(state);
        case TouchTypes.Fill:
            return fillActions.ontouchEnd()(state);
        }
        return undefined;
    },
    ontouchStartSentLine: ({ index }) => (state): NextState => {
        switch (state.mode.touch) {
        case TouchTypes.Drawing:
            return drawBlockActions.ontouchStartSentLine({ index })(state);
        case TouchTypes.FillRow:
            return fillRowActions.ontouchStartSentLine({ index })(state);
        case TouchTypes.Fill:
            return fillActions.ontouchStartSentLine({ index })(state);
        }
        return undefined;
    },
    ontouchMoveSentLine: ({ index }) => (state): NextState => {
        switch (state.mode.touch) {
        case TouchTypes.Drawing:
            return drawBlockActions.ontouchMoveSentLine({ index })(state);
        case TouchTypes.FillRow:
            return fillRowActions.ontouchMoveSentLine({ index })(state);
        case TouchTypes.Fill:
            return fillActions.ontouchMoveSentLine({ index })(state);
        }
        return undefined;
    },
    selectPieceColor: ({ piece }) => (state): NextState => {
        return sequence(state, [
            actions.removeUnsettledItems(),
            newState => ({
                mode: {
                    ...newState.mode,
                    piece,
                },
            }),
        ]);
    },
    selectInferencePieceColor: () => (state): NextState => {
        return sequence(state, [
            actions.removeUnsettledItems(),
            newState => ({
                mode: {
                    ...newState.mode,
                    piece: undefined,
                },
            }),
        ]);
    },
    spawnPiece: ({ piece, guideline }) => (state): NextState => {
        if (piece === Piece.Gray || piece === Piece.Empty) {
            throw new ViewError(`Unsupported piece: ${piece}`);
        }

        const pages = state.fumen.pages;
        const pageIndex = state.fumen.currentIndex;
        const page = pages[pageIndex];
        if (page === undefined) {
            return undefined;
        }

        let next;
        if (guideline) {
            next = { type: piece, rotation: Rotation.Spawn, coordinate: { x: 4, y: 20 } };
        } else if (piece === Piece.I) {
            next = { type: piece, rotation: Rotation.Reverse, coordinate: { x: 5, y: 20 } };
        } else if (piece === Piece.O) {
            next = { type: piece, rotation: Rotation.Reverse, coordinate: { x: 5, y: 21 } };
        } else {
            next = { type: piece, rotation: Rotation.Reverse, coordinate: { x: 4, y: 21 } };
        }

        const currentMove = page.piece;
        if (currentMove !== undefined
            && currentMove.type === next.type
            && currentMove.rotation === next.rotation
            && currentMove.coordinate.x === next.coordinate.x
            && currentMove.coordinate.y === next.coordinate.y
        ) {
            return sequence(state, [
                fieldEditorActions.resetInferencePiece(),
            ]);
        }

        const prevPage = toPrimitivePage(page);
        page.piece = next;

        return sequence(state, [
            fieldEditorActions.resetInferencePiece(),
            actions.registerHistoryTask({ task: toSinglePageTask(pageIndex, prevPage, page) }),
            actions.reopenCurrentPage(),
        ]);
    },
    clearPiece: () => (state): NextState => {
        const pages = state.fumen.pages;
        const pageIndex = state.fumen.currentIndex;
        const page = pages[pageIndex];
        if (page === undefined) {
            return undefined;
        }

        if (page.piece === undefined) {
            return fieldEditorActions.resetInferencePiece()(state);
        }

        const prevPage = toPrimitivePage(page);
        page.piece = undefined;

        return sequence(state, [
            fieldEditorActions.resetInferencePiece(),
            actions.registerHistoryTask({ task: toSinglePageTask(pageIndex, prevPage, page) }),
            actions.reopenCurrentPage(),
        ]);
    },
    rotateToLeft: () => (state): NextState => {
        const pages = state.fumen.pages;
        const pageIndex = state.fumen.currentIndex;
        const page = pages[pageIndex];
        if (page === undefined) {
            return undefined;
        }

        const piece = page.piece;
        if (piece === undefined) {
            return undefined;
        }

        const pagesObj = new Pages(pages);
        const field = pagesObj.getField(pageIndex, PageFieldOperation.Command);

        const testObj = testLeftRotation(piece.type, piece.rotation);
        const nextRotation = testObj.rotation;
        const test = testCallback(field, piece.type, nextRotation);

        const coordinate = piece.coordinate;
        const testPositions = testObj.test.map((value) => {
            value[0] += coordinate.x;
            value[1] += coordinate.y;
            return value;
        });

        const element = testPositions.find(position => test(position[0], position[1]));
        if (element === undefined) {
            return undefined;
        }

        const prevPage = toPrimitivePage(page);
        page.piece = {
            ...piece,
            rotation: nextRotation,
            coordinate: {
                x: element[0],
                y: element[1],
            },
        };
        if (state.controllerDisplay.syncWithEditor) {
            page.comment.text = updateCommentText(page.comment.text ?? '', 'rotateLeft');
        }

        return sequence(state, [
            fieldEditorActions.resetInferencePiece(),
            actions.registerHistoryTask({ task: toSinglePageTask(pageIndex, prevPage, page) }),
            actions.reopenCurrentPage(),
        ]);
    },
    rotateToRight: () => (state): NextState => {
        const pages = state.fumen.pages;
        const pageIndex = state.fumen.currentIndex;
        const page = pages[pageIndex];
        if (page === undefined) {
            return undefined;
        }

        const piece = page.piece;
        if (piece === undefined) {
            return undefined;
        }

        const pagesObj = new Pages(pages);
        const field = pagesObj.getField(pageIndex, PageFieldOperation.Command);

        const testObj = testRightRotation(piece.type, piece.rotation);
        const nextRotation = testObj.rotation;
        const test = testCallback(field, piece.type, nextRotation);

        const coordinate = piece.coordinate;
        const testPositions = testObj.test.map((value) => {
            value[0] += coordinate.x;
            value[1] += coordinate.y;
            return value;
        });

        const element = testPositions.find(position => test(position[0], position[1]));
        if (element === undefined) {
            return undefined;
        }

        const prevPage = toPrimitivePage(page);
        page.piece = {
            ...piece,
            rotation: nextRotation,
            coordinate: {
                x: element[0],
                y: element[1],
            },
        };
        if (state.controllerDisplay.syncWithEditor) {
            page.comment.text = updateCommentText(page.comment.text ?? '', 'rotateRight');
        }

        return sequence(state, [
            fieldEditorActions.resetInferencePiece(),
            actions.registerHistoryTask({ task: toSinglePageTask(pageIndex, prevPage, page) }),
            actions.reopenCurrentPage(),
        ]);
    },
    moveToLeft: () => (state): NextState => {
        const pages = state.fumen.pages;
        const pageIndex = state.fumen.currentIndex;
        const page = pages[pageIndex];
        if (page === undefined) {
            return undefined;
        }

        const piece = page.piece;
        if (piece === undefined) {
            return undefined;
        }

        const pagesObj = new Pages(pages);
        const field = pagesObj.getField(pageIndex, PageFieldOperation.Command);

        const test = testCallback(field, piece.type, piece.rotation);

        const coordinate = piece.coordinate;
        if (!test(coordinate.x - 1, coordinate.y)) {
            return undefined;
        }

        const prevPage = toPrimitivePage(page);
        page.piece = {
            ...piece,
            coordinate: {
                x: coordinate.x - 1,
                y: coordinate.y,
            },
        };
        if (state.controllerDisplay.syncWithEditor) {
            page.comment.text = updateCommentText(page.comment.text ?? '', 'moveLeft');
        }

        return sequence(state, [
            fieldEditorActions.resetInferencePiece(),
            actions.registerHistoryTask({ task: toSinglePageTask(pageIndex, prevPage, page) }),
            actions.reopenCurrentPage(),
        ]);
    },
    moveToLeftEnd: () => (state): NextState => {
        const pages = state.fumen.pages;
        const pageIndex = state.fumen.currentIndex;
        const page = pages[pageIndex];
        if (page === undefined) {
            return undefined;
        }

        const piece = page.piece;
        if (piece === undefined) {
            return undefined;
        }

        const pagesObj = new Pages(pages);
        const field = pagesObj.getField(pageIndex, PageFieldOperation.Command);

        const test = testCallback(field, piece.type, piece.rotation);

        const coordinate = piece.coordinate;
        let x = coordinate.x;
        while (test(x - 1, coordinate.y)) {
            x -= 1;
        }

        if (x === coordinate.x) {
            return undefined;
        }

        const prevPage = toPrimitivePage(page);
        page.piece = {
            ...piece,
            coordinate: {
                x,
                y: coordinate.y,
            },
        };
        if (state.controllerDisplay.syncWithEditor) {
            page.comment.text = updateCommentText(page.comment.text ?? '', 'moveLeftEnd');
        }

        return sequence(state, [
            fieldEditorActions.resetInferencePiece(),
            actions.registerHistoryTask({ task: toSinglePageTask(pageIndex, prevPage, page) }),
            actions.reopenCurrentPage(),
        ]);
    },
    moveToRight: () => (state): NextState => {
        const pages = state.fumen.pages;
        const pageIndex = state.fumen.currentIndex;
        const page = pages[pageIndex];
        if (page === undefined) {
            return undefined;
        }

        const piece = page.piece;
        if (piece === undefined) {
            return undefined;
        }

        const pagesObj = new Pages(pages);
        const field = pagesObj.getField(pageIndex, PageFieldOperation.Command);

        const test = testCallback(field, piece.type, piece.rotation);

        const coordinate = piece.coordinate;
        if (!test(coordinate.x + 1, coordinate.y)) {
            return undefined;
        }

        const prevPage = toPrimitivePage(page);
        page.piece = {
            ...piece,
            coordinate: {
                x: coordinate.x + 1,
                y: coordinate.y,
            },
        };
        if (state.controllerDisplay.syncWithEditor) {
            page.comment.text = updateCommentText(page.comment.text ?? '', 'moveRight');
        }

        return sequence(state, [
            fieldEditorActions.resetInferencePiece(),
            actions.registerHistoryTask({ task: toSinglePageTask(pageIndex, prevPage, page) }),
            actions.reopenCurrentPage(),
        ]);
    },
    moveToRightEnd: () => (state): NextState => {
        const pages = state.fumen.pages;
        const pageIndex = state.fumen.currentIndex;
        const page = pages[pageIndex];
        if (page === undefined) {
            return undefined;
        }

        const piece = page.piece;
        if (piece === undefined) {
            return undefined;
        }

        const pagesObj = new Pages(pages);
        const field = pagesObj.getField(pageIndex, PageFieldOperation.Command);

        const test = testCallback(field, piece.type, piece.rotation);

        const coordinate = piece.coordinate;
        let x = coordinate.x;
        while (test(x + 1, coordinate.y)) {
            x += 1;
        }

        if (x === coordinate.x) {
            return undefined;
        }

        const prevPage = toPrimitivePage(page);
        page.piece = {
            ...piece,
            coordinate: {
                x,
                y: coordinate.y,
            },
        };
        if (state.controllerDisplay.syncWithEditor) {
            page.comment.text = updateCommentText(page.comment.text ?? '', 'moveRightEnd');
        }

        return sequence(state, [
            fieldEditorActions.resetInferencePiece(),
            actions.registerHistoryTask({ task: toSinglePageTask(pageIndex, prevPage, page) }),
            actions.reopenCurrentPage(),
        ]);
    },
    harddrop: () => (state): NextState => {
        const pages = state.fumen.pages;
        const pageIndex = state.fumen.currentIndex;
        const page = pages[pageIndex];
        if (page === undefined) {
            return undefined;
        }

        const piece = page.piece;
        if (piece === undefined) {
            return undefined;
        }

        const pagesObj = new Pages(pages);
        const field = pagesObj.getField(pageIndex, PageFieldOperation.Command);

        const test = testCallback(field, piece.type, piece.rotation);
        let currentY = piece.coordinate.y;
        for (let y = piece.coordinate.y - 1; 0 <= y; y -= 1) {
            if (!test(piece.coordinate.x, y)) {
                break;
            }
            currentY = y;
        }

        if (currentY === piece.coordinate.y) {
            return undefined;
        }

        const prevPage = toPrimitivePage(page);
        page.piece = {
            ...piece,
            coordinate: {
                ...piece.coordinate,
                y: currentY,
            },
        };
        if (state.controllerDisplay.syncWithEditor) {
            page.comment.text = updateCommentText(page.comment.text ?? '', 'harddrop');
        }

        return sequence(state, [
            fieldEditorActions.resetInferencePiece(),
            actions.registerHistoryTask({ task: toSinglePageTask(pageIndex, prevPage, page) }),
            actions.reopenCurrentPage(),
        ]);
    },
};

const testCallback = (field: Field, piece: Piece, rotation: Rotation) => {
    return (x: number, y: number) => {
        const positions = getBlockPositions(piece, rotation, x, y);
        const isGroundOver = positions.some(pos => pos[0] < 0 || 10 <= pos[0] || pos[1] < 0 || 24 <= pos[1]);
        if (isGroundOver) {
            return false;
        }

        const isConflicted = positions.map(toPositionIndex).some(i => field.getAtIndex(i, true) !== Piece.Empty);
        return !isConflicted;
    };
};

const encodeMove = (action: string) => {
    switch (action) {
    case 'rotateLeft':
        return '[nnnnpnn]';
    case 'rotateRight':
        return '[nnnnnpn]';
    case 'moveLeft':
        return '[nnpnnnn]';
    case 'moveRight':
        return '[nnnpnnn]';
    case 'moveLeftEnd':
        return '[nnpnnnn]';
    case 'moveRightEnd':
        return '[nnpnnnn]';
    case 'harddrop':
        return '[pnnnnnn]';
    default:
        return '';
    }
};

const updateCommentText = (comment: string, action: string) => {
    const encodedMove = encodeMove(action);
    const rotationPattern = /\[nnnnpnn\]|\[nnnnnpn\]/;
    const movementPattern = /\[nnpnnnn\]|\[nnnpnnn\]|\[nnpnnnn\]|\[pnnnnnn\]/;

    let newComment = comment;

    if (rotationPattern.test(encodedMove)) {
        if (rotationPattern.test(newComment)) {
            newComment = newComment.replace(rotationPattern, encodedMove);
        } else {
            newComment = `${encodedMove} ${newComment}`;
        }
    } else if (movementPattern.test(encodedMove)) {
        if (movementPattern.test(newComment)) {
            newComment = newComment.replace(movementPattern, encodedMove);
        } else {
            newComment = `${encodedMove} ${newComment}`;
        }
    }

    return newComment;
};
