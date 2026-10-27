/**
 * Variables de la biblia en el navegador: guarda los valores de la barra de variables en
 * localStorage, los sustituye en la página y prepara lo que se copia.
 *
 * Marcado que entiende:
 * - `[data-var="RHOST"]`: chip que muestra el valor (o el nombre si está vacío).
 * - `[data-copy-template]`: botón que copia su plantilla con las variables sustituidas.
 * - `[data-var-input="RHOST"]`: input de la barra de variables. `[data-vars-reset]` las borra.
 * - Bloques de Expressive Code con {{X}}: se convierten en chips y su botón de copiar se actualiza.
 */
import { VARIABLE_NAMES, isVariableName, variables, type VariableName } from '@/lib/variables';

type Values = Partial<Record<string, string>>;

const STORAGE_KEY = 'p3i:vars';
const CHANGE_EVENT = 'p3i:vars-change';
const PATTERN = /\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g;

export function loadValues(): Values {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    if (parsed && typeof parsed === 'object') return parsed as Values;
  } catch {
    // Almacenamiento bloqueado o JSON roto: se trabaja sin valores guardados.
  }
  return {};
}

function saveValues(values: Values) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
  } catch {
    // Sin almacenamiento (modo privado estricto): los valores duran lo que la página.
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

/** Fija una variable desde otro componente (la calculadora de subredes guarda {{SUBNET}}). */
export function setValue(name: VariableName, value: string) {
  saveValues({ ...loadValues(), [name]: value });
}

/** Sustituye {{X}} por su valor; las variables vacías se quedan como {{X}}. */
export function substitute(template: string, values: Values = loadValues()) {
  return template.replace(PATTERN, (whole, name: string) => values[name]?.trim() || whole);
}

const colorFor = (name: string) => (isVariableName(name) ? variables[name].color : 'muted');

function makeChip(name: string) {
  const chip = document.createElement('span');
  chip.className = 'var-chip';
  chip.dataset.var = name;
  chip.style.setProperty('--tone', `var(--color-${colorFor(name)})`);
  chip.textContent = name;
  return chip;
}

/** Convierte los {{X}} de los bloques de Expressive Code en chips (una sola vez por bloque). */
function markupCodeBlocks(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('.expressive-code pre:not([data-vars-ready])').forEach((pre) => {
    pre.dataset.varsReady = '';
    const walker = document.createTreeWalker(pre, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      if (node.data.includes('{{')) nodes.push(node);
    }
    for (const node of nodes) {
      const fragment = document.createDocumentFragment();
      let last = 0;
      for (const match of node.data.matchAll(PATTERN)) {
        const index = match.index ?? 0;
        if (index > last) fragment.append(node.data.slice(last, index));
        fragment.append(makeChip(match[1]));
        last = index + match[0].length;
      }
      if (last === 0) continue;
      fragment.append(node.data.slice(last));
      node.replaceWith(fragment);
    }
  });
}

/** Pinta los valores actuales en chips, inputs y botones de copiar. */
export function applyValues(root: ParentNode = document) {
  const values = loadValues();

  root.querySelectorAll<HTMLElement>('[data-var]').forEach((chip) => {
    const name = chip.dataset.var ?? '';
    const value = values[name]?.trim();
    chip.textContent = value || name;
    chip.classList.toggle('is-set', Boolean(value));
    chip.title = value ? `${name} = ${value}` : `${name}: rellénalo en la barra de variables`;
  });

  root.querySelectorAll<HTMLInputElement>('[data-var-input]').forEach((input) => {
    const value = values[input.dataset.varInput ?? ''] ?? '';
    if (document.activeElement !== input && input.value !== value) input.value = value;
  });

  // El botón de copiar de Expressive Code lee data-code al hacer clic.
  root.querySelectorAll<HTMLButtonElement>('.expressive-code button[data-code]').forEach((button) => {
    button.dataset.codeTemplate ??= button.dataset.code ?? '';
    button.dataset.code = substitute(button.dataset.codeTemplate, values);
  });
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function bindCopyButtons() {
  document.addEventListener('click', async (event) => {
    const button = (event.target as Element | null)?.closest<HTMLButtonElement>('[data-copy-template]');
    if (!button) return;
    const ok = await copyText(substitute(button.dataset.copyTemplate ?? ''));
    button.dataset.copied = ok ? 'ok' : 'error';
    button.setAttribute('aria-label', ok ? 'Copiado' : 'No se pudo copiar');
    window.setTimeout(() => {
      delete button.dataset.copied;
      button.setAttribute('aria-label', 'Copiar comando');
    }, 1600);
  });
}

function bindInputs() {
  document.addEventListener('input', (event) => {
    const input = event.target as HTMLInputElement;
    const name = input.dataset?.varInput;
    if (!name) return;
    saveValues({ ...loadValues(), [name]: input.value });
  });

  document.addEventListener('click', (event) => {
    if (!(event.target as Element | null)?.closest('[data-vars-reset]')) return;
    const values = loadValues();
    for (const name of VARIABLE_NAMES) delete values[name];
    saveValues(values);
  });
}

export { copyText };

export function initVars() {
  markupCodeBlocks(document);
  applyValues();
  bindCopyButtons();
  bindInputs();
  window.addEventListener(CHANGE_EVENT, () => applyValues());
  // Otra pestaña cambió los valores.
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) applyValues();
  });
}
