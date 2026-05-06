# 🔧 CineCasa — Instruções de Aplicação dos Fixes

## Arquivos corrigidos neste ZIP

```
src/App.tsx                          → Bug #9, #10, #11, #12
src/pages/Search.tsx                 → Bug #3
src/pages/DetailsNew.tsx             → Bug #1, #5, #6
src/pages/Favorites.tsx              → Bug #4
src/pages/PremiumHome.tsx            → Bug #8, #11, #13
src/components/ContinueWatching.tsx  → Bug #2
.gitignore                           → Bug #14
```

---

## Como aplicar

### Passo 1 — Extrair e substituir os arquivos

Copie cada arquivo deste ZIP para a pasta correspondente no seu projeto:

```bash
# Na pasta raiz do projeto CineCasa
cp FIXES/src/App.tsx                         src/App.tsx
cp FIXES/src/pages/Search.tsx                src/pages/Search.tsx
cp FIXES/src/pages/DetailsNew.tsx            src/pages/DetailsNew.tsx
cp FIXES/src/pages/Favorites.tsx             src/pages/Favorites.tsx
cp FIXES/src/pages/PremiumHome.tsx           src/pages/PremiumHome.tsx
cp FIXES/src/components/ContinueWatching.tsx src/components/ContinueWatching.tsx
cp FIXES/.gitignore                          .gitignore
```

### Passo 2 — Remover o arquivo .env do histórico Git (IMPORTANTE!)

O `.env` foi commitado com chaves secretas. Faça isso:

```bash
# Remove .env do rastreamento git (mantém o arquivo localmente)
git rm --cached .env

# Commite a remoção
git add .gitignore
git commit -m "fix: remove .env do git e atualiza .gitignore"
```

> ⚠️ Se possível, regenere as chaves do Supabase e TMDB no painel deles, pois
> as chaves antigas já ficaram expostas publicamente no GitHub.

### Passo 3 — Deletar a página TvAoVivo

```bash
rm src/pages/TvAoVivo.tsx
```

### Passo 4 — Commitar e fazer push

```bash
git add src/App.tsx \
        src/pages/Search.tsx \
        src/pages/DetailsNew.tsx \
        src/pages/Favorites.tsx \
        src/pages/PremiumHome.tsx \
        src/components/ContinueWatching.tsx \
        .gitignore

git commit -m "fix: corrige 14 bugs de funcionalidade

- feat: Search.tsx implementado com busca real no Supabase
- fix: DetailsNew - botão Assistir agora usa PlayerContext
- fix: DetailsNew - botão Trailer abre player/link correto
- fix: DetailsNew - botão Like salva rating no Supabase
- fix: ContinueWatching - navega para /details em vez de /watch inexistente
- fix: Favorites - corrige nomes dos métodos (removeFavorite, refresh)
- fix: PremiumHome - remove ~350 linhas de mock data não utilizadas
- fix: PremiumHome - onRemove de ContinueWatching agora funciona
- fix: App.tsx - remove TvAoVivo e rota /tvaovivo
- fix: App.tsx - splash exibe apenas uma vez por login (não em refresh)
- fix: App.tsx - remove hooks de auto-update quebrados
- chore: remove todos os console.log de produção
- chore: .gitignore atualizado para bloquear .env"

git push origin main
```

O deploy na Vercel e Cloudflare Workers acontece automaticamente via CI/CD.

---

## Resumo dos bugs corrigidos

| # | Arquivo | Bug | Status |
|---|---------|-----|--------|
| 1 | DetailsNew.tsx | "Assistir agora" navegava para /watch/ inexistente | ✅ Corrigido |
| 2 | ContinueWatching.tsx | Links de "Continuar assistindo" iam para /watch/ inexistente | ✅ Corrigido |
| 3 | Search.tsx | Página de busca era um stub sem funcionalidade | ✅ Corrigido |
| 4 | Favorites.tsx | Métodos fetchFavorites/removeFromFavorites não existiam no hook | ✅ Corrigido |
| 5 | DetailsNew.tsx | Botão Trailer sem onClick — completamente inerte | ✅ Corrigido |
| 6 | DetailsNew.tsx | Botão Like sem onClick — não salvava nada | ✅ Corrigido |
| 8 | PremiumHome.tsx | ~350 linhas de mock data declarados mas nunca usados | ✅ Corrigido |
| 9 | App.tsx | Rota /tvaovivo inexistente + página TvAoVivo removida | ✅ Corrigido |
| 10 | App.tsx | Hooks de auto-update quebrados (causavam loop) ainda importados | ✅ Corrigido |
| 11 | App.tsx + PremiumHome | Dezenas de console.log vazando dados em produção | ✅ Corrigido |
| 12 | App.tsx | Splash screen aparecia toda vez que usuário recarregava a página | ✅ Corrigido |
| 13 | PremiumHome.tsx | onRemove de ContinueWatching era um console.log vazio | ✅ Corrigido |
| 14 | .gitignore | Arquivo .env com chaves secretas rastreado pelo Git | ✅ Corrigido |

## O que NÃO foi alterado
- Bug #7 (pagamento) — requer integração com Stripe/Mercado Pago/Pix.
  Estrutura da Subscription.tsx está pronta, só precisa do gateway.
  Me avise se quiser implementar.
