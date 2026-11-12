// Tarjeta inclinada en 3D (.trophy-card de global.css): con ratón, y sin reducir movimiento, gira
// hacia el puntero y la luz (--mx/--my) lo sigue; sin ratón se queda en su inclinación de reposo.
const canTilt = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');

/** `x`/`y`: giro máximo en grados de punta a punta (vertical y horizontal). */
export function initTilt(stage: HTMLElement, card: HTMLElement, { x = 14, y = 20 } = {}) {
  stage.addEventListener('pointermove', (event) => {
    if (!canTilt.matches) return;
    const r = stage.getBoundingClientRect();
    const px = (event.clientX - r.left) / r.width;
    const py = (event.clientY - r.top) / r.height;
    card.classList.add('is-tracking');
    card.style.setProperty('--rx', `${((0.5 - py) * x).toFixed(2)}deg`);
    card.style.setProperty('--ry', `${((px - 0.5) * y).toFixed(2)}deg`);
    card.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
    card.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
  });
  stage.addEventListener('pointerleave', () => {
    card.classList.remove('is-tracking');
    for (const prop of ['--rx', '--ry', '--mx', '--my']) card.style.removeProperty(prop);
  });
}
