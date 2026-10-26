import type { CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';
import { entryBadge, monogram } from './format';
import type { IconName } from './icons';
import { areas, bbPlatforms, ctfPlatforms, difficulties, severities, targetOs } from './taxonomy';
import type { ColorToken } from './tone';

export interface EntryCardProps {
  href: string;
  title: string;
  meta: string;
  /** Color de la tarjeta (borde, portada, insignia). */
  color: ColorToken;
  /** Último dato de la línea de meta, con su propio color (dificultad, severidad). */
  accent?: { text: string; color: ColorToken };
  cover: { kind: 'monogram'; text: string } | { kind: 'icon'; icon: IconName } | { kind: 'image'; src: ImageMetadata; alt: string };
  badge?: string;
}

export function ctfCard(entry: CollectionEntry<'ctf'>): EntryCardProps {
  const d = entry.data;
  const difficulty = difficulties[d.difficulty];
  return {
    href: `/ctf/${entry.id}/`,
    title: d.title,
    meta: `${ctfPlatforms[d.platform].short} · ${targetOs[d.os]}`,
    color: 'ctf',
    accent: { text: difficulty.label.toLowerCase(), color: difficulty.color },
    cover: d.cover ? { kind: 'image', src: d.cover, alt: d.coverAlt ?? '' } : { kind: 'monogram', text: monogram(d.title) },
    badge: entryBadge(d),
  };
}

export function noteCard(entry: CollectionEntry<'notes'>): EntryCardProps {
  const d = entry.data;
  const area = areas[d.area];
  return {
    href: `/biblia/${entry.id}/`,
    title: d.title,
    meta: 'Biblia',
    color: 'biblia',
    accent: { text: area.label.toLowerCase(), color: area.color },
    cover: { kind: 'icon', icon: 'book' },
    badge: entryBadge(d),
  };
}

export function bugbountyCard(entry: CollectionEntry<'bugbounty'>): EntryCardProps {
  const d = entry.data;
  const severity = severities[d.severity];
  return {
    href: `/bugbounty/${entry.id}/`,
    title: d.title,
    meta: d.platform ? bbPlatforms[d.platform] : d.program,
    color: 'bb',
    accent: { text: severity.label.toLowerCase(), color: severity.color },
    cover: { kind: 'icon', icon: 'bug' },
    badge: entryBadge(d),
  };
}
