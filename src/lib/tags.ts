import type { CollectionEntry } from 'astro:content';
import { getCommands, getNotes, getPublished, type Command } from './content';

/** Todo lo que lleva una etiqueta. En los writeups de CTF también cuentan las técnicas. */
export interface Tag {
  name: string;
  ctf: CollectionEntry<'ctf'>[];
  bugbounty: CollectionEntry<'bugbounty'>[];
  notes: CollectionEntry<'notes'>[];
  commands: Command[];
  total: number;
}

export const tagHref = (name: string) => `/etiquetas/${name}/`;

/** Tipos de contenido de una etiqueta, en el orden en que se muestran. `color` es un token de global.css. */
export const TAG_KINDS = [
  { key: 'ctf', one: 'writeup', many: 'writeups', color: 'ctf' },
  { key: 'bugbounty', one: 'reporte', many: 'reportes', color: 'bb' },
  { key: 'notes', one: 'nota', many: 'notas', color: 'biblia' },
  { key: 'commands', one: 'comando', many: 'comandos', color: 'biblia' },
] as const;

/** "1 writeup · 2 comandos": solo los tipos que tienen algo. */
export const tagBreakdown = (tag: Tag) =>
  TAG_KINDS.filter((k) => tag[k.key].length > 0).map((k) => {
    const n = tag[k.key].length;
    return { ...k, count: n, label: `${n} ${n === 1 ? k.one : k.many}` };
  });

/**
 * Etiquetas del contenido publicado (en `npm run dev`, también de los borradores), de la más usada
 * a la menos y, a igualdad, por orden alfabético.
 */
export async function getTags(): Promise<Tag[]> {
  const [ctf, bugbounty, notes, commands] = await Promise.all([
    getPublished('ctf'),
    getPublished('bugbounty'),
    getNotes(),
    getCommands(),
  ]);

  const tags = new Map<string, Tag>();
  const add = <K extends 'ctf' | 'bugbounty' | 'notes' | 'commands'>(names: string[], kind: K, item: Tag[K][number]) => {
    // Un writeup con la misma etiqueta en tags y en techniques cuenta una vez.
    for (const name of new Set(names)) {
      const tag = tags.get(name) ?? { name, ctf: [], bugbounty: [], notes: [], commands: [], total: 0 };
      (tag[kind] as Tag[K][number][]).push(item);
      tag.total++;
      tags.set(name, tag);
    }
  };

  for (const e of ctf) add([...e.data.tags, ...e.data.techniques], 'ctf', e);
  for (const e of bugbounty) add(e.data.tags, 'bugbounty', e);
  for (const e of notes) add(e.data.tags, 'notes', e);
  for (const c of commands) add(c.tags, 'commands', c);

  return [...tags.values()].sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
}

/** Etiquetas que más aparecen junto a `tag` en las mismas entradas y comandos. */
export function relatedTags(tag: Tag, all: Tag[], limit = 8) {
  const items = new Set<unknown>([...tag.ctf, ...tag.bugbounty, ...tag.notes, ...tag.commands]);
  return all
    .filter((other) => other.name !== tag.name)
    .map((other) => ({
      tag: other,
      shared: [...other.ctf, ...other.bugbounty, ...other.notes, ...other.commands].filter((item) => items.has(item)).length,
    }))
    .filter((x) => x.shared > 0)
    .sort((a, b) => b.shared - a.shared || b.tag.total - a.tag.total || a.tag.name.localeCompare(b.tag.name))
    .slice(0, limit)
    .map((x) => x.tag);
}
