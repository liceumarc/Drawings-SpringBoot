import { clearDraft, draftKey, loadDraft, saveDraft } from './storage.js';
import {
    DEFAULT_FILL,
    DEFAULT_STROKE,
    MAX_SHAPE_SIZE,
    MIN_SHAPE_SIZE,
    TYPE_LABELS,
    cleanColor,
    createPathShape,
    createShape,
    drawGesture,
    drawShape,
    findShapeAt,
    isPathType,
    normalizeRotation,
    sanitizeShapes,
} from './shapes.js';

const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 600;
const MIN_CANVAS_SIZE = 100;
const MAX_CANVAS_SIZE = 2000;
const MAX_HISTORY_ENTRIES = 4;
const TOOLS = Object.freeze(['select', 'circle', 'square', 'triangle', 'star', 'freehand']);
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
        this.history = this.restoreHistory(this.draft);
        this.drag = null;
        this.gesture = null;
        this.pendingPropertyEdit = null;

        this.syncInputs();
        this.renderAll();
        this.bindEvents();
        this.updateStatus(
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

    restoreHistory(draft) {
        const snapshots = Array.isArray(draft?.history)
            ? draft.history
                .map((entry) => this.cleanSnapshot(entry?.snapshot ?? entry))
                .filter(Boolean)
                .slice(-MAX_HISTORY_ENTRIES)
            : [];
        const index = Number.isInteger(draft?.historyIndex) ? draft.historyIndex : -1;
        const current = this.snapshot();
        if (
            snapshots.length > 0
            && index >= 0
            && index < snapshots.length
            && sameSnapshot(snapshots[index], current)
        ) {
            return { snapshots, index };
        }
        return { snapshots: [current], index: 0 };
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

        this.canvas.addEventListener('pointerdown', (event) => this.onPointerDown(event));
        this.canvas.addEventListener('pointermove', (event) => this.onPointerMove(event));
        this.canvas.addEventListener('pointerup', (event) => this.onPointerEnd(event));
        this.canvas.addEventListener('pointercancel', (event) => this.onPointerEnd(event));

        this.canvas.style.touchAction = 'none';
        this.elements.toolButtons.forEach((button) => {
            button.addEventListener('click', () => this.setTool(button.dataset.tool));
        });
        this.elements.fill.addEventListener('input', () => {
            this.state.fill = this.elements.fill.value;
            this.persist();
        });
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

        this.elements.name.addEventListener('input', () => {
            this.state.name = this.elements.name.value.slice(0, 50);
            this.persist();
        });
        this.elements.name.addEventListener('change', () => this.recordChange());

        for (const [input, key] of [
            [this.elements.width, 'width'],
            [this.elements.height, 'height'],
        ]) {
            input.addEventListener('change', () => this.changeCanvasSize(input, key));
        }
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
        document.addEventListener('keydown', (event) => this.onKeyDown(event));
    }

    onPointerDown(event) {
        if (!event.isPrimary || event.button !== 0) {
            return;
        }
        this.commitPendingEdit();
        const point = this.pointFromEvent(event);

        if (this.readOnly) {
            return;
        }
        if (this.state.tool === 'freehand') {
            this.beginFreehand(event, point);
            return;
        }
        if (this.state.tool !== 'select') {
            this.addRegularShape(point);
            return;
        }

        const shape = findShapeAt(this.context, this.state.objects, point.x, point.y);
        if (!shape) {
            if (this.state.selectedId !== null) {
                this.state.selectedId = null;
                this.renderAll();
                this.persist();
            }
            return;
        }

        this.state.selectedId = shape.id;
        this.drag = {
            pointerId: event.pointerId,
            shapeId: shape.id,
            offsetX: shape.x - point.x,
            offsetY: shape.y - point.y,
        };
        this.canvas.setPointerCapture(event.pointerId);
        this.canvas.style.cursor = 'grabbing';
        this.renderAll();
        this.persist();
    }

    onPointerMove(event) {
        const point = this.pointFromEvent(event);
        if (this.drag && event.pointerId === this.drag.pointerId) {
            const shape = this.findShape(this.drag.shapeId);
            if (!shape) {
                this.drag = null;
                return;
            }
            shape.x = clamp(Math.round(point.x + this.drag.offsetX), 0, this.state.width);
            shape.y = clamp(Math.round(point.y + this.drag.offsetY), 0, this.state.height);
            this.render();
            this.renderProps();
            return;
        }

        if (this.gesture && event.pointerId === this.gesture.pointerId) {
            this.gesture.points.push(point);
            this.render();
            return;
        }

        if (this.state.tool === 'select') {
            const shape = findShapeAt(this.context, this.state.objects, point.x, point.y);
            this.canvas.style.cursor = shape ? 'grab' : 'default';
        }
    }

    onPointerEnd(event) {
        if (this.drag && event.pointerId === this.drag.pointerId) {
            const shape = this.findShape(this.drag.shapeId);
            this.drag = null;
            if (event.type === 'pointerup' && shape) {
                this.recordChange();
            } else {
                this.recordChange();
            }
            this.canvas.style.cursor = 'grab';
            return;
        }

        if (!this.gesture || event.pointerId !== this.gesture.pointerId) {
            return;
        }
        const gesture = this.gesture;
        this.gesture = null;
        if (event.type === 'pointercancel') {
            this.render();
            return;
        }
        const shape = createPathShape('freehand', gesture.points, this.state.objects);
        if (shape) {
            this.state.objects.push(shape);
            this.state.selectedId = shape.id;
            this.recordChange();
        } else {
            this.render();
        }
    }

    beginFreehand(event, point) {
        this.gesture = { pointerId: event.pointerId, points: [point] };
        this.canvas.setPointerCapture(event.pointerId);
        this.render();
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
        this.renderTools();
        this.render();
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
        } else {
            this.commitPendingEdit();
            this.state.selectedId = id;
            this.renderAll();
            this.persist();
        }
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
        this.syncInputs();
        this.renderAll();
        this.updateStatus('Borrador local eliminado');
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
        this.render();
        this.persist();
    }

    changeCanvasSize(input, key) {
        const value = toSize(input.value, this.state[key]);
        input.value = String(value);
        if (this.state[key] === value) {
            return;
        }
        this.state[key] = value;
        this.syncInputs();
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
        if (this.history.index <= 0) {
            return;
        }
        this.history.index--;
        this.applySnapshot(this.history.snapshots[this.history.index]);
    }

    redo() {
        if (this.history.index >= this.history.snapshots.length - 1) {
            return;
        }
        this.history.index++;
        this.applySnapshot(this.history.snapshots[this.history.index]);
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
        this.syncInputs();
        this.renderAll();
        this.persist();
    }

    recordChange() {
        const snapshot = this.snapshot();
        const current = this.history.snapshots[this.history.index];
        if (!current || !sameSnapshot(current, snapshot)) {
            this.history.snapshots = this.history.snapshots.slice(0, this.history.index + 1);
            this.history.snapshots.push(snapshot);
            if (this.history.snapshots.length > MAX_HISTORY_ENTRIES) {
                this.history.snapshots.shift();
            }
            this.history.index = this.history.snapshots.length - 1;
        }
        this.pendingPropertyEdit = null;
        this.renderAll();
        this.persist();
    }

    prepareSubmission() {
        requireElement('field-name').value = this.state.name;
        requireElement('field-width').value = String(this.state.width);
        requireElement('field-height').value = String(this.state.height);
        requireElement('field-objectCount').value = String(this.state.objects.length);
        requireElement('field-drawingJson').value = JSON.stringify(this.state.objects);
        this.persist();
        this.updateStatus('Enviando el dibujo al servidor…');
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
            this.updateStatus('Borrador guardado en este navegador');
        }
    }

    renderAll() {
        this.render();
        this.renderList();
        this.renderProps();
        this.renderTools();
        this.updateDirtyBadge();
        this.updateHistoryButtons();
    }

    render() {
        if (this.canvas.width !== this.state.width) {
            this.canvas.width = this.state.width;
        }
        if (this.canvas.height !== this.state.height) {
            this.canvas.height = this.state.height;
        }

        this.context.fillStyle = '#ffffff';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        for (const shape of this.state.objects) {
            drawShape(this.context, shape);
        }
        if (this.gesture) {
            drawGesture(this.context, this.gesture.points, DEFAULT_STROKE);
        }
    }

    renderList() {
        const items = this.state.objects.map((shape) => this.buildListItem(shape));
        this.elements.objectsList.replaceChildren(...items);
        this.elements.objectsCount.textContent = `(${this.state.objects.length})`;
        this.elements.objectsEmpty.classList.toggle('hidden', this.state.objects.length > 0);
    }

    buildListItem(shape) {
        const item = document.createElement('li');
        item.dataset.id = String(shape.id);
        const selected = shape.id === this.state.selectedId;
        item.className = `flex items-center gap-2 rounded-lg border px-2 py-1 text-sm ${
            selected ? 'border-indigo-500 bg-indigo-50' : 'border-transparent hover:bg-slate-50'
        }`;

        const swatch = document.createElement('span');
        swatch.className = 'inline-block h-4 w-4 shrink-0 rounded border border-slate-400';
        swatch.style.backgroundColor = isPathType(shape.type) ? shape.stroke : shape.fill;
        item.append(swatch);

        if (this.readOnly) {
            const label = document.createElement('span');
            label.className = 'min-w-0 flex-1 truncate';
            label.textContent = shape.name;
            item.append(label);
            return item;
        }

        const select = document.createElement('button');
        select.type = 'button';
        select.dataset.action = 'select';
        select.className = 'min-w-0 flex-1 truncate text-left';
        select.textContent = shape.name;
        select.title = `${TYPE_LABELS[shape.type]}: pulsa para seleccionarlo`;
        item.append(select);

        const remove = document.createElement('button');
        remove.type = 'button';
        remove.dataset.action = 'delete';
        remove.className = 'shrink-0 rounded px-2 text-red-600 hover:bg-red-50';
        remove.textContent = '×';
        remove.title = 'Eliminar este objeto';
        remove.setAttribute('aria-label', `Eliminar ${shape.name}`);
        item.append(remove);
        return item;
    }

    renderProps() {
        if (this.readOnly) {
            return;
        }
        const shape = this.selectedShape();
        this.elements.propsEmpty.classList.toggle('hidden', Boolean(shape));
        this.elements.propsForm.classList.toggle('hidden', !shape);
        if (!shape) {
            return;
        }

        setField(this.elements.propName, shape.name);
        for (const [key, input] of Object.entries(this.elements.propNumbers)) {
            setField(input, shape[key]);
        }
        setField(this.elements.propFill, shape.fill);
        this.elements.propFill.disabled = isPathType(shape.type);
        this.elements.propFill.closest('div').classList.toggle('hidden', isPathType(shape.type));
    }

    renderTools() {
        for (const button of this.elements.toolButtons) {
            const active = button.dataset.tool === this.state.tool;
            button.classList.remove(...(active ? IDLE_TOOL_CLASSES : ACTIVE_TOOL_CLASSES));
            button.classList.add(...(active ? ACTIVE_TOOL_CLASSES : IDLE_TOOL_CLASSES));
            button.setAttribute('aria-pressed', String(active));
        }
        if (this.state.tool !== 'select') {
            this.canvas.style.cursor = 'crosshair';
        } else if (!this.drag) {
            this.canvas.style.cursor = 'default';
        }
    }

    updateHistoryButtons() {
        if (this.readOnly) {
            return;
        }
        this.elements.undoButton.disabled = this.history.index <= 0;
        this.elements.redoButton.disabled = this.history.index >= this.history.snapshots.length - 1;
    }

    updateStatus(text) {
        if (this.readOnly || !this.elements?.status) {
            return;
        }
        this.elements.status.textContent = text;
    }

    updateDirtyBadge() {
        if (!this.elements.dirtyBadge) {
            return;
        }
        this.elements.dirtyBadge.classList.toggle('hidden', this.matchesServer());
    }

    matchesServer() {
        const current = this.snapshot();
        const nameMatches = current.name.trim() === ''
            ? this.serverContent.name.trim() === ''
            : current.name.trim() === this.serverContent.name.trim();
        return nameMatches
            && current.width === this.serverContent.width
            && current.height === this.serverContent.height
            && JSON.stringify(current.objects) === JSON.stringify(this.serverContent.objects);
    }

    syncInputs() {
        this.elements.name.value = this.state.name;
        this.elements.width.value = String(this.state.width);
        this.elements.height.value = String(this.state.height);
        this.elements.canvasInfo.textContent = `Lienzo lógico: ${this.state.width} × ${this.state.height} px`;
        if (this.elements.fill) {
            this.elements.fill.value = this.state.fill;
        }
    }

    selectedShape() {
        return this.findShape(this.state.selectedId);
    }

    findShape(id) {
        return this.state.objects.find((shape) => shape.id === id) ?? null;
    }

    pointFromEvent(event) {
        const rect = this.canvas.getBoundingClientRect();
        const contentWidth = rect.width - this.canvas.clientLeft * 2;
        const contentHeight = rect.height - this.canvas.clientTop * 2;
        if (contentWidth <= 0 || contentHeight <= 0) {
            return { x: 0, y: 0 };
        }
        return {
            x: ((event.clientX - rect.left - this.canvas.clientLeft) * this.canvas.width) / contentWidth,
            y: ((event.clientY - rect.top - this.canvas.clientTop) * this.canvas.height) / contentHeight,
        };
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

function sameSnapshot(left, right) {
    return JSON.stringify(left) === JSON.stringify(right);
}

function cloneShape(shape) {
    return {
        ...shape,
        ...(Array.isArray(shape.points)
            ? { points: shape.points.map((point) => ({ ...point })) }
            : {}),
    };
}

function setField(input, value) {
    const text = String(value);
    if (input.value !== text) {
        input.value = text;
    }
}

const root = document.getElementById('editor');
if (root) {
    new DrawingEditor(root);
}
