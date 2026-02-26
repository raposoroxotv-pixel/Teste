# LocalTok (offline)

Aplicação completa estilo TikTok para uso **100% local/offline**.

## Stack

- Frontend: React + Vite + CSS moderno (Grid/Flexbox)
- Backend: Node.js + Express
- Banco local: SQLite
- Player: HTML5 Video API

## Funcionalidades implementadas

- Feed vertical com rolagem infinita e snap por tela.
- Reprodução automática do vídeo ativo e pausa dos demais.
- Upload local de vídeos (`.mp4`, `.webm`, `.mov`).
- Geração automática de thumbnail no backend (FFmpeg estático).
- Metadados por vídeo:
  - título
  - descrição
  - tags
  - data de upload
  - likes (simulado)
  - favoritos (simulado)
  - visualizações automáticas
  - caminho do arquivo
- Busca por título, descrição e tags.
- Drag & drop para upload.
- Tema escuro com botões flutuantes laterais no card.

## Estrutura

```text
/backend
  server.js
  database.js
  routes/videos.js
/frontend
  src/App.jsx
  src/components/
  src/pages/
  src/styles/
```

## Instalação

Na raiz do projeto:

```bash
npm install
npm run install:all
```

## Execução (desenvolvimento)

```bash
npm run dev
```

Acesse:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`

## Scripts

- `npm run install:all` → instala dependências de backend e frontend.
- `npm run dev` → sobe backend e frontend em paralelo.
- `npm run start` → backend + frontend (modo dev no frontend).
- `npm run build` → build do frontend.

## Observações

- Os vídeos são armazenados localmente em `backend/uploads/videos`.
- As thumbs são armazenadas em `backend/uploads/thumbnails`.
- O banco SQLite local é `backend/localtok.db`.
