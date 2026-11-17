import { clearDraft, draftKey, loadDraft, saveDraft } from './storage.js';
import {
    DEFAULT_FILL,
    MAX_SHAPE_SIZE,
    MIN_SHAPE_SIZE,
    TYPE_LABELS,
    cleanColor,
    createShape,
    normalizeRotation,
    sanitizeShapes,
} from './shapes.js';
import { addSnapshot, moveHistory, restoreHistory } from './history.js';
import { DrawingPointerController } from './pointer.js';
import { DrawingEditorView } from './view.js';

const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 600;
const MIN_CANVAS_SIZE = 100;
const MAX_CANVAS_SIZE = 2000;
const MAX_HISTORY_ENTRIES = 4;
const TOOLS = Object.freeze(['select', 'circle', 'square', 'triangle', 'star', 'freehand']);

class DrawingEditor {
    constructor(element) {
        this.root = element;
        this.mode = element.dataset.mode;
        this.readOnly = this.mode === 'view';
        this.storageKey = draftKey(element.dataset.user, element.dataset.drawingId || null);
        this.serverContent = {
            name: element.dataset.name || '',
            width: toSize(element.dataset.width, DEFAULT_WIDTH),
            height: toSize(element.dataset.height, DEFAULT_HEIGHT),
            objects: parseObjects(element.dataset.objects),
        };

        const wasSaved = element.dataset.saveSucceeded === 'true';
        if (wasSaved && !this.readOnly) {
            clearDraft(this.storageKey);
        }
        this.draft = this.readOnly || wasSaved ? null : loadDraft(this.storageKey);
        this.state = this.createState(this.draft);

        this.canvas = requireElement('canvas');
        this.context = this.canvas.getContext('2d');
        if (!this.context) {
            throw new Error('El navegador no ha podido crear el contexto 2D del lienzo.');
        }
        this.elements = this.collectElements();
        this.history = restoreHistory(
            this.draft,
            this.snapshot(),
            (snapshot) => this.cleanSnapshot(snapshot),
            MAX_HISTORY_ENTRIES,
        );
        this.pointer = new DrawingPointerController(this);
        this.pendingPropertyEdit = null;
        this.view = new DrawingEditorView(this);

        this.view.syncInputs();
        this.view.renderAll();
        this.bindEvents();
        this.view.updateStatus(
            wasSaved
                ? 'Dibujo guardado en el servidor'
                : this.draft
                    ? 'Borrador recuperado de este navegador'
                    : 'Los cambios se guardan en este navegador',
        );
    }

    collectElements() {
        return {
            canvasInfo: requireElement('canvas-info'),
            name: requireElement('drawing-name'),
            width: requireElement('canvas-width'),
            height: requireElement('canvas-height'),
            objectsList: requireElement('objects-list'),
            objectsCount: requireElement('objects-count'),
            objectsEmpty: requireElement('objects-empty'),
            form: this.readOnly ? null : requireElement('send-form'),
            status: this.readOnly ? null : requireElement('save-status'),
            dirtyBadge: document.getElementById('dirty-badge'),
            discardButton: this.readOnly ? null : requireElement('btn-discard'),
            toolButtons: [...document.querySelectorAll('[data-tool]')],
            fill: document.getElementById('tool-fill'),
            clearButton: this.readOnly ? null : requireElement('btn-clear'),
            undoButton: this.readOnly ? null : requireElement('btn-undo'),
            redoButton: this.readOnly ? null : requireElement('btn-redo'),
            propsEmpty: this.readOnly ? null : requireElement('props-empty'),
            propsForm: this.readOnly ? null : requireElement('props-form'),
            propName: this.readOnly ? null : requireElement('prop-name'),
            propFill: this.readOnly ? null : requireElement('prop-fill'),
            deleteSelected: this.readOnly ? null : requireElement('btn-delete-selected'),
            propNumbers: this.readOnly
                ? {}
                : {
                    x: requireElement('prop-x'),
                    y: requireElement('prop-y'),
                    size: requireElement('prop-size'),
                    rotation: requireElement('prop-rotation'),
                },
        };
    }

