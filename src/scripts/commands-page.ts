/**
 * Filtro y búsqueda de /biblia/comandos/. Las tarjetas ya vienen renderizadas en el HTML
 * (funcionan sin JS); aquí solo se ocultan, se reordenan por relevancia y se cuentan.
 */
import MiniSearch from 'minisearch';

type FilterKey = 'area' | 'phase' | 'os';

export function initCommandsPage() {
  const app = document.querySelector<HTMLElement>('[data-commands-app]');
  if (!app) return;

  const cards = [...app.querySelectorAll<HTMLElement>('[data-command]')];
  const input = app.querySelector<HTMLInputElement>('[data-commands-query]');
  const count = app.querySelector<HTMLElement>('[data-commands-count]');
  const empty = app.querySelector<HTMLElement>('[data-commands-empty]');

  const search = new MiniSearch({
    fields: ['title', 'tool', 'text'],
    searchOptions: {
      prefix: true,
      fuzzy: (term) => (term.length > 3 ? 0.2 : false),
      boost: { title: 3, tool: 2 },
      combineWith: 'AND',
    },
  });
  search.addAll(
    cards.map((card) => ({
      id: card.dataset.command,
      title: card.dataset.title ?? '',
      tool: card.dataset.tool ?? '',
      text: card.textContent ?? '',
    })),
  );

  const state: Record<FilterKey, string> & { q: string } = { q: '', area: 'all', phase: 'all', os: 'all' };

  function update() {
    const query = state.q.trim();
    const ranking = query ? new Map(search.search(query).map((r, i) => [String(r.id), i])) : null;
    let visible = 0;

    for (const card of cards) {
      const id = card.dataset.command ?? '';
      const matches =
        (!ranking || ranking.has(id)) &&
        (state.area === 'all' || card.dataset.area === state.area) &&
        (state.phase === 'all' || card.dataset.phase === state.phase) &&
        (state.os === 'all' || (card.dataset.os ?? '').split(' ').includes(state.os));
      card.hidden = !matches;
      // Con búsqueda, lo más relevante arriba; sin búsqueda, el orden original.
      card.style.order = ranking ? String(ranking.get(id) ?? 0) : '';
      if (matches) visible++;
    }

    if (count) count.textContent = visible === cards.length ? `${cards.length} comandos` : `${visible} de ${cards.length} comandos`;
    if (empty) empty.hidden = visible > 0;
  }

  input?.addEventListener('input', () => {
    state.q = input.value;
    update();
  });

  app.addEventListener('click', (event) => {
    const button = (event.target as Element | null)?.closest<HTMLButtonElement>('[data-filter]');
    if (!button) return;
    const key = button.dataset.filter as FilterKey;
    state[key] = button.dataset.value ?? 'all';
    app.querySelectorAll<HTMLButtonElement>(`[data-filter="${key}"]`).forEach((b) => {
      b.setAttribute('aria-pressed', String(b === button));
    });
    update();
  });

  // /biblia/comandos/?q=kerberos llega ya filtrado.
  const initial = new URLSearchParams(window.location.search).get('q');
  if (initial && input) {
    input.value = initial;
    state.q = initial;
  }
  update();
}
