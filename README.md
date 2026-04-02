# Sudoku (Web Estático)

Este projeto foi feito para rodar no **GitHub Pages**.

## Arquitetura

Aplicação 100% estática, sem backend e sem etapa de build:

- `index.html`: página principal
- `styles.css`: estilos e temas
- `script.js`: lógica do jogo (JavaScript vanilla)
- `favicon.svg`: ícone

## Regras de compatibilidade (importante)

Para evitar conflitos com GitHub Pages e manter o deploy simples, **não adicionar**:

- backend (Node.js, APIs próprias, servidores)
- bundlers/build tools (Vite, Webpack, Parcel etc.)
- dependências que exijam instalação via npm para a aplicação funcionar
- módulos ES com `import`/`export` no frontend
- pipelines que dependam de compilação para gerar os arquivos finais

## Padrões do projeto

- Persistência local via `localStorage`
- Estrutura de arquivos simples (flat), focada em HTML + CSS + JS
- Interface em português brasileiro (pt-BR)
- Fontes podem ser carregadas via CDN no HTML
- Temas devem continuar baseados em CSS variables

## Objetivo

Manter o projeto leve, direto e compatível com hospedagem estática no GitHub Pages.
