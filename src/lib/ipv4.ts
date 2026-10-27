import type { ColorToken } from './tone';

/**
 * Cálculo de subredes IPv4 para la calculadora (SubnetCalc.astro). Funciones puras: se usan en el
 * build para pintar el ejemplo inicial y en el navegador al escribir.
 * Las direcciones son enteros sin signo de 32 bits; `>>> 0` los mantiene sin signo tras cada operación.
 */

export interface Subnet {
  /** La IP tal como se escribió (puede ser un host dentro de la red). */
  ip: number;
  prefix: number;
  mask: number;
  wildcard: number;
  network: number;
  broadcast: number;
  /** Primer y último host utilizables. En /31 y /32 coinciden con la red y el broadcast. */
  first: number;
  last: number;
  /** Direcciones del bloque y hosts utilizables. */
  total: number;
  usable: number;
}

export interface RangeKind {
  label: string;
  /** Qué te dice ese rango durante una auditoría. */
  hint: string;
  color: ColorToken;
}

const OCTET = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;

export function parseIp(text: string): number | null {
  const parts = text.trim().split('.');
  if (parts.length !== 4 || !parts.every((p) => OCTET.test(p))) return null;
  return parts.reduce((acc, p) => ((acc << 8) | Number(p)) >>> 0, 0);
}

