/**
 * Calculadora de subredes (SubnetCalc.astro). Recalcula al escribir, rellena "Dividir en subredes"
 * y "¿Está esta IP dentro?", copia el `nmap -sn` de la red y la guarda en la variable {{SUBNET}}.
 * Las cuentas están en src/lib/ipv4.ts, las mismas con las que el build pinta el ejemplo inicial.
 */
import {
  binaryParts,
  formatIp,
  parseIp,
  parseSubnet,
  position,
  rangeKind,
  split,
  splitOptions,
  summary,
  type Subnet,
  type SummaryKey,
} from '@/lib/ipv4';
import { copyText, loadValues, setValue } from './vars';

const SPLIT_LIMIT = 64;

const CONTAINS_TEXT: Record<ReturnType<typeof position>, (net: string) => string> = {
  host: (net) => `Sí: es un host de ${net}.`,
  network: (net) => `Es la dirección de ${net}: identifica la red, no es un host.`,
  broadcast: (net) => `Es el broadcast de ${net}: llega a todos los hosts, no es uno de ellos.`,
  out: (net) => `No: está fuera de ${net}.`,
};

function setup(root: HTMLElement) {
  const q = <T extends HTMLElement>(selector: string) => root.querySelector<T>(selector);
  const input = q<HTMLInputElement>('[data-subnet-input]');
  const status = q('[data-subnet-status]');
  const result = q('[data-subnet-result]');
  const kindBox = q('[data-subnet-kind]');
  const kindLabel = q('[data-subnet-kind-label]');
  const kindHint = q('[data-subnet-kind-hint]');
  const useButton = q<HTMLButtonElement>('[data-subnet-use]');
  const copyButton = q<HTMLButtonElement>('[data-subnet-copy]');
  const containsInput = q<HTMLInputElement>('[data-subnet-contains]');
  const containsResult = q('[data-subnet-contains-result]');
  const splitSelect = q<HTMLSelectElement>('[data-subnet-split]');
  const splitList = q('[data-subnet-split-list]');
  const splitMore = q('[data-subnet-split-more]');
  if (!input || !status || !result || !splitSelect || !splitList || !splitMore || !containsInput || !containsResult) return;

  let current: Subnet | null = null;

  const renderContains = () => {
    const text = containsInput.value.trim();
    const ip = parseIp(text);
    if (!current || !text) {
      delete containsResult.dataset.state;
      containsResult.textContent = 'Escribe una IP para comprobarlo.';
    } else if (ip === null) {
      delete containsResult.dataset.state;
      containsResult.textContent = `«${text}» todavía no es una IPv4.`;
    } else {
      const where = position(current, ip);
      containsResult.dataset.state = where;
      containsResult.textContent = CONTAINS_TEXT[where](summary(current).network);
    }
  };

  const renderSplit = () => {
    const prefix = Number(splitSelect.value);
    splitList.replaceChildren();
    if (!current || !splitSelect.value || prefix <= current.prefix) {
      splitList.classList.replace('flex', 'hidden');
      splitMore.classList.add('hidden');
      return;
    }
    const { subnets, count } = split(current, prefix, SPLIT_LIMIT);
    for (const s of subnets) {
      const row = document.createElement('div');
      row.setAttribute('role', 'listitem');
      row.className = 'flex flex-wrap justify-between gap-x-4 px-3 py-1.5 font-mono text-[13px] odd:bg-white/2';
      const net = document.createElement('span');
      net.className = 'font-semibold text-area-recon';
      net.textContent = `${formatIp(s.network)}/${s.prefix}`;
      const range = document.createElement('span');
      range.className = 'text-subtle';
      range.textContent = s.first === s.last ? formatIp(s.first) : `${formatIp(s.first)} – ${formatIp(s.last)}`;
      row.append(net, range);
      splitList.append(row);
    }
    splitList.classList.replace('hidden', 'flex');
    splitMore.classList.toggle('hidden', count <= SPLIT_LIMIT);
    splitMore.textContent = `Y ${count - SPLIT_LIMIT} más: con un prefijo más corto salen menos.`;
  };

  const render = (s: Subnet) => {
    const out = summary(s);
    root.querySelectorAll<HTMLElement>('[data-out]').forEach((el) => {
      el.textContent = out[el.dataset.out as SummaryKey] ?? '';
    });
    status.textContent = out.line;

    const kind = rangeKind(s.ip);
    kindBox?.style.setProperty('--tone', `var(--color-${kind.color})`);
    if (kindLabel) kindLabel.textContent = kind.label;
    if (kindHint) kindHint.textContent = kind.hint;

    const values: Record<string, number> = { ip: s.ip, mask: s.mask, network: s.network, broadcast: s.broadcast };
    root.querySelectorAll<HTMLElement>('[data-bin]').forEach((row) => {
      const [net, host] = binaryParts(values[row.dataset.bin ?? ''] ?? 0, s.prefix);
      const netEl = row.querySelector('[data-bin-net]');
      const hostEl = row.querySelector('[data-bin-host]');
      if (netEl) netEl.textContent = net;
      if (hostEl) hostEl.textContent = host;
    });

    // Al cambiar de red se rehacen los prefijos; se mantiene el elegido si sigue valiendo.
    const chosen = splitSelect.value;
    const options = splitOptions(s).map((o) => new Option(o.label, String(o.prefix)));
    splitSelect.replaceChildren(new Option('Elige un prefijo', ''), ...options);
    splitSelect.value = options.some((o) => o.value === chosen) ? chosen : '';

    renderSplit();
    renderContains();
  };

  const update = () => {
    const parsed = parseSubnet(input.value);
    if ('error' in parsed) {
      status.textContent = parsed.error;
      status.dataset.invalid = '';
      input.setAttribute('aria-invalid', 'true');
      result.dataset.stale = '';
      return;
    }
    delete status.dataset.invalid;
    delete result.dataset.stale;
    input.removeAttribute('aria-invalid');
    current = parsed;
    render(parsed);
  };

  input.addEventListener('input', update);
  containsInput.addEventListener('input', renderContains);
  splitSelect.addEventListener('change', renderSplit);

  useButton?.addEventListener('click', () => {
    if (!current) return;
    setValue('SUBNET', summary(current).network);
    useButton.dataset.saved = '';
    window.setTimeout(() => delete useButton.dataset.saved, 1600);
  });

  copyButton?.addEventListener('click', async () => {
    if (!current) return;
    const ok = await copyText(summary(current).nmap);
    copyButton.dataset.copied = ok ? 'ok' : 'error';
    window.setTimeout(() => delete copyButton.dataset.copied, 1600);
  });

  // Si ya hay una red guardada en {{SUBNET}}, se empieza por ella.
  const saved = loadValues().SUBNET?.trim();
  if (saved && !('error' in parseSubnet(saved))) input.value = saved;
  update();
}

export function initSubnetCalcs() {
  document.querySelectorAll<HTMLElement>('[data-subnet-calc]').forEach(setup);
}
