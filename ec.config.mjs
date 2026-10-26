// @ts-check
import { defineEcConfig } from 'astro-expressive-code';

// Bloques de código con la estética A2 de la web.
// Los valores replican los tokens de src/styles/global.css: Expressive Code genera su propio CSS
// y no lee las variables de Tailwind.
export default defineEcConfig({
  themes: ['tokyo-night'],
  useDarkModeMediaQuery: false,
  // Los comandos largos se parten en varias líneas en vez de obligar a hacer scroll horizontal.
  defaultProps: { wrap: true },
  styleOverrides: {
    borderRadius: '0.75rem',
    borderColor: '#13212B',
    codeBackground: '#04090E',
    codeFontFamily: "'JetBrains Mono Variable', ui-monospace, monospace",
    codeFontSize: '0.875rem',
    codeLineHeight: '1.75',
    uiFontFamily: "'JetBrains Mono Variable', ui-monospace, monospace",
    uiFontSize: '0.8125rem',
    focusBorder: '#00E5FF',
    frames: {
      editorTabBarBackground: '#060C12',
      editorTabBarBorderBottomColor: '#13212B',
      editorActiveTabBackground: '#04090E',
      editorActiveTabForeground: '#D7E7EE',
      editorActiveTabIndicatorTopColor: '#00E5FF',
      editorBackground: '#04090E',
      terminalTitlebarBackground: '#060C12',
      terminalTitlebarBorderBottomColor: '#13212B',
      terminalTitlebarForeground: '#7E9AA8',
      terminalTitlebarDotsForeground: '#3B5463',
      terminalTitlebarDotsOpacity: '1',
      terminalBackground: '#04090E',
      frameBoxShadowCssValue: '0 0 40px rgba(0, 229, 255, 0.06)',
      inlineButtonForeground: '#00E5FF',
      inlineButtonBorder: '#00E5FF',
      tooltipSuccessBackground: '#3DFF9A',
      tooltipSuccessForeground: '#04070A',
    },
    textMarkers: {
      markBackground: 'rgba(0, 229, 255, 0.10)',
      markBorderColor: '#00E5FF',
    },
  },
  frames: {
    // Al copiar desde un marco de terminal se quitan las líneas de comentario (#).
    removeCommentsWhenCopyingTerminalFrames: true,
  },
});
