# Deploy no Netlify

## Configuração

O projeto está configurado para deploy automático no Netlify usando o arquivo `netlify.toml`.

## Variáveis de Ambiente

Configure estas variáveis no dashboard do Netlify (Site settings → Environment variables):

```
VITE_SUPABASE_URL=https://eqhstnlsmfrwxhvcwoid.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_publica_aqui
VITE_TMDB_API_KEY=sua_chave_tmdb_aqui
```

## Build

O build é automático quando conectado ao repositório Git:
- **Command:** `npm run build`
- **Publish directory:** `dist`
- **Node version:** 20

## Redirects

- `/api/*` → Supabase Functions
- `/*` → SPA fallback (index.html)

## Supabase Edge Functions

As funções edge do Supabase estão em `/supabase/functions/`:
- `bulk-insert` - Inserção em massa de dados
- `fetch-low-rated` - Busca de conteúdo com baixa avaliação

## Links

- **Supabase Project:** https://app.supabase.com/project/eqhstnlsmfrwxhvcwoid
- **Edge Functions:** https://eqhstnlsmfrwxhvcwoid.supabase.co/functions/v1/
