import {
    DEFAULT_STROKE,
    TYPE_LABELS,
    drawGesture,
    drawShape,
    isPathType,
} from './shapes.js';

const ACTIVE_TOOL_CLASSES = [
    'border-indigo-600',
    'bg-indigo-600',
    'text-white',
    'hover:bg-indigo-700',
];
const IDLE_TOOL_CLASSES = [
    'border-slate-300',
    'bg-white',
    'text-slate-700',
    'hover:bg-slate-50',
];

export class DrawingEditorView {
    constructor(editor) {
        this.editor = editor;
    }

    renderAll() {
        this.renderCanvas();
        this.renderObjectList();
        this.renderProperties();
        this.renderTools();
        this.updateDirtyBadge();
        this.updateHistoryButtons();
    }

    renderCanvas() {
        const { canvas, context, pointer, state } = this.editor;
        if (canvas.width !== state.width) {
            canvas.width = state.width;
        }
        if (canvas.height !== state.height) {
            canvas.height = state.height;
        }

        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        for (const shape of state.objects) {
            drawShape(context, shape);
        }
        if (pointer.gesture) {
            drawGesture(context, pointer.gesture.points, DEFAULT_STROKE);
        }
    }

    renderObjectList() {
        const { elements, state } = this.editor;
        const items = state.objects.map((shape) => this.buildListItem(shape));
        elements.objectsList.replaceChildren(...items);
        elements.objectsCount.textContent = `(${state.objects.length})`;
        elements.objectsEmpty.classList.toggle('hidden', state.objects.length > 0);
    }

    buildListItem(shape) {
        const item = document.createElement('li');
        item.dataset.id = String(shape.id);
        this.styleListItem(item, shape);
        item.append(this.buildColorSwatch(shape));

        if (this.editor.readOnly) {
            item.append(this.buildReadOnlyLabel(shape));
            return item;
        }

        item.append(this.buildSelectButton(shape));
        item.append(this.buildDeleteButton(shape));
        return item;
    }

    styleListItem(item, shape) {
        const isSelected = shape.id === this.editor.state.selectedId;
        const selectionClasses = isSelected
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-transparent hover:bg-slate-50';
        item.className = `flex items-center gap-2 rounded-lg border px-2 py-1 text-sm ${selectionClasses}`;
    }

    buildColorSwatch(shape) {
        const swatch = document.createElement('span');
        swatch.className = 'inline-block h-4 w-4 shrink-0 rounded border border-slate-400';
        swatch.style.backgroundColor = isPathType(shape.type) ? shape.stroke : shape.fill;
        return swatch;
    }

    buildReadOnlyLabel(shape) {
        const label = document.createElement('span');
        label.className = 'min-w-0 flex-1 truncate';
        label.textContent = shape.name;
        return label;
    }

    buildSelectButton(shape) {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.action = 'select';
        button.className = 'min-w-0 flex-1 truncate text-left';
        button.textContent = shape.name;
        button.title = `${TYPE_LABELS[shape.type]}: pulsa para seleccionarlo`;
        return button;
    }

    buildDeleteButton(shape) {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.action = 'delete';
        button.className = 'shrink-0 rounded px-2 text-red-600 hover:bg-red-50';
        button.textContent = '×';
        button.title = 'Eliminar este objeto';
        button.setAttribute('aria-label', `Eliminar ${shape.name}`);
        return button;
    }

    renderProperties() {
        const { elements, readOnly } = this.editor;
        if (readOnly) {
            return;
        }

        const shape = this.editor.selectedShape();
        elements.propsEmpty.classList.toggle('hidden', Boolean(shape));
        elements.propsForm.classList.toggle('hidden', !shape);
        if (shape) {
            this.renderShapeProperties(shape);
        }
    }

    renderShapeProperties(shape) {
        const { elements } = this.editor;
        setField(elements.propName, shape.name);
        for (const [key, input] of Object.entries(elements.propNumbers)) {
            setField(input, shape[key]);
        }
        setField(elements.propFill, shape.fill);
        elements.propFill.disabled = isPathType(shape.type);
        elements.propFill.closest('div').classList.toggle('hidden', isPathType(shape.type));
    }

    renderTools() {
        const { elements } = this.editor;
        for (const button of elements.toolButtons) {
            this.renderToolButton(button);
        }
        this.updateCanvasCursor();
    }

    renderToolButton(button) {
        const isActive = button.dataset.tool === this.editor.state.tool;
        const classesToRemove = isActive ? IDLE_TOOL_CLASSES : ACTIVE_TOOL_CLASSES;
        const classesToAdd = isActive ? ACTIVE_TOOL_CLASSES : IDLE_TOOL_CLASSES;
        button.classList.remove(...classesToRemove);
        button.classList.add(...classesToAdd);
        button.setAttribute('aria-pressed', String(isActive));
    }

    updateCanvasCursor() {
        const { canvas, pointer, state } = this.editor;
        if (state.tool !== 'select') {
            canvas.style.cursor = 'crosshair';
        } else if (!pointer.drag) {
            canvas.style.cursor = 'default';
        }
    }

    updateHistoryButtons() {
        const { elements, history, readOnly } = this.editor;
        if (readOnly) {
            return;
        }
        elements.undoButton.disabled = history.index <= 0;
        elements.redoButton.disabled = history.index >= history.snapshots.length - 1;
    }

    updateStatus(text) {
        const { elements, readOnly } = this.editor;
        if (readOnly || !elements?.status) {
            return;
        }
        elements.status.textContent = text;
    }

    updateDirtyBadge() {
        const { elements } = this.editor;
        if (!elements.dirtyBadge) {
            return;
        }
        elements.dirtyBadge.classList.toggle('hidden', this.matchesServer());
    }

    matchesServer() {
        const current = this.editor.snapshot();
        const serverContent = this.editor.serverContent;
        const namesMatch = current.name.trim() === ''
            ? serverContent.name.trim() === ''
            : current.name.trim() === serverContent.name.trim();
        return namesMatch
            && current.width === serverContent.width
            && current.height === serverContent.height
            && JSON.stringify(current.objects) === JSON.stringify(serverContent.objects);
    }

    syncInputs() {
        const { elements, state } = this.editor;
        elements.name.value = state.name;
        elements.width.value = String(state.width);
        elements.height.value = String(state.height);
        elements.canvasInfo.textContent = `Lienzo lógico: ${state.width} × ${state.height} px`;
        if (elements.fill) {
            elements.fill.value = state.fill;
        }
    }
}

function setField(input, value) {
    const text = String(value);
    if (input.value !== text) {
        input.value = text;
    }
}
