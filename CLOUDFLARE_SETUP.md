# Configuração Cloudflare + GitHub Pages - cinecasa.paixaoflix.vip

## 1. GitHub Pages Setup
- Vá em Settings → Pages
- Source: Deploy from a branch → `gh-pages` (ou GitHub Actions)
- Custom domain: `cinecasa.paixaoflix.vip`
- Salve e aguarde o DNS check

## 2. Cloudflare DNS
- Acesse DNS → Records
- Add CNAME:
  - Type: CNAME
  - Name: `cinecasa`
  - Target: `seu-usuario.github.io` (substitua pelo seu usuário/organização)
  - Proxy: **LIGADO** (nuvem laranja) ou DESLIGADO para DNS only

## 3. SSL/TLS (Cloudflare)
- SSL/TLS → Overview
- Encryption mode: **Full (strict)**
- Always Use HTTPS: ON

## 4. Page Rules (opcional)
- Page Rules → Create Page Rule
- URL: `cinecasa.paixaoflix.vip/*`
- Settings: 
  - Automatic HTTPS Rewrites: ON
  - Security Level: Medium

## Pronto!
- Propagação DNS: até 24h
- Verifique em: https://cinecasa.paixaoflix.vip
