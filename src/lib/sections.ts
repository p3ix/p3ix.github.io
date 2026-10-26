import type { IconName } from './icons';

export type SectionId = 'home' | 'ctf' | 'bb' | 'biblia' | 'tools' | 'whoami' | 'tags';

export interface Section {
  id: SectionId;
  /** Texto del menú lateral. */
  label: string;
  /** Texto de las baldosas de acceso de la home. */
  tileLabel: string;
  href: string;
  icon: IconName;
  /**
   * Clases completas del color de la sección. Tienen que estar escritas tal cual:
   * Tailwind solo genera las clases que encuentra literalmente en el código.
   */
  cls: {
    text: string;
    solid: string;
    soft: string;
    faint: string;
    border: string;
    borderStrong: string;
  };
}

export const sections: Section[] = [
  {
    id: 'home',
    label: 'Inicio',
    tileLabel: 'Inicio',
    href: '/',
    icon: 'home',
    cls: {
      text: 'text-home',
      solid: 'bg-home',
      soft: 'bg-home/12',
      faint: 'bg-home/6',
      border: 'border-home/35',
      borderStrong: 'border-home/55',
    },
  },
  {
    id: 'ctf',
    label: 'Writeups CTF',
    tileLabel: 'Writeups CTF',
    href: '/ctf/',
    icon: 'terminal',
    cls: {
      text: 'text-ctf',
      solid: 'bg-ctf',
      soft: 'bg-ctf/12',
      faint: 'bg-ctf/6',
      border: 'border-ctf/35',
      borderStrong: 'border-ctf/55',
    },
  },
  {
    id: 'bb',
    label: 'Bug bounty',
    tileLabel: 'Bug bounty',
    href: '/bugbounty/',
    icon: 'bug',
    cls: {
      text: 'text-bb',
      solid: 'bg-bb',
      soft: 'bg-bb/12',
      faint: 'bg-bb/6',
      border: 'border-bb/35',
      borderStrong: 'border-bb/55',
    },
  },
  {
    id: 'biblia',
    label: 'Biblia',
    tileLabel: 'Biblia',
    href: '/biblia/',
    icon: 'book',
    cls: {
      text: 'text-biblia',
      solid: 'bg-biblia',
      soft: 'bg-biblia/12',
      faint: 'bg-biblia/6',
      border: 'border-biblia/35',
      borderStrong: 'border-biblia/55',
    },
  },
  {
    id: 'tools',
    label: 'Herramientas',
    tileLabel: 'Herramientas',
    href: '/herramientas/',
    icon: 'wrench',
    cls: {
      text: 'text-tools',
      solid: 'bg-tools',
      soft: 'bg-tools/12',
      faint: 'bg-tools/6',
      border: 'border-tools/35',
      borderStrong: 'border-tools/55',
    },
  },
  {
    id: 'whoami',
    label: 'whoami',
    tileLabel: 'whoami y CV',
    href: '/whoami/',
    icon: 'user',
    cls: {
      text: 'text-whoami',
      solid: 'bg-whoami',
      soft: 'bg-whoami/12',
      faint: 'bg-whoami/6',
      border: 'border-whoami/35',
      borderStrong: 'border-whoami/55',
    },
  },
  {
    id: 'tags',
    label: 'Etiquetas',
    tileLabel: 'Etiquetas',
    href: '/etiquetas/',
    icon: 'hash',
    cls: {
      text: 'text-tags',
      solid: 'bg-tags',
      soft: 'bg-tags/12',
      faint: 'bg-tags/6',
      border: 'border-tags/35',
      borderStrong: 'border-tags/55',
    },
  },
];

export const sectionById = Object.fromEntries(sections.map((s) => [s.id, s])) as Record<SectionId, Section>;
