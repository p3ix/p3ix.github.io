import type { ColorToken } from './tone';

/**
 * Vocabularios cerrados del contenido. Los ids son lo que se escribe en el frontmatter/YAML;
 * los schemas de content.config.ts los validan con z.enum().
 * `color` es un token de global.css; se pinta con `tone()` y las utilidades `tone-*`.
 */

// ---------- Áreas de la biblia (notas y comandos) ----------

export const AREA_IDS = [
  'recon',
  'web',
  'ad',
  'privesc-linux',
  'privesc-windows',
  'pivoting',
  'cracking',
  'shells',
  'metasploit',
  'otros',
] as const;
export type AreaId = (typeof AREA_IDS)[number];

export const areas: Record<AreaId, { label: string; color: ColorToken }> = {
  recon: { label: 'Recon', color: 'area-recon' },
  web: { label: 'Web', color: 'area-web' },
  ad: { label: 'Active Directory', color: 'area-ad' },
  'privesc-linux': { label: 'Privesc Linux', color: 'area-lpe' },
  'privesc-windows': { label: 'Privesc Windows', color: 'area-wpe' },
  pivoting: { label: 'Pivoting', color: 'area-pivot' },
  cracking: { label: 'Cracking', color: 'area-crack' },
  shells: { label: 'Shells', color: 'area-shell' },
  metasploit: { label: 'Metasploit', color: 'area-msf' },
  otros: { label: 'Otros', color: 'muted' },
};

// ---------- Fases de un ataque (comandos) ----------

export const PHASE_IDS = [
  'recon',
  'enum',
  'initial-access',
  'credential-access',
  'privesc',
  'lateral',
  'persistence',
  'exfil',
] as const;
export type PhaseId = (typeof PHASE_IDS)[number];

export const phases: Record<PhaseId, string> = {
  recon: 'Reconocimiento',
  enum: 'Enumeración',
  'initial-access': 'Acceso inicial',
  'credential-access': 'Obtención de credenciales',
  privesc: 'Escalada de privilegios',
  lateral: 'Movimiento lateral',
  persistence: 'Persistencia',
  exfil: 'Exfiltración',
};

/** Sistema desde el que se lanza un comando. */
export const LAUNCH_OS_IDS = ['linux', 'windows'] as const;

/**
 * Consola en la que se escribe un comando: decide el prompt de su tarjeta. En la shell, las
 * líneas siguientes continúan el mismo comando; en msfconsole y meterpreter cada línea es un
 * comando y lleva su propio prompt.
 */
export const PROMPT_IDS = ['shell', 'msf', 'meterpreter'] as const;
export type PromptId = (typeof PROMPT_IDS)[number];

export const prompts: Record<PromptId, { symbol: string; perLine: boolean }> = {
  shell: { symbol: '$', perLine: false },
  msf: { symbol: 'msf >', perLine: true },
  meterpreter: { symbol: 'meterpreter >', perLine: true },
};

// ---------- CTF ----------

export const CTF_PLATFORM_IDS = ['htb', 'thm', 'vulnhub', 'offsec-pg', 'ctf', 'otra'] as const;
export type CtfPlatformId = (typeof CTF_PLATFORM_IDS)[number];

export const ctfPlatforms: Record<CtfPlatformId, { label: string; short: string }> = {
  htb: { label: 'Hack The Box', short: 'HTB' },
  thm: { label: 'TryHackMe', short: 'THM' },
  vulnhub: { label: 'VulnHub', short: 'VulnHub' },
  'offsec-pg': { label: 'OffSec Proving Grounds', short: 'OffSec PG' },
  ctf: { label: 'Evento CTF', short: 'CTF' },
  otra: { label: 'Otra plataforma', short: 'Otra' },
};

/**
 * Plataformas donde solo se puede publicar contenido retirado (HTB y TryHackMe por sus ToS; un
 * evento CTF mientras sigue abierto). El schema de ctf rechaza `retired: false` para estas.
 */
export const RETIRED_ONLY_PLATFORMS: readonly CtfPlatformId[] = ['htb', 'thm', 'ctf'];

export const TARGET_OS_IDS = ['linux', 'windows', 'otro'] as const;
export type TargetOsId = (typeof TARGET_OS_IDS)[number];

export const targetOs: Record<TargetOsId, string> = {
  linux: 'Linux',
  windows: 'Windows',
  otro: 'Otro',
};

export const DIFFICULTY_IDS = ['easy', 'medium', 'hard', 'insane'] as const;
export type DifficultyId = (typeof DIFFICULTY_IDS)[number];

export const difficulties: Record<DifficultyId, { label: string; level: number; color: ColorToken }> = {
  easy: { label: 'Easy', level: 1, color: 'ctf' },
  medium: { label: 'Medium', level: 2, color: 'tags' },
  hard: { label: 'Hard', level: 3, color: 'warn' },
  insane: { label: 'Insane', level: 4, color: 'area-shell' },
};

// ---------- Bug bounty ----------

export const BB_PLATFORM_IDS = ['hackerone', 'bugcrowd', 'intigriti', 'yeswehack', 'grayback', 'vdp', 'otra'] as const;
export type BbPlatformId = (typeof BB_PLATFORM_IDS)[number];

export const bbPlatforms: Record<BbPlatformId, string> = {
  hackerone: 'HackerOne',
  bugcrowd: 'Bugcrowd',
  intigriti: 'Intigriti',
  yeswehack: 'YesWeHack',
  grayback: 'Grayback',
  vdp: 'VDP propio',
  otra: 'Otra plataforma',
};

export const SEVERITY_IDS = ['info', 'low', 'medium', 'high', 'critical'] as const;
export type SeverityId = (typeof SEVERITY_IDS)[number];

export const severities: Record<SeverityId, { label: string; color: ColorToken }> = {
  info: { label: 'Info', color: 'muted' },
  low: { label: 'Low', color: 'ctf' },
  medium: { label: 'Medium', color: 'tags' },
  high: { label: 'High', color: 'warn' },
  critical: { label: 'Critical', color: 'area-shell' },
};

export const BB_STATUS_IDS = ['accepted', 'resolved', 'disclosed', 'duplicate', 'informative'] as const;
export type BbStatusId = (typeof BB_STATUS_IDS)[number];

export const bbStatuses: Record<BbStatusId, string> = {
  accepted: 'Aceptado',
  resolved: 'Resuelto',
  disclosed: 'Divulgado',
  duplicate: 'Duplicado',
  informative: 'Informativo',
};
