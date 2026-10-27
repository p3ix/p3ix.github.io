import type { IconName } from '@/lib/icons';
import type { ColorToken } from '@/lib/tone';

/**
 * Utilidades interactivas de la biblia, cada una con su página en src/pages/biblia/utilidades/.
 * De aquí salen su tarjeta en /biblia/, su entrada en la paleta Ctrl+K y su imagen OG.
 */
export interface Utility {
  /** Nombre del archivo de la página: /biblia/utilidades/<id>/. */
  id: string;
  title: string;
  summary: string;
  icon: IconName;
  color: ColorToken;
  /** Palabras extra para la paleta: sinónimos y términos en inglés. */
  keywords: string;
}

export const utilities: Utility[] = [
  {
    id: 'subredes',
    title: 'Calculadora de subredes',
    summary: 'Red, broadcast, rango de hosts y máscara de cualquier IPv4, con los bits de red y de host a la vista.',
    icon: 'network',
    color: 'area-recon',
    keywords: 'subnet cidr mascara netmask wildcard broadcast ipcalc ipv4 red',
  },
];

export const utilityHref = (u: Utility) => `/biblia/utilidades/${u.id}/`;
