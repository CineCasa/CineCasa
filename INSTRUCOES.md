# 🎬 CineCasa — Fixes v3 (Player real + Episódios + Previews + Dispositivos)

## Arquivos neste ZIP

```
src/App.tsx                        → PlayerContainer passa tmdbId, hasNextEpisode, onNextEpisode
src/contexts/PlayerContext.tsx     → PlayerItem estendido com tmdbId, hasNextEpisode, onNextEpisode
src/components/VideoJSPlayer.tsx   → Salva progresso a cada 10s + preview thumbnails na scrubber
src/components/YouTubePlayer.tsx   → YouTube IFrame API real + scrubber customizada + progress saving
src/pages/DetailsNew.tsx           → Lista temporadas + episódios + playEpisode com autoplay próximo
src/services/DeviceService.ts      → RPCs substituídas por queries diretas em user_devices
src/services/tmdb.ts               → fetchScrubberThumbnails + fetchEpisodeThumbnails
worker/worker.js                   → Novas rotas: /tmdb/images e /tmdb/episode-images
```

---

## O que cada arquivo resolve

### VideoJSPlayer.tsx + YouTubePlayer.tsx
- **Antes:** sem evento timeupdate, não salvava nada em user_progress
- **Depois:** salva a cada 10s em user_progress com todos os campos corretos
- **Antes:** YouTube era iframe sem controles, sem retomar de onde parou
- **Depois:** YouTube IFrame API com scrubber, play/pause, velocidade, resume
- **Novo:** preview de cenas reais ao passar o mouse na scrubber (via TMDB)
- **Novo:** overlay "Próximo episódio em Xs" nos últimos 20s, igual Netflix

### DetailsNew.tsx
- **Antes:** séries não mostravam episódios (tabelas temporadas+episodios ignoradas)
- **Depois:** busca temporadas → episódios → exibe lista com thumbnail, título, duração, progresso
- **Novo:** seletor de temporadas (T1, T2, T3...)
- **Novo:** botão play em cada episódio abre player com todos os metadados corretos
- **Novo:** autoplay próximo episódio: ao terminar T1E1 → começa T1E2 automaticamente
- **Novo:** ao cruzar última temporada, vai para a próxima automaticamente

### DeviceService.ts
- **Antes:** todas as funções chamavam RPCs (register_device, get_user_devices,
  remove_device, logout_other_devices) que NÃO EXISTEM no banco
- **Depois:** queries diretas à tabela user_devices com os campos reais

### worker.js
- **Nova rota GET /tmdb/images?tmdb=ID&type=movie|tv&duration=SECONDS**
  Retorna backdrops distribuídos ao longo da duração para preview na scrubber
- **Nova rota GET /tmdb/episode-images?tmdb=ID&season=S&episode=E&duration=SECONDS**
  Retorna stills do episódio específico (fallback para backdrops da série)

---

## Como aplicar

```bash
# Copiar arquivos
cp FIXES_V3/src/App.tsx                        src/App.tsx
cp FIXES_V3/src/contexts/PlayerContext.tsx     src/contexts/PlayerContext.tsx
cp FIXES_V3/src/components/VideoJSPlayer.tsx   src/components/VideoJSPlayer.tsx
cp FIXES_V3/src/components/YouTubePlayer.tsx   src/components/YouTubePlayer.tsx
cp FIXES_V3/src/pages/DetailsNew.tsx           src/pages/DetailsNew.tsx
cp FIXES_V3/src/services/DeviceService.ts      src/services/DeviceService.ts
cp FIXES_V3/src/services/tmdb.ts               src/services/tmdb.ts
cp FIXES_V3/worker/worker.js                   worker/worker.js
```

```bash
git add src/App.tsx \
        src/contexts/PlayerContext.tsx \
        src/components/VideoJSPlayer.tsx \
        src/components/YouTubePlayer.tsx \
        src/pages/DetailsNew.tsx \
        src/services/DeviceService.ts \
        src/services/tmdb.ts \
        worker/worker.js

git commit -m "feat: player real com progresso, episódios, next-ep e thumbnails

- feat: VideoJSPlayer salva progresso em user_progress a cada 10s
- feat: YouTubePlayer usa IFrame API real (não mais iframe cego)
- feat: preview de cenas reais na scrubber via TMDB backdrops/stills
- feat: overlay 'Próximo episódio' nos últimos 20s (estilo Netflix)
- feat: autoplay próximo episódio / próxima temporada automático
- feat: DetailsNew lista temporadas + episódios com thumbnail e duração
- feat: botão 'Continuar' retoma de onde o usuário parou
- fix: DeviceService - RPCs substituídas por queries em user_devices
- feat: worker - rotas /tmdb/images e /tmdb/episode-images para scrubber"

git push origin main
```

### Deploy do Worker (Cloudflare)
```bash
cd worker
npx wrangler deploy
```

---

## ⚠️ Ponto de atenção: TMDB API Key

A API key do TMDB está hardcoded no worker e nos players.
Para produção, mova para uma variável de ambiente no wrangler.toml:

```toml
# wrangler.toml
[vars]
TMDB_API_KEY = "sua_chave_aqui"
```

E no worker use `env.TMDB_API_KEY` em vez da string literal.

---

## Status final após v1 + v2 + v3

| Funcionalidade | Status |
|---|---|
| Login / autenticação | ✅ |
| Listagem filmes e séries | ✅ |
| Busca real | ✅ |
| Favoritos | ✅ |
| Watchlist | ✅ |
| Continue assistindo (dados reais) | ✅ |
| Player salva progresso | ✅ |
| Resume de onde parou | ✅ |
| Preview na scrubber (cenas reais) | ✅ |
| Próximo episódio automático | ✅ |
| Lista de episódios por temporada | ✅ |
| Sub-perfis | ✅ |
| Página de perfil com dados reais | ✅ |
| Gerenciar dispositivos | ✅ |
| Notificações | ✅ |
| PWA | ✅ |
| **Pagamento/assinatura** | ⚠️ Gateway pendente |
| **Watch Party** | ⚠️ Servidor RT pendente |
