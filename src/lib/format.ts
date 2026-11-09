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

/** Etiqueta de la esquina de las tarjetas: solo los borradores (que no salen en producción). */
export const entryBadge = (data: { draft: boolean }) => (data.draft ? 'BORRADOR' : undefined);

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Markdown en línea para textos cortos del frontmatter: `código`, **negrita** y [texto](/ruta/).
 * Devuelve HTML (para `set:html`); todo lo demás se escapa. Con `links: false` los enlaces se quedan
 * en su texto (para meterlo dentro de otro enlace).
 */
export function inlineMarkdown(text: string, { links = true } = {}) {
  return text
    .split(/(`[^`]+`)/)
    .map((part) => {
      if (part.length > 1 && part.startsWith('`') && part.endsWith('`')) return `<code>${escapeHtml(part.slice(1, -1))}</code>`;
      return escapeHtml(part)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label: string, href: string) => {
          if (!links) return label;
          const external = /^https?:/.test(href);
          return `<a href="${href}"${external ? ' target="_blank" rel="noopener"' : ''}>${label}</a>`;
        });
    })
    .join('');
}

/** Lo anterior como texto plano: meta descriptions y la paleta. */
export const stripInlineMarkdown = (text: string) =>
  text.replace(/`([^`]+)`/g, '$1').replace(/\*\*(.+?)\*\*/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
