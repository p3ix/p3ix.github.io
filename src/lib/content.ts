import { getCollection, type CollectionEntry } from 'astro:content';
import { PHASE_IDS, type AreaId, type PhaseId, type PromptId } from './taxonomy';
import { VARIABLE_PATTERN, isVariableName, type VariableName } from './variables';

type Dated = 'ctf' | 'bugbounty' | 'notes' | 'ports';

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

// ---------- Puertos y servicios ----------

export const portHref = (id: string) => `/biblia/puertos/${id}/`;

/** `445/tcp` → 445. */
export const portNumber = (port: string) => Number(port.split('/')[0]);

/**
 * Servicios publicados, del puerto más bajo al más alto. Falla si dos servicios reclaman el mismo
 * puerto (un número tiene que llevar a una sola página).
 */
export async function getPorts() {
  const entries = await getPublished('ports');
  const owner = new Map<string, string>();
  for (const entry of entries) {
    for (const port of entry.data.ports) {
      const other = owner.get(port);
      if (other) throw new Error(`El puerto ${port} está en ports/${other}.mdx y en ports/${entry.id}.mdx.`);
      owner.set(port, entry.id);
    }
  }
  return entries.sort((a, b) => portNumber(a.data.ports[0]) - portNumber(b.data.ports[0]) || a.id.localeCompare(b.id));
}

/**
 * Todo lo que cuelga de un servicio: los comandos con alguna de sus etiquetas o en `related`,
 * agrupados por fase, y las notas con sus etiquetas o en `related`. `exclude` son los comandos ya
 * incrustados en el cuerpo con <Cmd>, que no se repiten. Falla con un `related` que no existe.
 */
export function linkedToPort(
  entry: CollectionEntry<'ports'>,
  commands: Command[],
  notes: CollectionEntry<'notes'>[],
  exclude: string[] = [],
) {
  const d = entry.data;
  const tags = new Set(d.tags);
  const linked = new Set(commands.filter((c) => c.tags.some((t) => tags.has(t))));
  const linkedNotes = new Set(notes.filter((n) => n.data.tags.some((t) => tags.has(t))));
  for (const id of d.related) {
    const command = commands.find((c) => c.id === id);
    const note = notes.find((n) => n.id === id);
    if (command) linked.add(command);
    else if (note) linkedNotes.add(note);
    else throw new Error(`Puerto ${entry.id}: "${id}" en related no es ningún comando ni ninguna nota.`);
  }

  const shown = [...linked].filter((c) => !exclude.includes(c.id));
  // Una sección por fase, en el orden del ataque: las que tienen texto o algún comando.
  const byPhase = PHASE_IDS.map((phase) => ({
    phase,
    text: d.phases[phase],
    commands: shown.filter((c) => c.phase === phase),
  })).filter((g) => g.text || g.commands.length > 0);

  return {
    byPhase,
    commands: shown,
    notes: [...linkedNotes].sort((a, b) => a.data.area.localeCompare(b.data.area) || (a.data.order ?? Infinity) - (b.data.order ?? Infinity)),
  };
}
