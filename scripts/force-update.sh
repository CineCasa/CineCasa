#!/bin/bash
# ========================================
# FORÇAR ATUALIZAÇÃO IMEDIATA - CineCasa
# ========================================
# Uso: ./scripts/force-update.sh
# 
# Este script:
# 1. Atualiza a versão do Service Worker
# 2. Faz commit e push para disparar novo deploy
# 3. Força limpeza de cache no navegador (instruções)

set -e

echo "=========================================="
echo "🚀 FORÇANDO ATUALIZAÇÃO IMEDIATA"
echo "=========================================="
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto"
    exit 1
fi

# ========================================
# 1. ATUALIZAR SERVICE WORKER
# ========================================
echo -e "${BLUE}1. Atualizando Service Worker...${NC}"

SW_FILE="public/sw.js"
if [ -f "$SW_FILE" ]; then
    # Extrair versão atual
    CURRENT_VERSION=$(grep "CACHE_VERSION" "$SW_FILE" | grep -o "v[0-9]*" | head -1 | sed 's/v//')
    NEW_VERSION=$((CURRENT_VERSION + 1))
    NEW_TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    
    # Atualizar arquivo
    sed -i "s/CACHE_VERSION = 'v[0-9]*/CACHE_VERSION = 'v${NEW_VERSION}/g" "$SW_FILE"
    sed -i "s/BUILD_TIMESTAMP = '[0-9]*-[0-9]*/BUILD_TIMESTAMP = '${NEW_TIMESTAMP}/g" "$SW_FILE"
    sed -i "s/Instalando v[0-9]*/Instalando v${NEW_VERSION}/g" "$SW_FILE"
    sed -i "s/Ativado v[0-9]*/Ativado v${NEW_VERSION}/g" "$SW_FILE"
    
    echo -e "${GREEN}   ✅ Service Worker: v${CURRENT_VERSION} → v${NEW_VERSION}${NC}"
else
    echo -e "${YELLOW}   ⚠️  Service Worker não encontrado${NC}"
fi

# ========================================
# 2. ATUALIZAR INDEX.HTML (versão)
# ========================================
echo -e "${BLUE}2. Atualizando versão no index.html...${NC}"

INDEX_FILE="index.html"
if [ -f "$INDEX_FILE" ]; then
    # Adicionar meta tag de versão se não existir
    NEW_META="<meta name=\"app-version\" content=\"${NEW_TIMESTAMP}\">"
    if grep -q "app-version" "$INDEX_FILE"; then
        sed -i "s/<meta name=\"app-version\" content=\"[^\"]*\">/${NEW_META}/g" "$INDEX_FILE"
    else
        # Inserir após <head>
        sed -i "s|<head>|<head>\n    ${NEW_META}|" "$INDEX_FILE"
    fi
    echo -e "${GREEN}   ✅ Versão atualizada: ${NEW_TIMESTAMP}${NC}"
fi

# ========================================
# 3. COMMIT E PUSH
# ========================================
echo ""
echo -e "${BLUE}3. Fazendo commit e push...${NC}"

git add -A
git commit -m "force: update v${NEW_VERSION} - $(date +%Y-%m-%d-%H:%M)" || echo "Nada para commitar"
git push origin main

echo -e "${GREEN}   ✅ Código enviado para o GitHub${NC}"

# ========================================
# 4. INSTRUÇÕES PARA USUÁRIO
# ========================================
echo ""
echo "=========================================="
echo -e "${GREEN}✅ ATUALIZAÇÃO FORÇADA CONCLUÍDA!${NC}"
echo "=========================================="
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo ""
echo "1. Aguarde 2-3 minutos para o deploy Vercel"
echo ""
echo "2. Acesse a página de limpeza de cache:"
echo "   👉 https://cinecasa.vercel.app/clear-cache.html"
echo ""
echo "3. Ou limpe manualmente no navegador:"
echo "   • Abra: https://cinecasa.vercel.app"
echo "   • DevTools (F12) → Application → Service Workers"
echo "   • Clique 'Unregister' no Service Worker"
echo "   • Recarregue: Ctrl + Shift + R"
echo ""
echo "4. Para limpar cache de DNS/Edge:"
echo "   • Windows: ipconfig /flushdns"
echo "   • Mac: sudo killall -HUP mDNSResponder"
echo ""
echo "🔗 Links úteis:"
echo "   • App: https://cinecasa.vercel.app"
echo "   • Clear Cache: https://cinecasa.vercel.app/clear-cache.html"
echo "   • GitHub Actions: https://github.com/CineCasa/CineCasa/actions"
echo ""
