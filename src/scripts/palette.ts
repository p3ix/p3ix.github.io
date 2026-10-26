/**
 * Paleta global Ctrl+K (o /): busca comandos y páginas en /search.json con MiniSearch y, además,
 * en el texto completo de writeups y notas con Pagefind (índice generado en el build).
 * Enter copia el comando con las variables sustituidas o abre la página; Ctrl+Enter lleva
 * el comando a /biblia/comandos/. Todo se carga la primera vez que se abre.
 */
import type { SearchIndex } from '@/pages/search.json';
import { copyText, substitute } from './vars';

type CommandDoc = SearchIndex['commands'][number];
type PageDoc = SearchIndex['pages'][number];
type TextDoc = { url: string; title: string; excerpt: string; color: string };
type Result = { kind: 'command'; doc: CommandDoc } | { kind: 'page'; doc: PageDoc } | { kind: 'text'; doc: TextDoc };

interface Pagefind {
  options(options: { excerptLength?: number }): Promise<void>;
  init(): Promise<void>;
  debouncedSearch(
    term: string,
    options?: object,
    timeout?: number,
  ): Promise<{ results: { data(): Promise<{ url: string; excerpt: string; meta: { title?: string } }> }[] } | null>;
}

const MAX_TEXT = 4;

let pagefind: Promise<Pagefind | null> | undefined;

/** Pagefind solo existe tras `npm run build` (en dev, si hubo un build antes). Sin él, se sigue sin texto completo. */
function loadPagefind() {
  const url = '/pagefind/pagefind.js';
  return (pagefind ??= import(/* @vite-ignore */ url)
    .then(async (module: Pagefind) => {
      // Extractos cortos para que la coincidencia quepa en las dos líneas del resultado.
      await module.options({ excerptLength: 14 });
      await module.init();
      return module;
    })
    .catch(() => null));
}

const colorForUrl = (url: string) =>
  url.startsWith('/ctf/') ? 'ctf' : url.startsWith('/bugbounty/') ? 'bb' : url.startsWith('/biblia/') ? 'biblia' : 'brand';

/** Pagefind devuelve el extracto como HTML con <mark>; se reconstruye sin innerHTML. */
function excerptNodes(html: string) {
  const parsed = new DOMParser().parseFromString(`<p>${html}</p>`, 'text/html').body.firstChild;
  const nodes: Node[] = [];
  parsed?.childNodes.forEach((node) => {
    if (node.nodeName === 'MARK') {
      const mark = document.createElement('mark');
      mark.className = 'rounded-sm bg-brand/25 px-0.5 text-fg-strong';
      mark.textContent = node.textContent;
      nodes.push(mark);
    } else {
      nodes.push(document.createTextNode(node.textContent ?? ''));
    }
  });
  return nodes;
}

interface Engine {
  search(query: string): Result[];
  defaults: Result[];
}

const MAX_COMMANDS = 6;
const MAX_PAGES = 5;

let engine: Promise<Engine> | undefined;

async function loadEngine(): Promise<Engine> {
  const [{ default: MiniSearch }, data] = await Promise.all([
    import('minisearch'),
    fetch('/search.json').then((r) => {
      if (!r.ok) throw new Error(`search.json: ${r.status}`);
      return r.json() as Promise<SearchIndex>;
    }),
  ]);

  const options = {
    prefix: true,
    fuzzy: (term: string) => (term.length > 3 ? 0.2 : false),
    combineWith: 'AND' as const,
  };
  const commands = new MiniSearch<CommandDoc>({
    fields: ['title', 'tool', 'cmd', 'tags', 'area'],
    searchOptions: { ...options, boost: { title: 3, tool: 2, tags: 2 } },
  });
  commands.addAll(data.commands);
  const pages = new MiniSearch<PageDoc>({
    fields: ['title', 'summary', 'kind', 'tags'],
    searchOptions: { ...options, boost: { title: 3 } },
  });
  pages.addAll(data.pages);

  const commandById = new Map(data.commands.map((c) => [c.id, c]));
  const pageById = new Map(data.pages.map((p) => [p.id, p]));

  return {
    search(query) {
      const c = commands.search(query).slice(0, MAX_COMMANDS);
      const p = pages.search(query).slice(0, MAX_PAGES);
      return [
        ...c.map((r) => ({ kind: 'command' as const, doc: commandById.get(String(r.id))! })),
        ...p.map((r) => ({ kind: 'page' as const, doc: pageById.get(String(r.id))! })),
      ];
    },
    defaults: data.pages.filter((p) => p.kind === 'Sección').map((doc) => ({ kind: 'page' as const, doc })),
  };
}

