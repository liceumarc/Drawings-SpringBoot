import { createPathShape, findShapeAt } from './shapes.js';

export class DrawingPointerController {
    constructor(editor) {
        this.editor = editor;
        this.drag = null;
        this.gesture = null;
    }

    bindEvents() {
        const { canvas } = this.editor;
        canvas.addEventListener('pointerdown', (event) => this.onPointerDown(event));
        canvas.addEventListener('pointermove', (event) => this.onPointerMove(event));
        canvas.addEventListener('pointerup', (event) => this.onPointerEnd(event));
        canvas.addEventListener('pointercancel', (event) => this.onPointerEnd(event));
    }

    onPointerDown(event) {
        if (!event.isPrimary || event.button !== 0) {
            return;
        }

        const editor = this.editor;
        editor.commitPendingEdit();
        const point = pointFromEvent(editor.canvas, event);

        if (this.startDrawingTool(event, point)) {
            return;
        }
        this.selectShapeAtPoint(event, point);
    }

    startDrawingTool(event, point) {
        const editor = this.editor;
        if (editor.state.tool === 'freehand') {
            this.beginFreehand(event, point);
            return true;
        }
        if (editor.state.tool !== 'select') {
            editor.addRegularShape(point);
            return true;
        }
        return false;
    }

    selectShapeAtPoint(event, point) {
        const editor = this.editor;
        const shape = findShapeAt(
            editor.context,
            editor.state.objects,
            point.x,
            point.y,
        );

        if (!shape) {
            editor.clearSelection();
            return;
        }

        this.startDraggingShape(shape, event, point);
    }

    startDraggingShape(shape, event, point) {
        const editor = this.editor;
        editor.state.selectedId = shape.id;
        this.drag = {
            pointerId: event.pointerId,
            shapeId: shape.id,
            offsetX: shape.x - point.x,
            offsetY: shape.y - point.y,
        };
        editor.canvas.setPointerCapture(event.pointerId);
        editor.canvas.style.cursor = 'grabbing';
        editor.view.renderAll();
        editor.persist();
    }

    onPointerMove(event) {
        const point = pointFromEvent(this.editor.canvas, event);
        if (this.moveDraggedShape(event, point)) {
            return;
        }
        if (this.addPointToGesture(event, point)) {
            return;
        }
        this.updateCursorForSelection(point);
    }

    moveDraggedShape(event, point) {
        if (!this.drag || event.pointerId !== this.drag.pointerId) {
            return false;
        }

        const editor = this.editor;
        const shape = editor.findShape(this.drag.shapeId);
        if (!shape) {
            this.drag = null;
            return true;
        }

        shape.x = clamp(
            Math.round(point.x + this.drag.offsetX),
            0,
            editor.state.width,
        );
        shape.y = clamp(
            Math.round(point.y + this.drag.offsetY),
            0,
            editor.state.height,
        );
        editor.view.renderCanvas();
        editor.view.renderProperties();
        return true;
    }

    addPointToGesture(event, point) {
        if (!this.gesture || event.pointerId !== this.gesture.pointerId) {
            return false;
        }

        this.gesture.points.push(point);
        this.editor.view.renderCanvas();
        return true;
    }

    updateCursorForSelection(point) {
        const editor = this.editor;
        if (editor.state.tool !== 'select') {
            return;
        }

        const shape = findShapeAt(
            editor.context,
            editor.state.objects,
            point.x,
            point.y,
        );
        editor.canvas.style.cursor = shape ? 'grab' : 'default';
    }

    onPointerEnd(event) {
        if (this.finishDragging(event)) {
            return;
        }
        this.finishFreehandGesture(event);
    }

    finishDragging(event) {
        if (!this.drag || event.pointerId !== this.drag.pointerId) {
            return false;
        }

        this.drag = null;
        this.editor.recordChange();
        this.editor.canvas.style.cursor = 'grab';
        return true;
    }

    finishFreehandGesture(event) {
        if (!this.gesture || event.pointerId !== this.gesture.pointerId) {
            return;
        }

        const gesture = this.gesture;
        this.gesture = null;
        if (event.type === 'pointercancel') {
            this.editor.view.renderCanvas();
            return;
        }

        const shape = createPathShape(
            'freehand',
            gesture.points,
            this.editor.state.objects,
        );
        if (!shape) {
            this.editor.view.renderCanvas();
            return;
        }

        this.editor.state.objects.push(shape);
        this.editor.state.selectedId = shape.id;
        this.editor.recordChange();
    }

    beginFreehand(event, point) {
        this.gesture = { pointerId: event.pointerId, points: [point] };
        this.editor.canvas.setPointerCapture(event.pointerId);
        this.editor.view.renderCanvas();
    }
}

function pointFromEvent(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    const contentWidth = rect.width - canvas.clientLeft * 2;
    const contentHeight = rect.height - canvas.clientTop * 2;

    if (contentWidth <= 0 || contentHeight <= 0) {
        return { x: 0, y: 0 };
    }

    return {
        x: ((event.clientX - rect.left - canvas.clientLeft) * canvas.width) / contentWidth,
        y: ((event.clientY - rect.top - canvas.clientTop) * canvas.height) / contentHeight,
    };
}

function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
}
