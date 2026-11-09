export const TYPE_LABELS = Object.freeze({
    circle: 'Círculo',
    square: 'Cuadrado',
    triangle: 'Triángulo',
    star: 'Estrella',
    freehand: 'Dibujo a mano alzada',
    polyline: 'Línea',
});

export const SHAPE_TYPES = Object.keys(TYPE_LABELS);
export const PATH_TYPES = Object.freeze(['freehand', 'polyline']);
export const DEFAULT_FILL = '#818cf8';
export const DEFAULT_STROKE = '#312e81';
export const MIN_SHAPE_SIZE = 1;
export const MAX_SHAPE_SIZE = 2000;

const DEFAULT_SIZES = Object.freeze({
    circle: 50,
    square: 100,
    triangle: 60,
    star: 60,
});
const STAR_POINTS = 7;
const STAR_INNER_RATIO = 0.45;
const MAX_PATH_POINTS = 2500;
const COORDINATE_LIMIT = 100000;
const COLOR_PATTERN = /^#[0-9a-f]{6}$/i;
const HIT_MARGIN = 4;
const SELECTION_PADDING = 6;

export function isPathType(type) {
    return PATH_TYPES.includes(type);
}

export function createShape(type, x, y, existing, fill, stroke) {
    if (!Object.hasOwn(DEFAULT_SIZES, type)) {
        throw new TypeError(`Unsupported shape type: ${type}`);
    }

    return {
        id: nextId(existing),
        type,
        name: nextName(type, existing),
        x: Math.round(x),
        y: Math.round(y),
        size: DEFAULT_SIZES[type],
        rotation: 0,
        fill,
        stroke,
    };
}

export function createPathShape(type, points, existing, stroke) {
    if (!isPathType(type)) {
        throw new TypeError(`Unsupported path type: ${type}`);
    }

    const cleanPoints = points
        .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
        .slice(0, MAX_PATH_POINTS);
    if (cleanPoints.length < 2) {
        return null;
    }

    const minX = Math.min(...cleanPoints.map(({ x }) => x));
    const maxX = Math.max(...cleanPoints.map(({ x }) => x));
    const minY = Math.min(...cleanPoints.map(({ y }) => y));
    const maxY = Math.max(...cleanPoints.map(({ y }) => y));
    const x = (minX + maxX) / 2;
    const y = (minY + maxY) / 2;
    const size = Math.max(
        1,
        ...cleanPoints.map((point) => Math.hypot(point.x - x, point.y - y)),
    );
    if (size < 1.5) {
        return null;
    }
    const storedSize = Math.min(MAX_SHAPE_SIZE, Math.round(size));

    return {
        id: nextId(existing),
        type,
        name: nextName(type, existing),
        x: Math.round(x),
        y: Math.round(y),
        size: storedSize,
        rotation: 0,
        fill: DEFAULT_FILL,
        stroke: cleanColor(stroke, DEFAULT_STROKE),
        points: cleanPoints.map((point) => ({
            x: roundCoordinate((point.x - x) / storedSize),
            y: roundCoordinate((point.y - y) / storedSize),
        })),
    };
}

export function sanitizeShapes(shapes) {
    if (!Array.isArray(shapes)) {
        return [];
    }

    const result = [];
    const usedIds = new Set();
    for (const raw of shapes) {
        const shape = cleanShape(raw);
        if (!shape) {
            continue;
        }
        if (shape.id === 0 || usedIds.has(shape.id)) {
            shape.id = nextId(result);
        }
        usedIds.add(shape.id);
        result.push(shape);
    }
    return result;
}

export function cleanColor(value, fallback) {
    return typeof value === 'string' && COLOR_PATTERN.test(value)
        ? value.toLowerCase()
        : fallback;
}

export function normalizeRotation(degrees) {
    return ((Math.round(degrees) % 360) + 360) % 360;
}

export function drawShape(ctx, shape) {
    const path = createShapePath(shape);
    ctx.save();
    ctx.translate(shape.x, shape.y);
    ctx.rotate(toRadians(shape.rotation));
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = shape.stroke;
    ctx.fillStyle = shape.fill;

    if (!isPathType(shape.type)) {
        ctx.fill(path);
    }
    ctx.stroke(path);
    ctx.restore();
}

export function findShapeAt(ctx, shapes, x, y) {
    for (let index = shapes.length - 1; index >= 0; index--) {
        if (containsPoint(ctx, shapes[index], x, y)) {
            return shapes[index];
        }
    }
    return null;
}

export function drawSelection(ctx, shape) {
    const bounds = localBounds(shape);
    ctx.save();
    ctx.translate(shape.x, shape.y);
    ctx.rotate(toRadians(shape.rotation));
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(
        bounds.minX - SELECTION_PADDING,
        bounds.minY - SELECTION_PADDING,
        bounds.maxX - bounds.minX + 2 * SELECTION_PADDING,
        bounds.maxY - bounds.minY + 2 * SELECTION_PADDING,
    );
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(6, 0);
    ctx.moveTo(0, -6);
    ctx.lineTo(0, 6);
    ctx.stroke();
    ctx.restore();
}

export function drawGesture(ctx, points, color, closed = false) {
    if (points.length === 0) {
        return;
    }

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (const point of points.slice(1)) {
        ctx.lineTo(point.x, point.y);
    }
    if (closed) {
        ctx.closePath();
    }
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.restore();
}

