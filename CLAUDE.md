# Sudoku - Guia do Projeto

## Arquitetura

Projeto 100% estático hospedado no **GitHub Pages**. Não há backend, bundler, framework ou build step.

- `index.html` — página única
- `styles.css` — estilos com CSS variables para temas
- `script.js` — toda a lógica do jogo (vanilla JS)
- `favicon.svg` — ícone

## Regras importantes

- **Sem dependências externas**: não adicionar npm, node_modules, bundlers (webpack, vite, etc.) ou qualquer ferramenta que exija build.
- **Sem server-side**: não usar Node.js, APIs próprias ou qualquer backend. Persistência é feita via `localStorage`.
- **Sem módulos ES**: o script é carregado direto via `<script src>`, sem `import`/`export`.
- **Sem arquivos extras desnecessários**: manter a estrutura flat (HTML + CSS + JS + favicon).
- **Fontes**: Google Fonts carregadas via CDN no HTML.
- **Temas**: controlados por CSS variables. Cada tema (`theme-glass`, `theme-slate`, `theme-old`, `theme-dark`) deve definir **todas** as variáveis de `:root`.
- **Idioma**: interface em português brasileiro (pt-BR).