    createState(draft) {
        const state = {
            ...this.serverContent,
            objects: this.serverContent.objects.map(cloneShape),
            selectedId: null,
            tool: 'select',
            fill: DEFAULT_FILL,
        };
        if (!draft) {
            return state;
        }

        if (typeof draft.name === 'string') {
            state.name = draft.name.slice(0, 50);
        }
        state.width = toSize(draft.width, state.width);
        state.height = toSize(draft.height, state.height);
        if (Array.isArray(draft.objects)) {
            state.objects = sanitizeShapes(draft.objects);
        }
        if (TOOLS.includes(draft.tool)) {
            state.tool = draft.tool;
        }
        state.fill = cleanColor(draft.fill, DEFAULT_FILL);
        if (state.objects.some((shape) => shape.id === draft.selectedId)) {
            state.selectedId = draft.selectedId;
        }
        return state;
    }

    cleanSnapshot(snapshot) {
        if (!snapshot || typeof snapshot !== 'object') {
            return null;
        }
        return {
            name: typeof snapshot.name === 'string' ? snapshot.name.slice(0, 50) : '',
            width: toSize(snapshot.width, this.serverContent.width),
            height: toSize(snapshot.height, this.serverContent.height),
            objects: sanitizeShapes(snapshot.objects),
        };
    }

    snapshot() {
        return {
            name: this.state.name,
            width: this.state.width,
            height: this.state.height,
            objects: this.state.objects.map(cloneShape),
        };
    }

    bindEvents() {
        if (this.readOnly) {
            return;
        }

        this.canvas.style.touchAction = 'none';
        this.pointer.bindEvents();
        this.bindToolEvents();
        this.bindActionEvents();
        this.bindNameEvents();
        this.bindCanvasSizeEvents();
        this.bindPropertyEvents();
        this.bindKeyboardEvents();
    }

    bindToolEvents() {
        this.elements.toolButtons.forEach((button) => {
            button.addEventListener('click', () => this.setTool(button.dataset.tool));
        });
        this.elements.fill.addEventListener('input', () => {
            this.state.fill = this.elements.fill.value;
            this.persist();
        });
    }

    bindActionEvents() {
        this.elements.objectsList.addEventListener('click', (event) => this.onListClick(event));
        this.elements.clearButton.addEventListener('click', () => this.clearAll());
        this.elements.undoButton.addEventListener('click', () => this.undo());
        this.elements.redoButton.addEventListener('click', () => this.redo());
        this.elements.deleteSelected.addEventListener('click', () => {
            if (this.state.selectedId !== null) {
                this.removeShape(this.state.selectedId);
            }
        });
        this.elements.discardButton.addEventListener('click', () => this.discardDraft());
        this.elements.form.addEventListener('submit', () => this.prepareSubmission());
    }

    bindNameEvents() {
        this.elements.name.addEventListener('input', () => {
            this.state.name = this.elements.name.value.slice(0, 50);
            this.persist();
        });
        this.elements.name.addEventListener('change', () => this.recordChange());
    }

    bindCanvasSizeEvents() {
        for (const [input, key] of [
            [this.elements.width, 'width'],
            [this.elements.height, 'height'],
        ]) {
            input.addEventListener('change', () => this.changeCanvasSize(input, key));
        }
    }

    bindPropertyEvents() {
        this.elements.propName.addEventListener('focus', () => this.beginPropertyEdit());
        this.elements.propName.addEventListener('input', () => {
            const shape = this.selectedShape();
            if (!shape) {
                return;
            }
            shape.name = this.elements.propName.value.slice(0, 50);
            this.persist();
        });
        this.elements.propName.addEventListener('change', () => this.commitShapeName());

        for (const [key, input] of Object.entries(this.elements.propNumbers)) {
            input.addEventListener('change', () => this.changeShapeNumber(key, input));
        }
        this.elements.propFill.addEventListener('focus', () => this.beginPropertyEdit());
        this.elements.propFill.addEventListener('input', () => this.previewShapeFill(this.elements.propFill.value));
        this.elements.propFill.addEventListener('change', () => this.recordChange());
    }

