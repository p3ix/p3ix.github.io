import type { APIRoute } from 'astro';
import { tools } from '@/data/profile';
import { getCommands, getNotes, getPublished } from '@/lib/content';
import { getTags, tagBreakdown } from '@/lib/tags';
import { areas, ctfPlatforms, severities } from '@/lib/taxonomy';

/**
 * Índice de la paleta Ctrl+K: comandos y páginas. Se genera en el build (en producción sin
 * borradores) y la paleta lo descarga la primera vez que se abre.
 */
export interface SearchIndex {
  commands: { id: string; title: string; tool: string; cmd: string; tags: string; area: string; color: string }[];
  pages: { id: string; url: string; title: string; summary: string; kind: string; color: string; tags: string }[];
}

export const GET: APIRoute = async () => {
  const [commands, ctf, bugbounty, notes, tags] = await Promise.all([
    getCommands(),
    getPublished('ctf'),
    getPublished('bugbounty'),
    getNotes(),
    getTags(),
  ]);

  const index: SearchIndex = {
    commands: commands.map((c) => ({
      id: c.id,
      title: c.title,
      tool: c.tool,
      cmd: c.cmd,
      tags: c.tags.join(' '),
      area: areas[c.area].label,
      color: areas[c.area].color,
    })),
    pages: [
      { id: 'home', url: '/', title: 'Inicio', summary: 'Portada de p3i', kind: 'Sección', color: 'home', tags: '' },
      { id: 'ctf', url: '/ctf/', title: 'Writeups CTF', summary: 'Máquinas retiradas', kind: 'Sección', color: 'ctf', tags: 'htb hackthebox' },
      { id: 'bb', url: '/bugbounty/', title: 'Bug bounty', summary: 'Reportes divulgados', kind: 'Sección', color: 'bb', tags: 'reportes' },
      { id: 'biblia', url: '/biblia/', title: 'Biblia', summary: 'Notas y metodología', kind: 'Sección', color: 'biblia', tags: 'notas' },
      { id: 'comandos', url: '/biblia/comandos/', title: 'Buscador de comandos', summary: 'Todos los comandos con variables', kind: 'Sección', color: 'biblia', tags: 'cheatsheet' },
      { id: 'herramientas', url: '/herramientas/', title: 'Herramientas', summary: 'Herramientas propias y arsenal de la biblia', kind: 'Sección', color: 'tools', tags: 'github tools' },
      { id: 'whoami', url: '/whoami/', title: 'whoami', summary: 'Perfil, experiencia y CV', kind: 'Sección', color: 'whoami', tags: 'cv perfil' },
      { id: 'etiquetas', url: '/etiquetas/', title: 'Etiquetas', summary: 'Todo el contenido por tema', kind: 'Sección', color: 'tags', tags: 'tags temas' },
      ...tools.map((t) => ({
        id: `tool/${t.name}`,
        url: `/herramientas/#${t.name}`,
        title: t.name,
        summary: t.description,
        kind: 'Herramienta',
        color: 'tools',
        tags: t.language,
      })),
      ...tags.map((t) => ({
        id: `tag/${t.name}`,
        url: `/etiquetas/${t.name}/`,
        title: `#${t.name}`,
        summary: tagBreakdown(t)
          .map((b) => b.label)
          .join(' · '),
        kind: 'Etiqueta',
        color: 'tags',
        tags: t.name.replaceAll('-', ' '),
      })),
      ...ctf.map((e) => ({
        id: `ctf/${e.id}`,
        url: `/ctf/${e.id}/`,
        title: e.data.title,
        summary: e.data.summary,
        kind: `CTF · ${ctfPlatforms[e.data.platform].short}`,
        color: 'ctf',
        tags: [...e.data.tags, ...e.data.techniques].join(' '),
      })),
      ...bugbounty.map((e) => ({
        id: `bugbounty/${e.id}`,
        url: `/bugbounty/${e.id}/`,
        title: e.data.title,
        summary: e.data.summary,
        kind: `Bug bounty · ${severities[e.data.severity].label}`,
        color: 'bb',
        tags: e.data.tags.join(' '),
      })),
      ...notes.map((e) => ({
        id: `notes/${e.id}`,
        url: `/biblia/${e.id}/`,
        title: e.data.title,
        summary: e.data.summary,
        kind: `Biblia · ${areas[e.data.area].label}`,
        color: areas[e.data.area].color,
        tags: e.data.tags.join(' '),
      })),
    ],
  };

  return new Response(JSON.stringify(index), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
