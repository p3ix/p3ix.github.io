import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import {
  AREA_IDS,
  BB_PLATFORM_IDS,
  BB_STATUS_IDS,
  CTF_PLATFORM_IDS,
  DIFFICULTY_IDS,
  LAUNCH_OS_IDS,
  PHASE_IDS,
  PROMPT_IDS,
  RETIRED_ONLY_PLATFORMS,
  SEVERITY_IDS,
  TARGET_OS_IDS,
  ctfPlatforms,
} from './lib/taxonomy';
import { VARIABLE_NAMES, VARIABLE_PATTERN, isVariableName } from './lib/variables';

// Las reglas de publicación (HTB solo retirado, permiso de divulgación...) se validan aquí: si una entrada
// las incumple, `astro build` falla con el mensaje en español.

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const kebab = (what: string) =>
  z.string().regex(KEBAB, { error: `${what}: minúsculas sin acentos, separadas por guiones (p. ej. active-directory)` });

/** Campos comunes a writeups y notas. */
const common = {
  title: z.string().min(1),
  /** Una o dos frases: se usa en tarjetas, listados y meta description. */
  summary: z.string().min(1).max(280),
  date: z.coerce.date(),
  updated: z.coerce.date().optional(),
  tags: z.array(kebab('Etiqueta')).default([]),
  /** En producción no se publica. Ojo: el repo es público, el archivo sí se ve en GitHub. */
  draft: z.boolean().default(false),
};

/** `forest/index.mdx` y `forest.mdx` → `forest`. */
const idFromPath = ({ entry }: { entry: string }) => entry.replace(/(?:\/index)?\.mdx?$/, '');

const ctf = defineCollection({
  loader: glob({ pattern: ['*.mdx', '*/index.mdx'], base: './src/content/ctf', generateId: idFromPath }),
  schema: ({ image }) =>
    z
      .object({
        ...common,
        platform: z.enum(CTF_PLATFORM_IDS),
        os: z.enum(TARGET_OS_IDS),
        difficulty: z.enum(DIFFICULTY_IDS),
        techniques: z.array(kebab('Técnica')).min(1),
        tools: z.array(z.string()).default([]),
        cover: image().optional(),
        coverAlt: z.string().optional(),
        retired: z.boolean(),
        retiredDate: z.coerce.date().optional(),
      })
      .superRefine((data, ctx) => {
        if (RETIRED_ONLY_PLATFORMS.includes(data.platform) && !data.retired) {
          ctx.addIssue({
            code: 'custom',
            path: ['retired'],
            message: `${ctfPlatforms[data.platform].label}: solo se puede publicar contenido retirado. Mientras siga activo, el writeup va en private/ (ni siquiera como borrador: el repo es público).`,
          });
        }
        if (data.cover && !data.coverAlt) {
          ctx.addIssue({ code: 'custom', path: ['coverAlt'], message: 'Si hay portada, describe la imagen en coverAlt.' });
        }
      }),
});

const bugbounty = defineCollection({
  loader: glob({ pattern: ['*.mdx', '*/index.mdx'], base: './src/content/bugbounty', generateId: idFromPath }),
  schema: ({ image }) =>
    z
      .object({
        ...common,
        /** Nombre del programa, o "Programa privado" si no se puede nombrar. */
        program: z.string().min(1),
        platform: z.enum(BB_PLATFORM_IDS).optional(),
        severity: z.enum(SEVERITY_IDS),
        cvss: z.number().min(0).max(10).optional(),
        cvssVector: z.string().startsWith('CVSS:').optional(),
        cwe: z
          .string()
          .regex(/^CWE-\d+$/, { error: 'cwe: formato CWE-639' })
          .optional(),
        /** Texto libre: "500 €", "swag", "Hall of Fame"... */
        bounty: z.string().optional(),
        status: z.enum(BB_STATUS_IDS),
        // Sin permiso del programa no se publica, ni siquiera como borrador (el repo es público).
        disclosurePermission: z.boolean().refine((granted) => granted, {
          error:
            'disclosurePermission tiene que ser true: sin permiso de divulgación del programa el reporte va en private/.',
        }),
        timeline: z.array(z.object({ date: z.coerce.date(), event: z.string().min(1) })).default([]),
        /** Trofeo del reporte: tarjeta de recompensa, carta de agradecimiento, certificado... */
        cover: image().optional(),
        coverAlt: z.string().optional(),
      })
      .superRefine((data, ctx) => {
        if (data.cover && !data.coverAlt) {
          ctx.addIssue({ code: 'custom', path: ['coverAlt'], message: 'Si hay portada, describe la imagen en coverAlt.' });
        }
      }),
});

const notes = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/notes' }),
  schema: z.object({
    ...common,
    area: z.enum(AREA_IDS),
    /** Orden dentro del área (menor primero). Sin order, por título. */
    order: z.number().int().optional(),
    /** ids de comandos (impacket-getuserspns) o de notas (ad/kerberoasting) relacionados. */
    related: z.array(z.string()).default([]),
  }),
});

const command = z
  .object({
    /** Único en toda la biblia y estable: se usa en <Cmd id="..." /> y en `related`. */
    id: kebab('id del comando'),
    title: z.string().min(1),
    cmd: z
      .string()
      .min(1)
      .transform((s) => s.trimEnd()),
    /** Si el comando es de otra área que el resto del archivo. */
    area: z.enum(AREA_IDS).optional(),
    phase: z.enum(PHASE_IDS),
    os: z.array(z.enum(LAUNCH_OS_IDS)).min(1).default(['linux']),
    /** Si se escribe en otra consola que el resto del archivo. */
    prompt: z.enum(PROMPT_IDS).optional(),
    tags: z.array(kebab('Etiqueta')).default([]),
    notes: z.string().optional(),
    refs: z.array(z.url()).default([]),
  })
  .superRefine((c, ctx) => {
    for (const [, name] of c.cmd.matchAll(VARIABLE_PATTERN)) {
      if (!isVariableName(name)) {
        ctx.addIssue({
          code: 'custom',
          path: ['cmd'],
          message: `${c.id}: variable desconocida {{${name}}}. Válidas: ${VARIABLE_NAMES.join(', ')}.`,
        });
      }
    }
  });

const commands = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml}', base: './src/content/commands' }),
  schema: z
    .object({
      tool: z.string().min(1),
      area: z.enum(AREA_IDS),
      /** Web o repo de la herramienta. */
      url: z.url().optional(),
      /** Consola en la que se escriben sus comandos: shell, msf o meterpreter. */
      prompt: z.enum(PROMPT_IDS).default('shell'),
      commands: z.array(command).min(1),
    })
    .superRefine((file, ctx) => {
      const seen = new Set<string>();
      file.commands.forEach((c, i) => {
        if (seen.has(c.id)) {
          ctx.addIssue({ code: 'custom', path: ['commands', i, 'id'], message: `id repetido: ${c.id}` });
        }
        seen.add(c.id);
      });
    }),
});

export const collections = { ctf, bugbounty, notes, commands };
