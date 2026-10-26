import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getNotes, getPublished } from '@/lib/content';
import { areas, ctfPlatforms, severities } from '@/lib/taxonomy';

// Feed con todo lo publicado: writeups, reportes y notas de la biblia (sin borradores).
export const GET: APIRoute = async (context) => {
  const [ctf, bugbounty, notes] = await Promise.all([getPublished('ctf'), getPublished('bugbounty'), getNotes()]);

  const items = [
    ...ctf.map((e) => ({
      title: `${e.data.title} (${ctfPlatforms[e.data.platform].short})`,
      description: e.data.summary,
      pubDate: e.data.date,
      link: `/ctf/${e.id}/`,
      categories: ['CTF', ...e.data.tags],
    })),
    ...bugbounty.map((e) => ({
      title: e.data.title,
      description: `[${severities[e.data.severity].label}] ${e.data.summary}`,
      pubDate: e.data.date,
      link: `/bugbounty/${e.id}/`,
      categories: ['Bug bounty', ...e.data.tags],
    })),
    ...notes.map((e) => ({
      title: e.data.title,
      description: e.data.summary,
      pubDate: e.data.updated ?? e.data.date,
      link: `/biblia/${e.id}/`,
      categories: ['Biblia', areas[e.data.area].label, ...e.data.tags],
    })),
  ].sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());

  return rss({
    title: 'p3i · bug bounty hunter',
    description: 'Writeups de bug bounty y CTF y la biblia de comandos de p3i (Asier Lara).',
    site: context.site ?? 'https://p3ix.github.io',
    items,
    customData: '<language>es-es</language>',
    trailingSlash: true,
  });
};
