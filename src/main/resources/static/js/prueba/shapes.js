export const DEFAULT_FILL = '#818cf8';
export const DEFAULT_STROKE = '#312e81';
export const MIN_SHAPE_SIZE = 1;
export const MAX_SHAPE_SIZE = 2000;

export const TYPE_LABELS = Object.freeze({
    circle: 'Círculo',
    square: 'Cuadrado',
    triangle: 'Triángulo',
    star: 'Estrella',
    freehand: 'Dibujo a mano alzada',
});

export const SHAPE_TYPES = Object.keys(TYPE_LABELS);

export const PATH_TYPES = Object.freeze(['freehand']);
