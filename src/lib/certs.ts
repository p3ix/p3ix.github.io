import type { ImageMetadata } from 'astro';
import { certifications, type Certification } from '@/data/profile';

// Archivos de cada certificación en src/assets/certs/, por id: ejpt.png (o .jpg/.webp) y ejpt.pdf.
// Para sacar la imagen de un PDF: pdftoppm -png -r 300 -singlefile cert.pdf src/assets/certs/<id>
const images = import.meta.glob<ImageMetadata>('/src/assets/certs/*.{png,jpg,jpeg,webp}', { import: 'default', eager: true });
const pdfs = import.meta.glob<string>('/src/assets/certs/*.pdf', { query: '?url', import: 'default', eager: true });

const fileId = (path: string) => path.split('/').pop()!.replace(/\.[^.]+$/, '');

function byId<T>(files: Record<string, T>, kind: string) {
  const map = new Map<string, T>();
  for (const [path, value] of Object.entries(files)) {
    const id = fileId(path);
    if (map.has(id)) throw new Error(`src/assets/certs/: hay dos ${kind} para "${id}".`);
    if (!certifications.some((c) => c.id === id)) {
      throw new Error(`src/assets/certs/${path.split('/').pop()}: no hay ninguna certificación con id "${id}" en data/profile.ts.`);
    }
    map.set(id, value);
  }
  return map;
}

const imageById = byId(images, 'imágenes');
const pdfById = byId(pdfs, 'PDF');

export interface Cert extends Certification {
  image?: ImageMetadata;
  /** URL del PDF ya publicado (con hash). */
  pdf?: string;
  /** Fecha de obtención como Date (medianoche UTC, como las del contenido). */
  awarded?: Date;
}

export const certs: Cert[] = certifications.map((c) => {
  const awarded = c.date ? new Date(`${c.date}T00:00:00Z`) : undefined;
  if (awarded && Number.isNaN(awarded.getTime())) throw new Error(`data/profile.ts: la fecha de "${c.id}" no es AAAA-MM-DD.`);
  return { ...c, image: imageById.get(c.id), pdf: pdfById.get(c.id), awarded };
});

if (new Set(certs.map((c) => c.id)).size !== certs.length) throw new Error('data/profile.ts: hay dos certificaciones con el mismo id.');

export const certHref = (c: Pick<Certification, 'id'>) => `/certificados/#${c.id}`;