export const formatIp = (n: number) => [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');

export const prefixToMask = (prefix: number) => (prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0);

/** Máscara en decimal → prefijo. null si los unos no son contiguos (255.0.255.0). */
export function maskToPrefix(mask: number): number | null {
  const inverted = ~mask >>> 0;
  if ((inverted & (inverted + 1)) !== 0) return null;
  return 32 - Math.log2(inverted + 1);
}

export function describe(ip: number, prefix: number): Subnet {
  const mask = prefixToMask(prefix);
  const wildcard = ~mask >>> 0;
  const network = (ip & mask) >>> 0;
  const broadcast = (network | wildcard) >>> 0;
  const total = 2 ** (32 - prefix);
  const pointToPoint = prefix >= 31;
  return {
    ip,
    prefix,
    mask,
    wildcard,
    network,
    broadcast,
    first: pointToPoint ? network : network + 1,
    last: pointToPoint ? broadcast : broadcast - 1,
    total,
    // /31: enlace punto a punto con dos hosts (RFC 3021). /32: un solo host.
    usable: pointToPoint ? total : total - 2,
  };
}

/**
 * Lee lo que escribe el usuario: `10.10.14.7/23`, `10.10.14.7/255.255.254.0`,
 * `10.10.14.7 255.255.254.0` o con wildcard (`10.10.14.7 0.0.1.255`).
 */
export function parseSubnet(input: string): Subnet | { error: string } {
  const text = input.trim();
  if (!text) return { error: 'Escribe una IP con su máscara: 10.10.14.7/23' };

  const [ipText, maskText, ...rest] = text.split(/\s*\/\s*|\s+/);
  const ip = parseIp(ipText);
  if (ip === null) return { error: `«${ipText}» no es una IPv4 válida.` };
  if (maskText === undefined) return { error: 'Falta la máscara: añade /24 o 255.255.255.0' };
  if (rest.length > 0) return { error: 'Sobra texto: escribe solo la IP y la máscara.' };

  if (/^\d{1,2}$/.test(maskText)) {
    const prefix = Number(maskText);
    if (prefix > 32) return { error: 'El prefijo va de /0 a /32.' };
    return describe(ip, prefix);
  }

  const mask = parseIp(maskText);
  if (mask === null) return { error: `«${maskText}» no es una máscara: usa /24 o 255.255.255.0` };
  // Si no es una máscara, puede ser una wildcard (0.0.1.255): invertida es la máscara. 0.0.0.0 cuenta como /0.
  const prefix = maskToPrefix(mask) ?? maskToPrefix(~mask >>> 0);
  if (prefix === null) return { error: 'Máscara no válida: los bits a 1 tienen que ir seguidos (255.255.254.0).' };
  return describe(ip, prefix);
}

export const contains = (subnet: Subnet, ip: number) => ((ip & subnet.mask) >>> 0) === subnet.network;

/** Las subredes /newPrefix (mayor que el de `subnet`) que caben en `subnet`, hasta `limit`. */
export function split(subnet: Subnet, newPrefix: number, limit = 64): { subnets: Subnet[]; count: number } {
  const count = 2 ** (newPrefix - subnet.prefix);
  const size = 2 ** (32 - newPrefix);
  const subnets = Array.from({ length: Math.min(count, limit) }, (_, i) => describe(subnet.network + i * size, newPrefix));
  return { subnets, count };
}

export const toBinary = (n: number) => n.toString(2).padStart(32, '0');

export const toHex = (n: number) => `0x${n.toString(16).padStart(8, '0').toUpperCase()}`;

/** Clase histórica (antes de CIDR). Solo como referencia: hoy las redes no se reparten por clases. */
export function ipClass(ip: number) {
  const first = ip >>> 24;
  if (first < 128) return 'A';
  if (first < 192) return 'B';
  if (first < 224) return 'C';
  if (first < 240) return 'D';
  return 'E';
}

const SPECIAL_RANGES: { network: string; prefix: number; kind: RangeKind }[] = [
  { network: '0.0.0.0', prefix: 8, kind: { label: 'Esta red', hint: 'No es un destino: 0.0.0.0 en un servicio significa que escucha en todas las interfaces.', color: 'muted' } },
  { network: '10.0.0.0', prefix: 8, kind: { label: 'Privada · RFC 1918', hint: 'Red interna: no se enruta en internet.', color: 'ctf' } },
  { network: '100.64.0.0', prefix: 10, kind: { label: 'CGNAT · RFC 6598', hint: 'NAT del operador; también la usan algunas VPN de malla.', color: 'tags' } },
  { network: '127.0.0.0', prefix: 8, kind: { label: 'Loopback', hint: 'Solo la propia máquina: un servicio aquí no se ve desde fuera.', color: 'muted' } },
  { network: '169.254.0.0', prefix: 16, kind: { label: 'Link-local · APIPA', hint: 'El equipo no consiguió IP por DHCP y se asignó una a sí mismo.', color: 'warn' } },
  { network: '172.16.0.0', prefix: 12, kind: { label: 'Privada · RFC 1918', hint: 'Red interna: de 172.16.0.0 a 172.31.255.255.', color: 'ctf' } },
  { network: '192.0.2.0', prefix: 24, kind: { label: 'Documentación · RFC 5737', hint: 'Reservada para ejemplos: úsala al redactar.', color: 'whoami' } },
  { network: '192.168.0.0', prefix: 16, kind: { label: 'Privada · RFC 1918', hint: 'Red interna: no se enruta en internet.', color: 'ctf' } },
  { network: '198.18.0.0', prefix: 15, kind: { label: 'Pruebas de rendimiento', hint: 'Reservada para benchmarks de red (RFC 2544).', color: 'muted' } },
  { network: '198.51.100.0', prefix: 24, kind: { label: 'Documentación · RFC 5737', hint: 'Reservada para ejemplos: úsala al redactar.', color: 'whoami' } },
  { network: '203.0.113.0', prefix: 24, kind: { label: 'Documentación · RFC 5737', hint: 'Reservada para ejemplos: úsala al redactar.', color: 'whoami' } },
  { network: '224.0.0.0', prefix: 4, kind: { label: 'Multicast', hint: 'Grupos, no hosts: no tiene sentido escanearla.', color: 'biblia' } },
  { network: '240.0.0.0', prefix: 4, kind: { label: 'Reservada', hint: 'Sin uso en internet; 255.255.255.255 es el broadcast limitado.', color: 'muted' } },
];

const PUBLIC: RangeKind = {
  label: 'Pública',
  hint: 'Enrutable en internet: escanéala solo si está dentro del alcance autorizado.',
  color: 'area-shell',
};

const RANGES = SPECIAL_RANGES.map((r) => ({ subnet: describe(parseIp(r.network) ?? 0, r.prefix), kind: r.kind }));

export function rangeKind(ip: number): RangeKind {
  return RANGES.find((r) => contains(r.subnet, ip))?.kind ?? PUBLIC;
}

/** 16777214 → "16 777 214", con espacios que no parten la cifra. */
export const formatCount = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

const hosts = (n: number) => `${formatCount(n)} ${n === 1 ? 'host' : 'hosts'}`;

/** Los textos que pinta la calculadora, iguales en el build y en el navegador. */
export function summary(s: Subnet) {
  const network = `${formatIp(s.network)}/${s.prefix}`;
  return {
    network,
    broadcast: formatIp(s.broadcast),
    first: formatIp(s.first),
    last: formatIp(s.last),
    usable: formatCount(s.usable),
    mask: formatIp(s.mask),
    wildcard: formatIp(s.wildcard),
    hex: toHex(s.mask),
    netBits: String(s.prefix),
    hostBits: String(32 - s.prefix),
    class: `Clase ${ipClass(s.ip)} (histórica)`,
    line: `${network} · ${hosts(s.usable)} ${s.usable === 1 ? 'útil' : 'útiles'}`,
    nmap: `nmap -sn ${network}`,
  };
}
export type SummaryKey = keyof ReturnType<typeof summary>;

/**
 * Bits separados por octetos y partidos donde acaba el prefijo: [bits de red, bits de host].
 * /23 → ['00001010.00001010.0000111', '0.00000111'].
 */
export function binaryParts(n: number, prefix: number): [string, string] {
  const dotted = toBinary(n).replace(/(.{8})(?=.)/g, '$1.');
  const cut = prefix === 0 ? 0 : prefix + Math.floor((prefix - 1) / 8);
  return [dotted.slice(0, cut), dotted.slice(cut)];
}

/** Opciones de "Dividir en subredes": todos los prefijos más largos que el de la red. */
export const splitOptions = (s: Subnet) =>
  Array.from({ length: 32 - s.prefix }, (_, i) => {
    const prefix = s.prefix + i + 1;
    const count = 2 ** (prefix - s.prefix);
    return { prefix, label: `/${prefix} → ${formatCount(count)} × ${hosts(describe(0, prefix).usable)}` };
  });

/** Dónde cae una IP respecto a la red: fuera, en la dirección de red, en el broadcast o en un host. */
export function position(s: Subnet, ip: number): 'out' | 'network' | 'broadcast' | 'host' {
  if (!contains(s, ip)) return 'out';
  if (s.prefix < 31 && ip === s.network) return 'network';
  if (s.prefix < 31 && ip === s.broadcast) return 'broadcast';
  return 'host';
}
