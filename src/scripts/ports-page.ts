/**
 * Filtro y búsqueda de /biblia/puertos/. Las filas ya vienen en el HTML (funcionan sin JS); aquí
 * solo se ocultan y, con una fase elegida, cada fila cambia su resumen por lo que toca en esa fase.
 */
type FilterKey = 'category' | 'phase';

export function initPortsPage() {
  const app = document.querySelector<HTMLElement>('[data-ports-app]');
  if (!app) return;

  const rows = [...app.querySelectorAll<HTMLElement>('[data-port]')];
  const input = app.querySelector<HTMLInputElement>('[data-ports-query]');
  const count = app.querySelector<HTMLElement>('[data-ports-count]');
  const empty = app.querySelector<HTMLElement>('[data-ports-empty]');
  const hint = app.querySelector<HTMLElement>('[data-phase-hint]');

  const state: Record<FilterKey, string> & { q: string } = { q: '', category: 'all', phase: 'all' };
  // Sin acentos ni mayúsculas: "enumeracion" encuentra "enumeración".
  const normalize = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  const haystacks = new Map(rows.map((row) => [row, normalize(row.dataset.search ?? '')]));

  function update() {
    const terms = normalize(state.q).split(/\s+/).filter(Boolean);
    let visible = 0;

    for (const row of rows) {
      const text = haystacks.get(row) ?? '';
      const phases = (row.dataset.phases ?? '').split(' ');
      const matches =
        terms.every((t) => text.includes(t)) &&
        (state.category === 'all' || row.dataset.category === state.category) &&
        (state.phase === 'all' || phases.includes(state.phase));
      row.hidden = !matches;
      if (matches) visible++;

      const phaseText = row.querySelector<HTMLElement>(`[data-phase-text="${state.phase}"]`);
      row.querySelectorAll<HTMLElement>('[data-phase-text]').forEach((el) => (el.hidden = el !== phaseText));
      const summary = row.querySelector<HTMLElement>('[data-summary]');
      if (summary) summary.hidden = Boolean(phaseText);
      row.querySelectorAll<HTMLElement>('[data-cell]').forEach((cell) => {
        cell.classList.toggle('ring-1', cell.dataset.cell === state.phase);
        cell.classList.toggle('ring-current', cell.dataset.cell === state.phase);
      });
    }

    if (count) count.textContent = visible === rows.length ? `${rows.length} servicios` : `${visible} de ${rows.length} servicios`;
    if (empty) empty.hidden = visible > 0;
    if (hint) hint.hidden = state.phase !== 'all';
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

  // /biblia/puertos/?q=445 llega ya filtrado.
  const initial = new URLSearchParams(window.location.search).get('q');
  if (initial && input) {
    input.value = initial;
    state.q = initial;
    update();
  }
}
