/**
 * A translucent version of any CSS colour — hex, rgb() or a `var(--token)`.
 * (Appending hex alpha like `${color}1a` silently produces invalid CSS for `var()` colours.)
 */
export const tint = (color: string, percent: number): string =>
  `color-mix(in srgb, ${color} ${percent}%, transparent)`;
