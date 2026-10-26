/**
 * Imágenes Open Graph (1200×630) generadas en el build con Satori (layout → SVG) y resvg (SVG → PNG).
 * Diseño: ventana de terminal de la dirección A2 con el color de la sección o del área.
 * Solo se ejecuta en Node durante `astro build` / `astro dev`, nunca en el navegador.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Resvg, initWasm } from '@resvg/resvg-wasm';
import satori from 'satori';
import type { ColorToken } from './tone';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

// Satori no lee variables CSS: copia de los tokens de src/styles/global.css que usan las OG.
const HEX: Record<string, string> = {
  base: '#05080c',
  panel: '#060c12',
  code: '#04090e',
  line: '#13212b',
  fg: '#d7e7ee',
  'fg-strong': '#f2fbff',
  muted: '#a9c1cc',
  subtle: '#7e9aa8',
  brand: '#00e5ff',
  home: '#00e5ff',
  ctf: '#3dff9a',
  bb: '#ffb020',
  warn: '#ffb020',
  biblia: '#b98cff',
  tools: '#ff5fa2',
  whoami: '#4da3ff',
  tags: '#ffe45c',
  'area-recon': '#00e5ff',
  'area-web': '#ff8a3d',
  'area-ad': '#b98cff',
  'area-crack': '#ffe45c',
  'area-shell': '#ff5c7a',
  'area-lpe': '#3dff9a',
  'area-wpe': '#4da3ff',
  'area-pivot': '#ff5fa2',
  'dot-close': '#ff5f57',
  'dot-min': '#febc2e',
  'dot-max': '#28c840',
};

const hex = (token: ColorToken) => HEX[token] ?? HEX.brand;

/** '#00e5ff' + 0.2 → 'rgba(0,229,255,0.2)' */
function alpha(color: string, a: number) {
  const n = parseInt(color.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export interface OgCard {
  /** Línea pequeña sobre el título: "Writeup · Hack The Box". */
  kicker: string;
  title: string;
  summary: string;
  /** Token de color de la tarjeta. */
  color: ColorToken;
  /** Ruta que se ve en la barra de la ventana: "ctf/forest" → "~/ctf/forest". */
  path: string;
  /** Datos cortos abajo: sistema, dificultad, severidad... */
  chips?: { text: string; color?: ColorToken }[];
  /** Dos letras para el bloque de la derecha. Sin monograma, se pinta la firma "p3i". */
  monogram?: string;
}

// ---------- recursos (se cargan una vez por build) ----------

let resources: Promise<{ fonts: Parameters<typeof satori>[1]['fonts'] }> | undefined;

function loadResources() {
  return (resources ??= (async () => {
    const root = process.cwd();
    const font = (pkg: string, file: string) => readFile(join(root, 'node_modules', '@fontsource', pkg, 'files', file));
    const [regular, semibold, bold, tag, wasm] = await Promise.all([
      font('chakra-petch', 'chakra-petch-latin-400-normal.woff'),
      font('chakra-petch', 'chakra-petch-latin-600-normal.woff'),
      font('chakra-petch', 'chakra-petch-latin-700-normal.woff'),
      font('sedgwick-ave-display', 'sedgwick-ave-display-latin-400-normal.woff'),
      readFile(join(root, 'node_modules', '@resvg', 'resvg-wasm', 'index_bg.wasm')),
    ]);
    await initWasm(wasm);
    return {
      fonts: [
        { name: 'Chakra Petch', data: regular, weight: 400 as const, style: 'normal' as const },
        { name: 'Chakra Petch', data: semibold, weight: 600 as const, style: 'normal' as const },
        { name: 'Chakra Petch', data: bold, weight: 700 as const, style: 'normal' as const },
        { name: 'Sedgwick', data: tag, weight: 400 as const, style: 'normal' as const },
      ],
    };
  })());
}

// ---------- layout ----------

type Node = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, ...children: (Node | string | null | false)[]): Node => ({
  type,
  props: { style, children: children.filter((c) => c !== null && c !== false) },
});

// Medidas fijas: con flex: 1, el layout de Satori deja que el contenido desborde la ventana.
const MARGIN = 40;
const WINDOW_W = OG_WIDTH - MARGIN * 2;
const WINDOW_H = OG_HEIGHT - MARGIN * 2;
const BAR_H = 60;
const STRIP_H = 6;
const PAD_X = 52;
const PAD_Y = 40;
const BADGE = 220;
const GAP = 44;
const TEXT_W = WINDOW_W - PAD_X * 2 - BADGE - GAP - 4;
const BODY_H = WINDOW_H - BAR_H - STRIP_H - 4;

function layout(card: OgCard): Node {
  const tone = hex(card.color);
  const titleSize = card.title.length > 48 ? 50 : card.title.length > 30 ? 60 : 72;

  const dot = (token: string) => h('div', { width: 16, height: 16, borderRadius: 8, backgroundColor: hex(token) });

  const chip = (c: { text: string; color?: ColorToken }) => {
    const color = hex(c.color ?? card.color);
    return h(
      'div',
      {
        display: 'flex',
        padding: '6px 16px',
        borderRadius: 10,
        border: `2px solid ${alpha(color, 0.45)}`,
        backgroundColor: alpha(color, 0.1),
        color,
        fontSize: 22,
        fontWeight: 600,
        letterSpacing: 1,
      },
      c.text,
    );
  };

  const badge = card.monogram
    ? h(
        'div',
        {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: BADGE,
          height: BADGE,
          borderRadius: 28,
          backgroundImage: `radial-gradient(circle at 50% 40%, ${alpha(tone, 0.5)}, ${alpha(tone, 0.08)} 60%, ${HEX.code} 100%)`,
          color: HEX['fg-strong'],
          fontSize: 120,
          fontWeight: 700,
          letterSpacing: -6,
          textShadow: `0 0 30px ${alpha(tone, 0.9)}`,
        },
        card.monogram,
      )
    : h(
        'div',
        {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: BADGE,
          height: BADGE,
          borderRadius: BADGE / 2,
          border: `4px solid ${alpha(HEX.brand, 0.7)}`,
          backgroundImage: `radial-gradient(circle at 50% 40%, ${alpha(HEX.brand, 0.22)}, ${HEX.code} 70%)`,
          color: HEX.brand,
          fontFamily: 'Sedgwick',
          fontSize: 110,
          // Una sola sombra corta: cada capa de desenfoque grande suma más de un segundo en resvg.
          textShadow: `0 0 16px ${alpha(HEX.brand, 0.9)}`,
        },
        'p3i',
      );

  return h(
    'div',
    {
      display: 'flex',
      width: OG_WIDTH,
      height: OG_HEIGHT,
      padding: MARGIN,
      backgroundColor: HEX.base,
      backgroundImage: `linear-gradient(${alpha(HEX.brand, 0.05)} 1px, transparent 1px), linear-gradient(90deg, ${alpha(HEX.brand, 0.05)} 1px, transparent 1px)`,
      backgroundSize: '48px 48px',
      fontFamily: 'Chakra Petch',
      color: HEX.fg,
    },
    h(
      'div',
      {
        display: 'flex',
        flexDirection: 'column',
        width: WINDOW_W,
        height: WINDOW_H,
        borderRadius: 26,
        border: `2px solid ${alpha(tone, 0.45)}`,
        backgroundColor: alpha(HEX.panel, 0.94),
        // Halo de color con un degradado: un boxShadow con desenfoque tarda ~5 s por imagen en resvg.
        backgroundImage: `radial-gradient(circle at 82% 55%, ${alpha(tone, 0.16)}, transparent 55%)`,
        overflow: 'hidden',
      },
      // barra de la ventana
      h(
        'div',
        {
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          height: BAR_H,
          padding: '0 28px',
          borderBottom: `2px solid ${HEX.line}`,
          color: HEX.subtle,
          fontSize: 22,
        },
        dot('dot-close'),
        dot('dot-min'),
        dot('dot-max'),
        h('div', { display: 'flex', marginLeft: 20 }, `p3i@kali: ~/${card.path}`),
        h('div', { display: 'flex', marginLeft: 'auto', color: HEX.brand }, 'p3ix.github.io'),
      ),
      // contenido
      h(
        'div',
        { display: 'flex', height: BODY_H, padding: `${PAD_Y}px ${PAD_X}px`, gap: GAP },
        h(
          'div',
          { display: 'flex', flexDirection: 'column', width: TEXT_W, justifyContent: 'space-between' },
          h(
            'div',
            { display: 'flex', flexDirection: 'column', gap: 18 },
            h('div', { display: 'flex', color: tone, fontSize: 24, fontWeight: 600, letterSpacing: 5, textTransform: 'uppercase' }, card.kicker),
            h('div', { display: 'flex', color: HEX['fg-strong'], fontSize: titleSize, fontWeight: 700, lineHeight: 1.05 }, card.title),
            h('div', { display: 'block', color: HEX.muted, fontSize: 28, lineHeight: 1.4, lineClamp: 2 }, card.summary),
          ),
          card.chips?.length ? h('div', { display: 'flex', gap: 12 }, ...card.chips.map(chip)) : null,
        ),
        h('div', { display: 'flex', alignItems: 'center' }, badge),
      ),
      // filete con los colores de sección
      h('div', {
        display: 'flex',
        height: STRIP_H,
        backgroundImage: `linear-gradient(90deg, ${HEX.home}, ${HEX.ctf}, ${HEX.bb}, ${HEX.tools}, ${HEX.biblia})`,
      }),
    ),
  );
}

export async function renderOg(card: OgCard) {
  const { fonts } = await loadResources();
  const svg = await satori(layout(card) as Parameters<typeof satori>[0], { width: OG_WIDTH, height: OG_HEIGHT, fonts });
  return new Resvg(svg, { fitTo: { mode: 'width', value: OG_WIDTH } }).render().asPng();
}
