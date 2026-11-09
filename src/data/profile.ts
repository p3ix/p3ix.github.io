import type { IconName } from '@/lib/icons';
import type { AreaId } from '@/lib/taxonomy';
import type { ColorToken } from '@/lib/tone';

/**
 * Datos del whoami. Fuente: CV de Asier.
 * Nunca teléfono ni dirección postal.
 */
export const profile = {
  name: 'Asier Lara Arroyo',
  shortName: 'Asier Lara',
  firstName: 'Asier',
  handle: 'p3i',
  role: 'Ingeniero informático · Bug Bounty Hunter',
  tagline: 'rompiendo cosas con permiso',
  location: 'Burgos, España',
  site: 'p3ix.github.io',
  bio: 'Ingeniero informático con pasión por la seguridad ofensiva. Participo en programas de bug bounty y VDP, con vulnerabilidades aceptadas en Bugcrowd, YesWeHack y Grayback. Tengo experiencia en auditorías web y de Active Directory, y desarrollo mis propias herramientas de pentesting.',
} as const;

/** Perfiles del hall of fame: solo el enlace a cada plataforma. */
export interface Platform {
  name: string;
  handle: string;
  url: string;
}

export const platforms: Platform[] = [
  { name: 'Bugcrowd', handle: 'p3iv2', url: 'https://bugcrowd.com/h/p3iv2' },
  { name: 'YesWeHack', handle: 'p3i', url: 'https://yeswehack.com/hunters/p3i' },
  { name: 'Grayback', handle: 'p3i', url: 'https://app.grayback.es/profile/p3i' },
];

/** Herramientas propias: /herramientas/ y el whoami de la portada. Datos sacados de cada README. */
export interface Tool {
  name: string;
  description: string;
  /** Área de la biblia en la que encaja: da el color de su etiqueta. */
  area: AreaId;
  repo: string;
  language: string;
  license?: string;
  /** Un ejemplo de uso tal cual se escribe en la terminal. */
  usage: string;
  highlights: string[];
}

export const tools: Tool[] = [
  {
    name: 'subenum',
    description:
      'Reconocimiento para bug bounty: subdominios pasivos, fuerza bruta DNS, permutaciones, HTTP vivos, WAF, CNAME takeovers y secretos en JS.',
    area: 'recon',
    repo: 'https://github.com/p3ix/BBTools',
    language: 'Python',
    usage: 'python -m subenum.main run -i domains.txt --permutate --recursive',
    highlights: [
      '14 fuentes pasivas en paralelo (8 sin API key), fuerza bruta DNS y permutaciones',
      'Sondeo HTTP, huella de tecnologías, detección de WAF y auditoría de cabeceras',
      'Takeovers por CNAME, endpoints y secretos en JavaScript, puntuación de objetivos',
      'Pensada para dejarla corriendo en un VPS y reanudar si se corta la conexión',
    ],
  },
  {
    name: 'bypass-403',
    description: 'Combina variaciones de rutas, cabeceras y métodos para probar bypasses de respuestas 403.',
    area: 'web',
    repo: 'https://github.com/p3ix/Bypass-403',
    language: 'Python',
    usage: 'bypass https://app.example.com/admin',
    highlights: [
      'Rutas, cabeceras, métodos, parámetros y variantes de protocolo contra 403 y 401',
      'Pruebas de Host/SNI con sockets en crudo y sondas ligeras de request smuggling',
      'Verifica cada hallazgo contra una línea base nueva y lo exporta como curl, JSON o CSV',
      'Concurrencia controlada, límite por host y espera automática ante 429/503',
    ],
  },
  {
    name: 'scan-nuclei',
    description: 'Plantillas de Nuclei propias para stacks Java/Spring/Jakarta y Apache/Tomcat/WildFly.',
    area: 'web',
    repo: 'https://github.com/p3ix/scan-nuclei',
    language: 'Nuclei YAML',
    license: 'MIT',
    usage: 'nuclei -t ./templates -u https://app.example.com -severity critical,high,medium',
    highlights: [
      '416 plantillas: consolas expuestas, ficheros sensibles, configuraciones peligrosas y CVE',
      'Spring Boot, Tomcat, WildFly/JBoss, Jetty, Struts, Quarkus y su ecosistema',
      'DevOps y APIs: Jenkins, GitLab, Nexus, Keycloak, Swagger/OpenAPI, GraphQL',
      'Informe HTML a partir de los resultados JSONL',
    ],
  },
];

export interface Experience {
  role: string;
  org: string;
  place: string;
  period: string;
  points: string[];
}