function cleanShape(raw) {
    if (!raw || typeof raw !== 'object' || !SHAPE_TYPES.includes(raw.type)) {
        return null;
    }

    const shape = {
        id: Number.isInteger(raw.id) && raw.id > 0 ? raw.id : 0,
        type: raw.type,
        name: cleanName(raw.name, raw.type),
        x: cleanNumber(raw.x, 0, -COORDINATE_LIMIT, COORDINATE_LIMIT),
        y: cleanNumber(raw.y, 0, -COORDINATE_LIMIT, COORDINATE_LIMIT),
        size: cleanNumber(raw.size, DEFAULT_SIZES[raw.type] ?? 10, MIN_SHAPE_SIZE, MAX_SHAPE_SIZE),
        rotation: typeof raw.rotation === 'number' && Number.isFinite(raw.rotation)
            ? normalizeRotation(raw.rotation)
            : 0,
        fill: cleanColor(raw.fill, DEFAULT_FILL),
        stroke: cleanColor(raw.stroke, DEFAULT_STROKE),
    };

    if (isPathType(shape.type)) {
        if (!Array.isArray(raw.points) || raw.points.length < 2) {
            return null;
        }
        shape.points = raw.points
            .slice(0, MAX_PATH_POINTS)
            .map(cleanRelativePoint)
            .filter(Boolean);
        if (shape.points.length < 2) {
            return null;
        }
    }
    return shape;
}

function cleanRelativePoint(point) {
    if (!point || typeof point !== 'object') {
        return null;
    }
    const x = Number(point.x);
    const y = Number(point.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
        return null;
    }
    return {
        x: Math.max(-1.5, Math.min(1.5, x)),
        y: Math.max(-1.5, Math.min(1.5, y)),
    };
}

function createShapePath(shape) {
    const path = new Path2D();
    if (isPathType(shape.type)) {
        const [first, ...rest] = shape.points;
        path.moveTo(first.x * shape.size, first.y * shape.size);
        for (const point of rest) {
            path.lineTo(point.x * shape.size, point.y * shape.size);
        }
        return path;
    }

    switch (shape.type) {
        case 'circle':
            path.arc(0, 0, shape.size, 0, Math.PI * 2);
            break;
        case 'square': {
            const half = shape.size / 2;
            path.rect(-half, -half, shape.size, shape.size);
            break;
        }
        case 'triangle':
            addRing(path, 3, () => shape.size);
            break;
        case 'star':
            addRing(path, STAR_POINTS * 2, (index) => (
                index % 2 === 0 ? shape.size : shape.size * STAR_INNER_RATIO
            ));
            break;
        default:
            throw new TypeError(`Unsupported shape type: ${shape.type}`);
    }
    return path;
}

function containsPoint(ctx, shape, x, y) {
    const local = toLocalPoint(shape, x, y);
    const path = createShapePath(shape);
    ctx.save();
    ctx.lineWidth = isPathType(shape.type) ? HIT_MARGIN * 2 : 2 + HIT_MARGIN * 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const isInside = !isPathType(shape.type)
        && ctx.isPointInPath(path, local.x, local.y);
    const isOnStroke = ctx.isPointInStroke(path, local.x, local.y);
    ctx.restore();
    return isInside || isOnStroke;
}

function toLocalPoint(shape, x, y) {
    const angle = toRadians(shape.rotation);
    const dx = x - shape.x;
    const dy = y - shape.y;
    return {
        x: dx * Math.cos(angle) + dy * Math.sin(angle),
        y: -dx * Math.sin(angle) + dy * Math.cos(angle),
    };
}

function localBounds(shape) {
    if (isPathType(shape.type)) {
        const xs = shape.points.map((point) => point.x * shape.size);
        const ys = shape.points.map((point) => point.y * shape.size);
        return boundsOf(xs, ys);
    }
    if (shape.type === 'circle') {
        return { minX: -shape.size, minY: -shape.size, maxX: shape.size, maxY: shape.size };
    }
    if (shape.type === 'square') {
        const half = shape.size / 2;
        return { minX: -half, minY: -half, maxX: half, maxY: half };
    }

    const points = polygonPoints(shape);
    return boundsOf(points.map(([x]) => x), points.map(([, y]) => y));
}

function polygonPoints(shape) {
    const count = shape.type === 'triangle' ? 3 : STAR_POINTS * 2;
    return Array.from({ length: count }, (_, index) => {
        const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
        const radius = shape.type === 'star' && index % 2 !== 0
            ? shape.size * STAR_INNER_RATIO
            : shape.size;
        return [Math.cos(angle) * radius, Math.sin(angle) * radius];
    });
}

function addRing(path, count, radiusAt) {
    for (let index = 0; index < count; index++) {
        const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
        const radius = radiusAt(index);
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (index === 0) {
            path.moveTo(x, y);
        } else {
            path.lineTo(x, y);
        }
    }
    path.closePath();
}

function boundsOf(xs, ys) {
    return {
        minX: Math.min(...xs),
        minY: Math.min(...ys),
        maxX: Math.max(...xs),
        maxY: Math.max(...ys),
    };
}

function cleanNumber(value, fallback, min, max) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return fallback;
    }
    return Math.max(min, Math.min(max, Math.round(value)));
}

function cleanName(name, type) {
    const value = typeof name === 'string' ? name.trim().slice(0, 50) : '';
    return value || TYPE_LABELS[type];
}

function nextId(shapes) {
    return shapes.reduce((maximum, shape) => Math.max(maximum, shape.id), 0) + 1;
}

function nextName(type, shapes) {
    const names = new Set(shapes.map((shape) => shape.name));
    let number = shapes.filter((shape) => shape.type === type).length + 1;
    while (names.has(`${TYPE_LABELS[type]} ${number}`)) {
        number++;
    }
    return `${TYPE_LABELS[type]} ${number}`;
}

function roundCoordinate(value) {
    return Math.round(value * 1000) / 1000;
}

function toRadians(degrees) {
    return (degrees * Math.PI) / 180;
}
