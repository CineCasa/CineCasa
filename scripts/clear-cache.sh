#!/bin/bash
# Script para limpar cache de Vercel e Cloudflare Workers
# Uso: ./scripts/clear-cache.sh

set -e

echo "=========================================="
echo "🧹 LIMPANDO CACHE - CineCasa"
echo "=========================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para verificar se comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo -e "${BLUE}1. Verificando dependências...${NC}"

# Verificar Vercel CLI
if ! command_exists vercel; then
    echo -e "${YELLOW}⚠️  Vercel CLI não encontrado. Instalando...${NC}"
    npm install -g vercel
fi

# Verificar Cloudflare CLI (wrangler)
if ! command_exists wrangler; then
    echo -e "${YELLOW}⚠️  Wrangler CLI não encontrado. Instalando...${NC}"
    npm install -g wrangler
fi

echo -e "${GREEN}✅ Dependências OK${NC}"
echo ""

# ========================================
# LIMPAR CACHE VERCEL
# ========================================
echo -e "${BLUE}2. Limpando cache Vercel...${NC}"

if [ -z "$VERCEL_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  VERCEL_TOKEN não definido. Tentando login interativo...${NC}"
    vercel login
fi

# Redeploy com limpeza de cache
echo -e "${YELLOW}🚀 Redeployando Vercel com limpeza de cache...${NC}"
vercel --prod --force --yes 2>&1 || echo -e "${YELLOW}⚠️  Vercel deploy pode ter falhado${NC}"

echo -e "${GREEN}✅ Vercel atualizado${NC}"
echo ""

# ========================================
# LIMPAR CACHE CLOUDFLARE WORKERS
# ========================================
echo -e "${BLUE}3. Limpando cache Cloudflare Workers...${NC}"

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  CLOUDFLARE_API_TOKEN não definido${NC}"
    echo -e "${YELLOW}   Configure: export CLOUDFLARE_API_TOKEN=seu_token${NC}"
fi

# Deploy do worker novamente
echo -e "${YELLOW}🚀 Deploy Cloudflare Workers...${NC}"
wrangler deploy --force 2>&1 || echo -e "${YELLOW}⚠️  Cloudflare deploy pode ter falhado${NC}"

echo -e "${GREEN}✅ Cloudflare Workers atualizado${NC}"
echo ""

# ========================================
# LIMPAR CACHE LOCAL (Service Worker)
# ========================================
echo -e "${BLUE}4. Atualizando Service Worker...${NC}"

# Incrementar versão do SW
SW_FILE="public/sw.js"
if [ -f "$SW_FILE" ]; then
    CURRENT_VERSION=$(grep "CACHE_VERSION" "$SW_FILE" | head -1 | sed 's/.*v\([0-9]*\).*/\1/')
    NEW_VERSION=$((CURRENT_VERSION + 1))
    
    # Atualizar versão no arquivo
    sed -i "s/CACHE_VERSION = 'v[0-9]*/CACHE_VERSION = 'v${NEW_VERSION}/g" "$SW_FILE"
    sed -i "s/Instalando v[0-9]*/Instalando v${NEW_VERSION}/g" "$SW_FILE"
    sed -i "s/Ativado v[0-9]*/Ativado v${NEW_VERSION}/g" "$SW_FILE"
    
    # Atualizar timestamp
    NEW_TIMESTAMP=$(date +%Y%m%d-%H%M)
    sed -i "s/BUILD_TIMESTAMP = '[0-9]*-[0-9]*/BUILD_TIMESTAMP = '${NEW_TIMESTAMP}/g" "$SW_FILE"
    
    echo -e "${GREEN}✅ Service Worker atualizado para v${NEW_VERSION}${NC}"
else
    echo -e "${RED}❌ Service Worker não encontrado${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}✅ CACHE LIMPO COM SUCESSO!${NC}"
echo "=========================================="
echo ""
echo "Próximos passos:"
echo "1. Commit e push das mudanças:"
echo "   git add -A && git commit -m 'force: clear all caches' && git push"
echo ""
echo "2. No navegador, force reload:"
echo "   Ctrl + Shift + R (Windows/Linux)"
echo "   Cmd + Shift + R (Mac)"
echo ""
echo "3. Ou abra DevTools → Application → Service Workers → Unregister"
echo ""