export const experience: Experience[] = [
  {
    role: 'Auditor de ciberseguridad (prácticas)',
    org: 'DGH',
    place: 'Burgos',
    period: 'abr. 2026 – may. 2026',
    points: [
      'Auditorías de seguridad sobre aplicaciones web y entornos Active Directory.',
      'Plantillas de Nuclei a medida para el stack de la empresa e informes de hallazgos.',
    ],
  },
  { role: 'Operario de producción', org: 'Kataforesis', place: 'Burgos', period: 'verano 2025', points: [] },
  { role: 'Operario de producción', org: 'Grupo Antolín', place: 'Burgos', period: 'verano 2024', points: [] },
];

export const education = [
  { title: 'Grado en Ingeniería Informática', org: 'Universidad de Burgos (UBU)', period: 'sep. 2021 – sep. 2026' },
  { title: 'Bachillerato de Investigación/Excelencia (BIE)', org: 'IES Comuneros de Castilla, Burgos', period: '' },
];

export const certifications = [
  { name: 'eJPTv2', full: 'eLearnSecurity Junior Penetration Tester v2', issuer: 'INE Security' },
  { name: 'B2 First', full: 'Cambridge English B2 First (FCE)', issuer: 'Cambridge English' },
];

/**
 * Una herramienta del stack. Si tiene comandos en la biblia, su chip enlaza a ellos: se busca
 * sola por nombre (`'Nmap'` → commands/nmap.yaml); `bible` solo hace falta cuando el nombre no
 * coincide con el archivo (`{ name: 'Netcat', bible: 'nc' }`).
 */
export type StackItem = string | { name: string; bible: string };

/** Grupos de habilidades del CV y de la biblia; `color` es un token de global.css. */
export const skills: { area: string; color: ColorToken; items: StackItem[] }[] = [
  {
    area: 'Web',
    color: 'area-web',
    items: ['Burp Suite', 'OWASP ZAP', 'Nuclei', 'sqlmap', 'ffuf', 'Gobuster', 'feroxbuster', 'wfuzz', 'WhatWeb', 'Nikto'],
  },
  {
    area: 'Reconocimiento',
    color: 'area-recon',
    items: ['Nmap', 'RustScan', 'Masscan', 'arp-scan', 'netdiscover', 'dig', 'snmpwalk', 'Wireshark'],
  },
  { area: 'Explotación', color: 'area-msf', items: ['Metasploit', 'Meterpreter', 'msfvenom', 'searchsploit'] },
  {
    area: 'Active Directory',
    color: 'area-ad',
    items: ['BloodHound', 'Impacket', 'NetExec', 'Kerbrute', 'Responder', 'Evil-WinRM', 'Mimikatz', 'ldapsearch', 'rpcclient', 'smbclient', 'smbmap', 'enum4linux'],
  },
  { area: 'Cracking y fuerza bruta', color: 'area-crack', items: ['Hashcat', { name: 'John the Ripper', bible: 'john' }, 'Hydra'] },
  {
    area: 'Shells y pivoting',
    color: 'area-shell',
    items: [{ name: 'Netcat', bible: 'nc' }, 'SSH', { name: 'Webshells', bible: 'webshell' }, 'xfreerdp'],
  },
  {
    area: 'Servicios',
    color: 'area-wpe',
    items: [
      'MySQL',
      { name: 'PostgreSQL', bible: 'psql' },
      { name: 'MongoDB', bible: 'mongosh' },
      { name: 'Redis', bible: 'redis-cli' },
      'NFS',
      'rsync',
      'swaks',
    ],
  },
  { area: 'Scripting', color: 'tools', items: ['Bash', 'Python', 'PowerShell'] },
  { area: 'Entorno', color: 'muted', items: ['Kali Linux', 'Docker', 'Git', 'GitHub'] },
];

export const languages = [
  { name: 'Español', level: 'Nativo' },
  { name: 'Inglés', level: 'B2 · Cambridge First' },
  { name: 'Alemán', level: 'A2' },
];

export interface Social {
  label: string;
  href: string;
  icon: IconName;
}

export const socials: Social[] = [
  { label: 'GitHub', href: 'https://github.com/p3ix', icon: 'github' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/asier-lara-arroyo', icon: 'linkedin' },
  { label: 'Bugcrowd', href: 'https://bugcrowd.com/h/p3iv2', icon: 'bug' },
  { label: 'YesWeHack', href: 'https://yeswehack.com/hunters/p3i', icon: 'target' },
];