    bindKeyboardEvents() {
        document.addEventListener('keydown', (event) => this.onKeyDown(event));
    }

    clearSelection() {
        if (this.state.selectedId === null) {
            return;
        }
        this.state.selectedId = null;
        this.view.renderAll();
        this.persist();
    }

    addRegularShape(point) {
        const shape = createShape(
            this.state.tool,
            point.x,
            point.y,
            this.state.objects,
            this.state.fill,
        );
        this.state.objects.push(shape);
        this.state.selectedId = shape.id;
        this.recordChange();
    }

    setTool(tool) {
        if (!TOOLS.includes(tool)) {
            return;
        }
        this.state.tool = tool;
        this.view.renderTools();
        this.view.renderCanvas();
        this.persist();
    }

    onListClick(event) {
        if (!(event.target instanceof Element)) {
            return;
        }
        const button = event.target.closest('button[data-action]');
        const item = button?.closest('li[data-id]');
        if (!button || !item) {
            return;
        }
        const id = Number(item.dataset.id);
        if (button.dataset.action === 'delete') {
            this.removeShape(id);
            return;
        }
        this.selectShapeFromList(id);
    }

    selectShapeFromList(id) {
        this.commitPendingEdit();
        this.state.selectedId = id;
        this.view.renderAll();
        this.persist();
    }

    removeShape(id) {
        const shape = this.findShape(id);
        if (!shape) {
            return;
        }
        this.state.objects = this.state.objects.filter((item) => item.id !== id);
        if (this.state.selectedId === id) {
            this.state.selectedId = null;
        }
        this.recordChange();
    }

    clearAll() {
        if (this.state.objects.length === 0 || !confirm('¿Eliminar todos los objetos del dibujo?')) {
            return;
        }
        this.state.objects = [];
        this.state.selectedId = null;
        this.recordChange();
    }

    discardDraft() {
        const prompt = this.mode === 'edit'
            ? '¿Descartar los cambios locales y volver a la versión guardada en el servidor?'
            : '¿Vaciar el borrador local y empezar un dibujo vacío?';
        if (!confirm(prompt)) {
            return;
        }

        clearDraft(this.storageKey);
        this.state = {
            ...this.serverContent,
            objects: this.serverContent.objects.map(cloneShape),
            selectedId: null,
            tool: 'select',
            fill: DEFAULT_FILL,
        };
        this.history = {
            snapshots: [this.snapshot()],
            index: 0,
        };
        this.view.syncInputs();
        this.view.renderAll();
        this.view.updateStatus('Borrador local eliminado');
    }

    beginPropertyEdit() {
        this.pendingPropertyEdit = this.snapshot();
    }

    commitShapeName() {
        const shape = this.selectedShape();
        if (!shape) {
            return;
        }
        const name = this.elements.propName.value.trim().slice(0, 50);
        const previousShape = this.pendingPropertyEdit?.objects.find((item) => item.id === shape.id);
        shape.name = name || previousShape?.name || TYPE_LABELS[shape.type];
        this.elements.propName.value = shape.name;
        this.recordChange();
        this.pendingPropertyEdit = null;
    }

    changeShapeNumber(key, input) {
        const shape = this.selectedShape();
        if (!shape) {
            return;
        }
        const typed = input.value.trim() === '' ? NaN : Math.round(Number(input.value));
        if (!Number.isFinite(typed)) {
            input.value = shape[key];
            return;
        }
        const rules = {
            x: (value) => clamp(value, 0, this.state.width),
            y: (value) => clamp(value, 0, this.state.height),
            size: (value) => clamp(value, MIN_SHAPE_SIZE, MAX_SHAPE_SIZE),
            rotation: normalizeRotation,
        };
        const value = rules[key](typed);
        if (shape[key] !== value) {
            shape[key] = value;
            this.recordChange();
        }
        input.value = String(shape[key]);
    }

    previewShapeFill(value) {
        const shape = this.selectedShape();
        if (!shape) {
            return;
        }
        shape.fill = cleanColor(value, shape.fill);
        this.view.renderCanvas();
        this.persist();
    }

