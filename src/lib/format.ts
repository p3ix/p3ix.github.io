// Las fechas del frontmatter llegan como medianoche UTC: se formatean en UTC para no cambiar de día.
const dateFormat = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export const formatDate = (date: Date) => dateFormat.format(date);

export const isoDate = (date: Date) => date.toISOString().slice(0, 10);

/** Minutos de lectura a 200 palabras por minuto, sin contar los bloques de código. */
export function readingTime(body = '') {
  const words = body
    .replace(/```[\s\S]*?```/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Dos primeras letras del título para las portadas generadas: "Forest" → "Fo". */
export function monogram(title: string) {
  const letters = title.replace(/[^\p{L}\p{N}]/gu, '');
  return letters.charAt(0).toUpperCase() + letters.charAt(1).toLowerCase();
}

const NEW_DAYS = 30;

/** Etiqueta de la esquina de las tarjetas: los borradores mandan sobre lo reciente. */
export function entryBadge(data: { date: Date; draft: boolean }) {
  if (data.draft) return 'BORRADOR';
  if (Date.now() - data.date.valueOf() < NEW_DAYS * 24 * 60 * 60 * 1000) return 'NUEVO';
  return undefined;
}
