# Guia de Deploy - CineCasa

Sistema configurado para deploy nas plataformas: **GitHub Pages**, **Cloudflare Pages**, **Vercel** e **Netlify**.

## Resumo das Configurações

| Plataforma | Arquivo de Config | Workflow | Status |
|------------|------------------|----------|--------|
| GitHub Pages | - | `ci-cd.yml` | ✅ Configurado |
| Cloudflare Pages | `CLOUDFLARE_SETUP.md` | `deploy-cloudflare.yml` | ✅ Configurado |
| Vercel | `vercel.json` | `deploy-vercel.yml` | ✅ Configurado |
| Netlify | `netlify.toml` (se existir) | `deploy-netlify.yml` | ✅ Configurado |

---

## 1. GitHub Pages (Gratuito)

### Configuração:
1. Vá em **Settings → Pages** no repositório
2. Source: **Deploy from a branch** → `gh-pages`
3. Custom domain: `cinecasa.paixaoflix.vip` (opcional)
4. Salve e aguarde o DNS check

### Secrets necessários:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

---

## 2. Cloudflare Pages (Gratuito)

### Configuração DNS:
1. Acesse **DNS → Records**
2. Adicione CNAME:
   - Type: `CNAME`
   - Name: `cinecasa`
   - Target: `seu-usuario.github.io`
   - Proxy: **LIGADO** ☁️

### SSL/TLS:
1. SSL/TLS → Overview
2. Encryption mode: **Full (strict)**
3. Always Use HTTPS: **ON**

### GitHub Secrets:
```bash
CLOUDFLARE_ACCOUNT_ID=seu_account_id
```

---

## 3. Vercel (Gratuito)

### Deploy via CLI:
```bash
npm i -g vercel
vercel login
vercel --prod
```

### Configuração via GitHub:
1. Conecte o repositório na dashboard da Vercel
2. Configure as variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`

### GitHub Secrets:
```bash
VERCEL_TOKEN=seu_token
VERCEL_ORG_ID=seu_org_id
VERCEL_PROJECT_ID=seu_project_id
```

---

## 4. Netlify (Gratuito)

### Configuração:
1. Conecte o repositório no Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`

### GitHub Secrets:
```bash
NETLIFY_AUTH_TOKEN=seu_token
NETLIFY_SITE_ID=seu_site_id
```

---

## Variáveis de Ambiente Necessárias

Todas as plataformas precisam destas variáveis:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_publica
```

---

## Comandos de Deploy

### Deploy local (teste):
```bash
npm run build
npm run preview
```

### Deploy para produção:
```bash
git push origin main
```

Os workflows do GitHub Actions farão o deploy automaticamente.

---

## Troubleshooting

### Build falha:
- Verifique se `npm run build` funciona localmente
- Confira se todas as secrets estão configuradas

### 404 em rotas:
- Verifique se `_redirects` está em `/public/`
- Confira as configurações de SPA na plataforma

### Assets não carregam:
- Verifique `base` no `vite.config.ts`
- Confira se `dist` contém todos os arquivos

---

## Domínio Customizado

Para usar `cinecasa.paixaoflix.vip`:

1. Configure o domínio na plataforma escolhida
2. Adicione o CNAME no Cloudflare apontando para a plataforma
3. Aguarde propagação DNS (até 24h)

---

**Pronto!** O sistema está configurado para deploy automático em múltiplas plataformas.