const isEditable = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function initPalette() {
  const dialog = document.querySelector<HTMLDialogElement>('[data-palette]');
  const input = dialog?.querySelector<HTMLInputElement>('[data-palette-input]');
  const list = dialog?.querySelector<HTMLUListElement>('[data-palette-results]');
  const status = dialog?.querySelector<HTMLElement>('[data-palette-status]');
  const toast = document.querySelector<HTMLElement>('[data-toast]');
  if (!dialog || !input || !list || !status) return;

  let results: Result[] = [];
  let active = -1;
  let toastTimer: number | undefined;

  function showToast(text: string) {
    if (!toast) return;
    toast.textContent = text;
    toast.dataset.shown = '';
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => delete toast.dataset.shown, 1800);
  }

  function setActive(index: number) {
    active = index;
    list!.querySelectorAll<HTMLElement>('[role="option"]').forEach((option) => {
      const selected = Number(option.dataset.index) === index;
      option.setAttribute('aria-selected', String(selected));
      if (selected) option.scrollIntoView({ block: 'nearest' });
    });
    input!.setAttribute('aria-activedescendant', index >= 0 ? `palette-option-${index}` : '');
  }

  function render(query: string) {
    list!.replaceChildren();
    let lastKind = '';
    results.forEach((result, i) => {
      if (result.kind !== lastKind) {
        const label =
          result.kind === 'command' ? 'Comandos' : result.kind === 'text' ? 'En el texto' : query ? 'Páginas' : 'Ir a';
        const header = el('li', 'px-3 pt-3 pb-1 font-mono text-[11px] tracking-[0.18em] text-subtle uppercase', label);
        header.setAttribute('role', 'presentation');
        list!.append(header);
        lastKind = result.kind;
      }

      const option = el('li', 'flex cursor-pointer flex-col gap-1 rounded-xl border border-transparent px-3 py-2.5 aria-selected:tone-border aria-selected:tone-faint');
      option.id = `palette-option-${i}`;
      option.dataset.index = String(i);
      option.setAttribute('role', 'option');
      option.style.setProperty('--tone', `var(--color-${result.doc.color})`);

      if (result.kind === 'command') {
        const head = el('div', 'flex items-center gap-2.5');
        head.append(
          el('span', 'tone-pill size-2 shrink-0 rounded-full'),
          el('span', 'min-w-0 flex-1 truncate font-semibold text-fg-strong', result.doc.title),
          el('span', 'shrink-0 font-mono text-xs text-subtle', result.doc.tool),
        );
        option.append(head, el('code', 'truncate pl-4.5 font-mono text-xs text-muted', substitute(result.doc.cmd)));
      } else if (result.kind === 'text') {
        const excerpt = el('span', 'line-clamp-2 text-sm text-muted');
        excerpt.append(...excerptNodes(result.doc.excerpt));
        option.append(el('span', 'tone-text font-semibold', result.doc.title), excerpt);
      } else {
        option.append(
          el('span', 'tone-text font-mono text-[11px] tracking-[0.14em] uppercase', result.doc.kind),
          el('span', 'font-semibold text-fg-strong', result.doc.title),
          el('span', 'truncate text-sm text-muted', result.doc.summary),
        );
      }

      option.addEventListener('mousemove', () => active !== i && setActive(i));
      option.addEventListener('click', (event) => run(i, event.ctrlKey || event.metaKey));
      list!.append(option);
    });

    status!.hidden = results.length > 0;
    if (!results.length) status!.textContent = `Nada coincide con «${query}».`;
    setActive(results.length ? 0 : -1);
  }

  async function update() {
    const query = input!.value.trim();
    try {
      const e = await (engine ??= loadEngine());
      if (query !== input!.value.trim()) return; // llegó otra pulsación mientras cargaba
      results = query ? e.search(query) : e.defaults;
      render(query);
      if (query) void addFullText(query);
    } catch {
      engine = undefined;
      list!.replaceChildren();
      status!.hidden = false;
      status!.textContent = 'No se pudo cargar el índice de búsqueda.';
    }
  }

  /** Añade debajo los resultados de Pagefind que no estén ya entre las páginas. */
  async function addFullText(query: string) {
    const pf = await loadPagefind();
    const search = await pf?.debouncedSearch(query, {}, 150);
    if (!search || query !== input!.value.trim()) return;
    const data = await Promise.all(search.results.slice(0, MAX_TEXT + 3).map((r) => r.data()));
    if (query !== input!.value.trim()) return;
    const shown = new Set(results.flatMap((r) => (r.kind === 'page' ? [r.doc.url] : [])));
    const text = data
      .filter((d) => !shown.has(d.url))
      .slice(0, MAX_TEXT)
      .map((d) => ({
        kind: 'text' as const,
        doc: { url: d.url, title: d.meta.title ?? d.url, excerpt: d.excerpt, color: colorForUrl(d.url) },
      }));
    if (!text.length) return;
    const previous = active;
    results = [...results.filter((r) => r.kind !== 'text'), ...text];
    render(query);
    if (previous > 0) setActive(previous);
  }

  async function run(index: number, openInBible = false) {
    const result = results[index];
    if (!result) return;
    if (result.kind === 'page' || result.kind === 'text') {
      window.location.href = result.doc.url;
      return;
    }
    if (openInBible) {
      window.location.href = `/biblia/comandos/#${result.doc.id}`;
      return;
    }
    const ok = await copyText(substitute(result.doc.cmd));
    dialog!.close();
    showToast(ok ? `Copiado: ${result.doc.title}` : 'No se pudo copiar al portapapeles');
  }

  function open() {
    if (dialog!.open) return;
    input!.value = '';
    dialog!.showModal();
    input!.focus();
    void loadPagefind(); // se precarga mientras se escribe
    if (!engine) {
      status!.hidden = false;
      status!.textContent = 'Cargando…';
    }
    void update();
  }

  input.addEventListener('input', () => void update());
  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!results.length) return;
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((active + step + results.length) % results.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      void run(active, event.ctrlKey || event.metaKey);
    }
  });

  // Clic en el fondo (fuera del cuadro) cierra.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  document.querySelectorAll('[data-search-trigger]').forEach((trigger) => trigger.addEventListener('click', open));

  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (dialog.open) dialog.close();
      else open();
    } else if (event.key === '/' && !dialog.open && !isEditable(event.target)) {
      event.preventDefault();
      open();
    }
  });
}
