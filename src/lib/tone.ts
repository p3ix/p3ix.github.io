/**
 * Nombre de un token de color de global.css sin el prefijo `--color-`
 * (p. ej. 'ctf', 'warn', 'area-shell').
 */
export type ColorToken = string;

/**
 * Estilo inline que fija el color de un elemento para las utilidades `tone-*` de global.css.
 * Uso: `<span style={tone('ctf')} class="tone-text">`.
 */
export const tone = (token: ColorToken) => `--tone: var(--color-${token})`;
