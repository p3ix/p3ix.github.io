import type { ColorToken } from './tone';

/**
 * Variables que se pueden usar en los comandos como {{NOMBRE}}. El schema de `commands` rechaza
 * cualquier otra, así un typo ({{RHSOT}}) rompe el build en vez de llegar a la web.
 * `example` es el valor por defecto de la barra de variables.
 */
export const VARIABLE_NAMES = [
  'RHOST',
  'DC_IP',
  'LHOST',
  'LPORT',
  'DOMAIN',
  'USER',
  'PASS',
  'HASH',
  'URL',
  'WORDLIST',
] as const;
export type VariableName = (typeof VARIABLE_NAMES)[number];

export const variables: Record<VariableName, { description: string; example: string; color: ColorToken }> = {
  RHOST: { description: 'IP o host objetivo', example: '10.10.11.42', color: 'var-rhost' },
  DC_IP: { description: 'IP del controlador de dominio', example: '10.10.11.42', color: 'var-dcip' },
  LHOST: { description: 'Tu IP (VPN/tun0)', example: '10.10.14.7', color: 'var-lhost' },
  LPORT: { description: 'Tu puerto a la escucha', example: '4444', color: 'var-lport' },
  DOMAIN: { description: 'Dominio de Active Directory', example: 'corp.local', color: 'var-domain' },
  USER: { description: 'Usuario', example: 'svc_sql', color: 'var-user' },
  PASS: { description: 'Contraseña', example: 'Octubre2026!', color: 'var-pass' },
  HASH: { description: 'Hash NT', example: 'aad3b435b51404eeaad3b435b51404ee', color: 'var-hash' },
  URL: { description: 'URL objetivo', example: 'http://10.10.11.42', color: 'var-url' },
  WORDLIST: {
    description: 'Diccionario',
    example: '/usr/share/wordlists/rockyou.txt',
    color: 'var-wordlist',
  },
};

/** Encuentra {{NOMBRE}} en un comando. Con flag g: usa matchAll o reinicia lastIndex. */
export const VARIABLE_PATTERN = /\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g;

export const isVariableName = (name: string): name is VariableName =>
  (VARIABLE_NAMES as readonly string[]).includes(name);
