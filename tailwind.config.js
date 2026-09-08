/** Tailwind da landing page DA Sports.
 *  Preflight desligado de propósito: o reset do Tailwind sobrescreveria
 *  o estilo próprio da página (style.css). Aqui o Tailwind entra só como
 *  camada de utilitários (layout, espaçamento, grid) nas partes novas.
 *  As cores apontam para as variáveis CSS do tema, então `bg-ink`,
 *  `text-paper` etc. seguem o modo claro/escuro sozinhos. */
module.exports = {
  content: [
    './index.html',
    './src/js/**/*.js'
  ],
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        ink: 'var(--ink)',
        paper: 'var(--paper)',
        paper2: 'var(--paper-2)',
        card: 'var(--card)',
        line: 'var(--line)',
        muted: 'var(--muted)',
        band: 'var(--band-bg)',
        'band-2': 'var(--band-bg-2)',
        'band-text': 'var(--band-text)',
        'band-muted': 'var(--band-muted)'
      },
      fontFamily: {
        display: 'var(--font-display)',
        body: 'var(--font-body)',
        mono: 'var(--font-mono)'
      },
      borderRadius: { brand: 'var(--radius)' },
      maxWidth: { container: 'var(--container)' }
    }
  },
  plugins: []
};
