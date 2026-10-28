import { getCollection, type CollectionEntry } from 'astro:content';
import type { AreaId, PhaseId, PromptId } from './taxonomy';
import { VARIABLE_PATTERN, isVariableName, type VariableName } from './variables';

type Dated = 'ctf' | 'bugbounty' | 'notes';

/**
 * Entradas que se publican: en producción sin borradores, en `npm run dev` todas (para poder
 * previsualizarlos). Ordenadas de más reciente a más antigua.
 */
export async function getPublished<C extends Dated>(collection: C): Promise<CollectionEntry<C>[]> {
  const entries = (await getCollection(collection)) as CollectionEntry<C>[];
  return entries
    .filter((entry) => !(import.meta.env.PROD && entry.data.draft))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/**
 * Notas publicadas de la biblia. Falla si una nota está en una carpeta que no coincide con su
 * `area` (notes/ad/x.mdx tiene que tener `area: ad`).
 */
export async function getNotes() {
  const notes = await getPublished('notes');
  for (const note of notes) {
    const folder = note.id.split('/')[0];
    if (folder !== note.data.area) {
      throw new Error(`Nota ${note.id}: está en notes/${folder}/ pero su area es "${note.data.area}".`);
    }
  }
  return notes;
}

/** Un comando ya aplanado: lleva los datos de su archivo (herramienta y área). */
export interface Command {
  id: string;
  title: string;
  cmd: string;
  tool: string;
  toolUrl?: string;
  area: AreaId;
  phase: PhaseId;
  os: ('linux' | 'windows')[];
  prompt: PromptId;
  tags: string[];
  notes?: string;
  refs: string[];
  /** Archivo de origen (impacket → src/content/commands/impacket.yaml). */
  file: string;
}

/**
 * Todos los comandos de la biblia, ordenados por herramienta y título.
 * Falla si un id se repite entre archivos (dentro de un archivo ya lo comprueba el schema).
 */
export async function getCommands(): Promise<Command[]> {
  const files = await getCollection('commands');
  const commands = files.flatMap((file) =>
    file.data.commands.map((c) => ({
      ...c,
      tool: file.data.tool,
      toolUrl: file.data.url,
      area: c.area ?? file.data.area,
      prompt: c.prompt ?? file.data.prompt,
      file: file.id,
    })),
  );

  const seen = new Map<string, string>();
  for (const c of commands) {
    const other = seen.get(c.id);
    if (other) throw new Error(`Comando con id repetido "${c.id}" en commands/${other}.yaml y commands/${c.file}.yaml.`);
    seen.set(c.id, c.file);
  }

  return commands.sort((a, b) => a.tool.localeCompare(b.tool) || a.title.localeCompare(b.title));
}

export async function getCommand(id: string) {
  const command = (await getCommands()).find((c) => c.id === id);
  if (!command) throw new Error(`No existe ningún comando con id "${id}" (src/content/commands/*.yaml).`);
  return command;
}

/** Trozos de un comando: texto literal o una variable {{X}}. */
export type CommandPart = { text: string } | { variable: VariableName };

export function splitCommand(cmd: string): CommandPart[] {
  const parts: CommandPart[] = [];
  let last = 0;
  for (const match of cmd.matchAll(VARIABLE_PATTERN)) {
    const name = match[1];
    const index = match.index ?? 0;
    if (index > last) parts.push({ text: cmd.slice(last, index) });
    // El schema ya rechaza variables desconocidas; si alguna llega aquí, se deja como texto.
    parts.push(isVariableName(name) ? { variable: name } : { text: match[0] });
    last = index + match[0].length;
  }
  if (last < cmd.length) parts.push({ text: cmd.slice(last) });
  return parts;
}

/** Variables que aparecen en uno o varios textos, sin repetir y en orden de aparición. */
export function variablesIn(...texts: (string | undefined)[]): VariableName[] {
  const found = new Set<VariableName>();
  for (const text of texts) {
    for (const [, name] of (text ?? '').matchAll(VARIABLE_PATTERN)) {
      if (isVariableName(name)) found.add(name);
    }
  }
  return [...found];
}
