import type { APIRoute, GetStaticPaths } from 'astro';
import { tools } from '@/data/profile';
import { utilities } from '@/data/utilities';
import { getNotes, getPublished } from '@/lib/content';
import { monogram } from '@/lib/format';
import { renderOg, type OgCard } from '@/lib/og';
import { getTags, tagBreakdown } from '@/lib/tags';
import { areas, bbPlatforms, ctfPlatforms, difficulties, severities, targetOs } from '@/lib/taxonomy';

// Una imagen por página: /og/default.png, /og/ctf/forest.png, /og/biblia/ad/kerberoasting.png...
// Cada página pasa la suya a BaseLayout con `ogImage`; sin ella, /og/default.png.
export const getStaticPaths = (async () => {
  const [ctf, bugbounty, notes, tags] = await Promise.all([getPublished('ctf'), getPublished('bugbounty'), getNotes(), getTags()]);

  const pages: { route: string; card: OgCard }[] = [
    {
      route: 'default',
      card: {
        kicker: 'Bug bounty hunter',
        title: 'p3i · Asier Lara',
        summary: 'Writeups de bug bounty y CTF, la biblia de comandos que uso en cada auditoría y mi whoami.',
        color: 'brand',
        path: '',
      },
    },
    {
      route: 'ctf',
      card: { kicker: 'Writeups CTF', title: 'Máquinas retiradas', summary: 'Cada paso explicado: por qué funciona y cómo se detecta.', color: 'ctf', path: 'ctf' },
    },
    {
      route: 'bugbounty',
      card: { kicker: 'Bug bounty', title: 'Reportes divulgados', summary: 'Hallazgos reales, publicados con permiso del programa y redactados.', color: 'bb', path: 'bugbounty' },
    },
    {
      route: 'biblia',
      card: { kicker: 'Biblia', title: 'Biblia de hacking', summary: 'Metodología y comandos por área, con detección y mitigación.', color: 'biblia', path: 'biblia' },
    },
    {
      route: 'biblia/comandos',
      card: { kicker: 'Biblia', title: 'Buscador de comandos', summary: 'Rellena el objetivo una vez y copia cada comando listo para pegar.', color: 'biblia', path: 'biblia/comandos' },
    },
    ...utilities.map((u) => ({
      route: `biblia/utilidades/${u.id}`,
      card: { kicker: 'Biblia · Utilidades', title: u.title, summary: u.summary, color: u.color, path: `biblia/utilidades/${u.id}` },
    })),
    {
      route: 'whoami',
      card: { kicker: 'whoami', title: 'Asier Lara Arroyo', summary: 'Ingeniero informático y bug bounty hunter. Hall of fame, herramientas y experiencia.', color: 'whoami', path: 'whoami' },
    },
    {
      route: 'herramientas',
      card: {
        kicker: 'Herramientas',
        title: 'Herramientas propias',
        summary: `${tools.map((t) => t.name).join(', ')} y el arsenal de la biblia.`,
        color: 'tools',
        path: 'herramientas',
        chips: tools.map((t) => ({ text: t.name })),
      },
    },
    {
      route: 'etiquetas',
      card: { kicker: 'Etiquetas', title: 'Etiquetas', summary: 'Writeups, reportes, notas y comandos de la biblia agrupados por tema.', color: 'tags', path: 'etiquetas' },
    },
    ...tags.map((tag) => ({
      route: `etiquetas/${tag.name}`,
      card: {
        kicker: 'Etiqueta',
        title: `#${tag.name}`,
        summary: `Todo lo que hay en p3i sobre #${tag.name}, en un solo sitio.`,
        color: 'tags',
        path: `etiquetas/${tag.name}`,
        chips: tagBreakdown(tag).map((b) => ({ text: b.label, color: b.color })),
      },
    })),
    ...ctf.map((e) => {
      const difficulty = difficulties[e.data.difficulty];
      return {
        route: `ctf/${e.id}`,
        card: {
          kicker: `Writeup · ${ctfPlatforms[e.data.platform].label}`,
          title: e.data.title,
          summary: e.data.summary,
          color: 'ctf',
          path: `ctf/${e.id}`,
          monogram: monogram(e.data.title),
          chips: [{ text: targetOs[e.data.os] }, { text: difficulty.label, color: difficulty.color }],
        },
      };
    }),
    ...bugbounty.map((e) => {
      const severity = severities[e.data.severity];
      const chips = [
        { text: e.data.cvss !== undefined ? `${severity.label} · ${e.data.cvss.toFixed(1)}` : severity.label, color: severity.color },
        ...(e.data.cwe ? [{ text: e.data.cwe }] : []),
      ];
      return {
        route: `bugbounty/${e.id}`,
        card: {
          kicker: `Bug bounty · ${e.data.platform ? bbPlatforms[e.data.platform] : e.data.program}`,
          title: e.data.title,
          summary: e.data.summary,
          color: 'bb',
          path: `bugbounty/${e.id}`,
          chips,
        },
      };
    }),
    ...notes.map((e) => {
      const area = areas[e.data.area];
      return {
        route: `biblia/${e.id}`,
        card: {
          kicker: `Biblia · ${area.label}`,
          title: e.data.title,
          summary: e.data.summary,
          color: area.color,
          path: `biblia/${e.id}`,
          monogram: monogram(e.data.title),
          chips: e.data.tags.slice(0, 3).map((t) => ({ text: `#${t}` })),
        },
      };
    }),
  ];

  return pages.map(({ route, card }) => ({ params: { route }, props: { card } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const png = await renderOg((props as { card: OgCard }).card);
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
