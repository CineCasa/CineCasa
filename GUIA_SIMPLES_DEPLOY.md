# Guia Simples de Publicação - CineCasa

Como colocar seu site no ar de forma gratuita. Sem termos complicados!

---

## O que você precisa

1. Conta no **GitHub** (onde está o código)
2. Conta no **Supabase** (banco de dados) - já deve ter
3. Conta no **Cloudflare** (opcional, para domínio próprio)

---

## OPÇÃO 1: Vercel (Mais Fácil) ⭐ RECOMENDADO

### Passo 1: Criar conta
1. Acesse: https://vercel.com
2. Clique em "Sign Up"
3. Escolha "Continue with GitHub"
4. Autorize o acesso

### Passo 2: Importar projeto
1. No painel da Vercel, clique em **"Add New..."** → **"Project"**
2. Encontre o repositório **"CineCasa"** na lista
3. Clique em **"Import"**

### Passo 3: Configurar
1. Em **"Framework Preset"** escolha: **"Vite"**
2. Deixe as outras opções como estão
3. Clique em **"Environment Variables"** (expandir)
4. Adicione estas 2 variáveis:

| Nome | Valor |
|------|-------|
| `VITE_SUPABASE_URL` | Cole aqui a URL do Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Cole aqui a chave pública |

> 💡 **Onde pegar esses valores?** No Supabase: Settings → API

5. Clique em **"Deploy"**

### Pronto! 🎉
- O site estará em: `https://cinecasa-SEUNOME.vercel.app`
- Toda vez que você fizer `git push`, o site atualiza sozinho!

---

## OPÇÃO 2: Netlify (Também Muito Fácil)

### Passo 1: Criar conta
1. Acesse: https://netlify.com
2. Clique em "Sign up" → "Sign up with GitHub"

### Passo 2: Adicionar site
1. No painel, clique em **"Add new site"** → **"Import an existing project"**
2. Escolha **"GitHub"**
3. Autorize o Netlify
4. Encontre e clique em **"CineCasa"**

### Passo 3: Configurar build
1. **Build command:** `npm run build`
2. **Publish directory:** `dist`
3. Clique em **"Show advanced"** → **"New variable"**
4. Adicione:
   - `VITE_SUPABASE_URL` = URL do Supabase
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = Chave pública
5. Clique em **"Deploy site"**

### Pronto! 🎉
- Site em: `https://SEUNOME-cinecasa.netlify.app`

---

## OPÇÃO 3: Cloudflare Pages (Com Domínio Próprio)

### Passo 1: Configurar domínio (se tiver)
Se você tem um domínio como `seusite.com`:

1. Acesse: https://dash.cloudflare.com
2. Clique em **"Add a site"**
3. Digite seu domínio
4. Escolha o plano **"Free"**
5. Siga as instruções de mudar os nameservers no seu registrador

### Passo 2: Criar projeto no Cloudflare
1. No menu lateral, clique em **"Pages"**
2. Clique em **"Create a project"**
3. Conecte com **GitHub**
4. Escolha o repositório **"CineCasa"**

### Passo 3: Configurar
1. **Framework preset:** Vite
2. **Build command:** `npm run build`
3. **Build output directory:** `/dist`
4. Adicione as variáveis do Supabase (igual nas opções anteriores)
5. Clique em **"Save and Deploy"**

### Pronto! 🎉
- Site em: `https://cinecasa-SEUNOME.pages.dev`
- Para usar seu domínio: Settings → Custom domains

---

## OPÇÃO 4: GitHub Pages (Mais Básico)

Esta opção é mais simples mas tem algumas limitações.

### Passo 1: Ativar no GitHub
1. Vá no repositório: https://github.com/CineCasa/CineCasa
2. Clique em **"Settings"** (engrenagem no topo)
3. No menu lateral, clique em **"Pages"**
4. Em "Source", escolha **"GitHub Actions"**

### Passo 2: Configurar variáveis
1. Ainda em Settings, clique em **"Secrets and variables"** → **"Actions"**
2. Clique em **"New repository secret"**
3. Adicione:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`

### Passo 3: Fazer deploy
1. Faça qualquer alteração no código
2. Dê `git push` para a branch `main`
3. O GitHub Actions faz o resto!

### Pronto! 🎉
- Site em: `https://SEUNOME.github.io/CineCasa`

---

## Configurar Domínio Próprio (Opcional)

Se você comprou um domínio (ex: `cinecasa.com.br`):

### Na Vercel:
1. Dashboard → Seu projeto → Settings → Domains
2. Digite seu domínio
3. Siga as instruções de DNS

### No Cloudflare:
1. Vá em **DNS → Records**
2. Adicione:
   - Type: `CNAME`
   - Name: `@` (ou `www`)
   - Target: (a URL que a Vercel/Cloudflare te deu)
   - Proxy: ☁️ LIGADO

---

## Como saber se deu certo?

1. Acesse a URL que a plataforma te deu
2. O site deve abrir igual no localhost
3. Teste fazer login - deve funcionar
4. Teste assistir um vídeo

---

## Problemas Comuns

### ❌ "Build failed"
**Causa:** Faltou configurar as variáveis do Supabase
**Solução:** Volte na configuração e adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`

### ❌ "Page not found" ao atualizar
**Causa:** Problema de rotas SPA
**Solução:** Já está configurado no `vercel.json` e `_redirects`

### ❌ Site abre mas não carrega dados
**Causa:** Chave do Supabase errada
**Solução:** Verifique se copiou a chave pública (anon/public), não a service_role

---

## Qual escolher?

| Plataforma | Dificuldade | Domínio Próprio | Velocidade |
|------------|-------------|-----------------|------------|
| **Vercel** | ⭐ Fácil | ✅ Grátis | 🚀 Rápido |
| **Netlify** | ⭐ Fácil | ✅ Grátis | 🚀 Rápido |
| **Cloudflare** | ⭐⭐ Médio | ✅ Grátis | ⚡ Muito rápido |
| **GitHub** | ⭐⭐ Médio | ❌ Limitado | 🐢 Mais lento |

---

**Recomendação:** Comece com a **Vercel**. É a mais fácil e rápida!

Dúvidas? Consulte o arquivo `DEPLOY_GUIDE.md` para detalhes técnicos.
