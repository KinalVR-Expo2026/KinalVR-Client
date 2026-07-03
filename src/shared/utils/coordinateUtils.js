// Límites y helpers para las cadenas "x y z" de position/rotation usadas por
// conexiones de escena y eventos. Deben mantenerse sincronizados con
// KinalVR-Server/middlewares/coordinate-validator.js.
export const POSITION_BOUND = 50;
export const ROTATION_BOUND = 360;

export const DEFAULT_POSITION = '0 1 -3';
export const DEFAULT_ROTATION = '0 0 0';

/**
 * Parsea una cadena "x y z" a un arreglo de 3 números.
 * Si el formato es inválido (no son exactamente 3 números), devuelve el fallback
 * en vez de dejar valores `undefined`/`NaN` silenciosos.
 */
export const parseCoordString = (value, fallback = [0, 0, 0]) => {
  if (typeof value !== 'string') return fallback;
  const parts = value.trim().split(/\s+/).map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return fallback;
  return parts;
};

export const clampCoord = (value, bound) => Math.min(Math.max(value, -bound), bound);
