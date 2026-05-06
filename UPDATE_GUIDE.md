# 🚀 Guia de Atualização Multi-Plataforma CineCasa

Este guia explica como manter seu projeto CineCasa sempre atualizado em todas as plataformas: **Vercel**, **GitHub**, **Cloudflare Workers** e ambiente **local**.

## 📋 Visão Geral

O sistema de atualização foi projetado para **zero downtime** e **sincronização automática** entre todas as plataformas.

### Plataformas Configuradas

- **🌐 Vercel**: `https://cinecasa.vercel.app` (ID: `prj_0bqSB8wLnBeewfMawndo8tSEbR8U`)
- **☁️ Cloudflare**: `https://cinecasa.pages.dev`
- **📄 GitHub Pages**: `https://kassiaavilla.github.io/cinecasa/`
- **🔄 GitHub Repo**: `https://github.com/kassiaavilla/cinecasa`
- **💻 Local**: `http://localhost:3000`

## 🛠️ Scripts Disponíveis

### 1. Atualização Completa (Recomendado)

```bash
# Atualizar TODAS as plataformas
npm run update:all

# Apenas Vercel
npm run update:vercel

# Apenas Cloudflare
npm run update:cloudflare
```

### 2. Sincronização Local

```bash
# Sincronização única
npm run sync:local

# Modo observação contínuo
npm run sync:watch

# Sincronizar e iniciar servidor
npm run dev:sync

# Verificar saúde do ambiente
npm run sync:health
```

### 3. Scripts Diretos

```bash
# Script completo de atualização
./scripts/update-all-platforms.sh

# Script de sincronização local
./scripts/sync-local.sh
```

## 🔄 Fluxo de Atualização Automática

### GitHub Actions (Automático)

1. **Push para main** → Trigger automático
2. **Build otimizado** com cache
3. **Deploy paralelo** para todas as plataformas
4. **Cache invalidation** automático
5. **Verificação** de saúde

### Script Local (Manual)

1. **Sincronização** com repositório remoto
2. **Build** da aplicação
3. **Deploy** sequencial para cada plataforma
4. **Health checks** e verificação

## 🚀 Uso Recomendado

### Para Desenvolvimento Diário

```bash
# 1. Sincronizar e iniciar ambiente local
npm run dev:sync

# 2. Modo observação para manter tudo atualizado
npm run sync:watch
```

### Para Deploy em Produção

```bash
# Opção 1: Atualização completa
npm run update:all

# Opção 2: Apenas plataforma específica
npm run update:vercel
```

### Para Manutenção

```bash
# Verificar saúde de todos os ambientes
npm run sync:health

# Limpar e reconfigurar ambiente
./scripts/sync-local.sh clean
./scripts/sync-local.sh full
```

## ⚙️ Configurações

### Variáveis de Ambiente Necessárias

Configure no GitHub Secrets:

```bash
# Vercel
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID=prj_0bqSB8wLnBeewfMawndo8tSEbR8U

# Cloudflare
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_ZONE_ID

# Supabase
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_ANON_KEY

# TMDB
VITE_TMDB_API_KEY
```

### Configuração Local

Crie arquivo `.env.deploy`:

```bash
ENVIRONMENT=production
DEPLOY_TARGET=docker
DOMAIN=cinecasa.vercel.app
STAGING_URL=https://staging.cinecasa.vercel.app
PRODUCTION_URL=https://cinecasa.vercel.app
```

## 📊 Monitoramento e Logs

### Logs de Atualização

- **Local**: `logs/update-all.log`
- **Sincronização**: `logs/sync-local.log`
- **GitHub Actions**: Disponível na aba "Actions" do repo

### Verificação de Saúde

```bash
# Verificar status de todas as plataformas
npm run sync:health

# Health checks individuais
curl https://cinecasa.vercel.app
curl https://cinecasa.pages.dev
curl https://kassiaavilla.github.io/cinecasa/
```

## 🔄 Fluxos de Trabalho

### Fluxo 1: Desenvolvimento → Produção

```bash
# 1. Desenvolvimento local
npm run dev:sync

# 2. Commit e push (trigger automático)
git add .
git commit -m "feat: nova funcionalidade"
git push origin main

# 3. Deploy automático via GitHub Actions
# ✅ Todas as plataformas atualizadas
```

### Fluxo 2: Atualização Manual

```bash
# 1. Atualização completa manual
npm run update:all

# 2. Verificação
npm run sync:health
```

### Fluxo 3: Emergência/Rollback

```bash
# 1. Rollback via GitHub Actions
# Use workflow_dispatch com platform específica

# 2. Rollback local
git checkout HEAD~1
npm run update:vercel
```

## 🚨 Solução de Problemas

### Deploy Falhou

1. **Verificar logs**: GitHub Actions ou logs locais
2. **Verificar secrets**: Variáveis de ambiente configuradas?
3. **Verificar build**: `npm run build` localmente
4. **Limpar cache**: `npm run update:all --skip-build`

### Sincronização Local Falhou

1. **Verificar conexão**: `git pull origin main`
2. **Limpar ambiente**: `./scripts/sync-local.sh clean`
3. **Reinstalar dependências**: `rm -rf node_modules && npm install`
4. **Verificar permissões**: `chmod +x scripts/*.sh`

### Plataforma Específica Falhou

```bash
# Apenas Vercel
npm run update:vercel

# Apenas Cloudflare
npm run update:cloudflare

# Verificar status individual
curl -I https://cinecasa.vercel.app
curl -I https://cinecasa.pages.dev
```

## 📈 Performance e Cache

### Cache Invalidation Automática

- **Vercel**: API purge automática
- **Cloudflare**: Cache purge total
- **GitHub Pages**: Build version nos headers
- **Local**: Hot reload automático

### Build Optimization

- **Parallel builds**: Múltiplas plataformas simultaneamente
- **Cache de dependências**: npm cache otimizado
- **Incremental builds**: Apenas arquivos modificados
- **Compression**: Gzip automático

## 🎯 Best Practices

### 1. Antes de Fazer Alterações

```bash
# Verificar status atual
npm run sync:health

# Fazer backup
git checkout -b backup-$(date +%Y%m%d)
```

### 2. Durante Desenvolvimento

```bash
# Modo observação ativo
npm run sync:watch

# Commits frequentes
git add .
git commit -m "feat: progresso parcial"
git push origin main
```

### 3. Após Alterações

```bash
# Atualização completa
npm run update:all

# Verificação final
npm run sync:health
```

## 📞 Suporte

### Issues Comuns

1. **Permissão negada**: `chmod +x scripts/*.sh`
2. **Secrets faltando**: Configurar no GitHub
3. **Build falhando**: Verificar dependências
4. **Deploy lento**: Cache propagation normal

### Comandos de Diagnóstico

```bash
# Status completo
./scripts/update-all-platforms.sh --help
./scripts/sync-local.sh --help

# Verificar configuração
npm run validate:env

# Testar build
npm run build
npm run preview
```

---

## 🎉 Conclusão

Com este sistema, seu projeto CineCasa estará sempre atualizado em todas as plataformas com **zero downtime** e **cache otimizado**.

**Principais vantagens:**
- ✅ Deploy automático e paralelo
- ✅ Cache invalidation inteligente
- ✅ Health checks automáticos
- ✅ Rollback rápido
- ✅ Monitoramento completo
- ✅ Sincronização local contínua

Mantenha este guia atualizado conforme novas funcionalidades forem adicionadas!
