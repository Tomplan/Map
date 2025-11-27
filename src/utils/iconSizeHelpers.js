/**
 * Normalize an iconSize array to [width, height].
 * If height is missing/falsey, compute it using fallback aspect ratio.
 * If width is missing, fall back to the provided fallback size.
 * @param {Array<number>|undefined} iconSize
 * @param {Array<number>} fallback - default [width, height]
 * @returns {Array<number>} [width, height]
 */
export function normalizeIconSize(iconSize, fallback = [25, 41]) {
  if (!Array.isArray(iconSize) || iconSize.length === 0) return fallback;

  const width = iconSize[0] || fallback[0];
  // If provided height is falsy (null/0/undefined), compute from width
  const height = iconSize[1] || Math.round(width * (fallback[1] / fallback[0]));

  return [width, height];
}

export default normalizeIconSize;