    changeCanvasSize(input, key) {
        const value = toSize(input.value, this.state[key]);
        input.value = String(value);
        if (this.state[key] === value) {
            return;
        }
        this.state[key] = value;
        this.view.syncInputs();
        this.recordChange();
    }

    commitPendingEdit() {
        const active = document.activeElement;
        if (active instanceof HTMLInputElement && active !== this.elements.fill) {
            active.blur();
        }
    }

    onKeyDown(event) {
        const target = event.target;
        const isTextEntry = target instanceof HTMLInputElement
            || target instanceof HTMLTextAreaElement
            || target instanceof HTMLSelectElement
            || target?.isContentEditable;

        if (isTextEntry || !(event.ctrlKey || event.metaKey) || event.altKey) {
            return;
        }
        if (event.key.toLowerCase() === 'z') {
            event.preventDefault();
            if (event.shiftKey) {
                this.redo();
            } else {
                this.undo();
            }
        } else if (event.key.toLowerCase() === 'y') {
            event.preventDefault();
            this.redo();
        }
    }

    undo() {
        const snapshot = moveHistory(this.history, -1);
        if (!snapshot) {
            return;
        }
        this.applySnapshot(snapshot);
    }

    redo() {
        const snapshot = moveHistory(this.history, 1);
        if (!snapshot) {
            return;
        }
        this.applySnapshot(snapshot);
    }

    applySnapshot(snapshot) {
        const selectedId = this.state.selectedId;
        this.state.name = snapshot.name;
        this.state.width = snapshot.width;
        this.state.height = snapshot.height;
        this.state.objects = snapshot.objects.map(cloneShape);
        this.state.selectedId = this.state.objects.some((shape) => shape.id === selectedId)
            ? selectedId
            : null;
        this.view.syncInputs();
        this.view.renderAll();
        this.persist();
    }

    recordChange() {
        addSnapshot(this.history, this.snapshot(), MAX_HISTORY_ENTRIES);
        this.pendingPropertyEdit = null;
        this.view.renderAll();
        this.persist();
    }

    prepareSubmission() {
        requireElement('field-name').value = this.state.name;
        requireElement('field-width').value = String(this.state.width);
        requireElement('field-height').value = String(this.state.height);
        requireElement('field-objectCount').value = String(this.state.objects.length);
        requireElement('field-drawingJson').value = JSON.stringify(this.state.objects);
        this.persist();
        this.view.updateStatus('Enviando el dibujo al servidor…');
    }

    persist() {
        if (this.readOnly) {
            return;
        }
        const saved = saveDraft(this.storageKey, {
            ...this.snapshot(),
            selectedId: this.state.selectedId,
            tool: this.state.tool,
            fill: this.state.fill,
            history: this.history.snapshots,
            historyIndex: this.history.index,
        });
        if (saved) {
            this.view.updateStatus('Borrador guardado en este navegador');
        }
    }

    selectedShape() {
        return this.findShape(this.state.selectedId);
    }

    findShape(id) {
        return this.state.objects.find((shape) => shape.id === id) ?? null;
    }

}

function requireElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Falta el elemento requerido #${id} en la plantilla del editor.`);
    }
    return element;
}

function parseObjects(text) {
    if (!text) {
        return [];
    }
    try {
        return sanitizeShapes(JSON.parse(text));
    } catch (error) {
        console.warn('No se pudo leer el contenido enviado por el servidor.', error);
        return [];
    }
}

function toSize(value, fallback) {
    if (value === undefined || value === null || value === '') {
        return fallback;
    }
    const number = Math.round(Number(value));
    return Number.isFinite(number)
        ? clamp(number, MIN_CANVAS_SIZE, MAX_CANVAS_SIZE)
        : fallback;
}

function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
}

function cloneShape(shape) {
    return {
        ...shape,
        ...(Array.isArray(shape.points)
            ? { points: shape.points.map((point) => ({ ...point })) }
            : {}),
    };
}

const root = document.getElementById('editor');
if (root) {
    new DrawingEditor(root);
}
