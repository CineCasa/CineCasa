#!/bin/bash
# Script para forçar limpeza de cache e atualização imediata

set -e

echo "🧹 FORÇANDO LIMPEZA DE CACHE E ATUALIZAÇÃO"
echo "============================================"

# Incrementar versão do Service Worker
SW_FILE="public/sw.js"
if [ -f "$SW_FILE" ]; then
    # Extrair versão atual
    CURRENT_VERSION=$(grep "CACHE_VERSION" "$SW_FILE" | grep -o "v[0-9]*" | head -1 | sed 's/v//')
    NEW_VERSION=$((CURRENT_VERSION + 1))
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    
    # Atualizar versão
    sed -i "s/CACHE_VERSION = 'v[0-9]*/CACHE_VERSION = 'v${NEW_VERSION}/g" "$SW_FILE"
    sed -i "s/BUILD_TIMESTAMP = '[0-9]*-[0-9]*/BUILD_TIMESTAMP = '${TIMESTAMP}/g" "$SW_FILE"
    sed -i "s/Instalando v[0-9]*/Instalando v${NEW_VERSION}/g" "$SW_FILE"
    sed -i "s/Ativado v[0-9]*/Ativado v${NEW_VERSION}/g" "$SW_FILE"
    
    echo "✅ Service Worker atualizado: v${CURRENT_VERSION} → v${NEW_VERSION}"
fi

# Adicionar versão ao index.html para forçar recarregamento
INDEX_FILE="index.html"
if [ -f "$INDEX_FILE" ]; then
    # Remover meta tag de versão antiga se existir
    sed -i '/<meta name="app-version"/d' "$INDEX_FILE"
    # Adicionar nova versão
    sed -i "s|<head>|<head>\n    <meta name=\"app-version\" content=\"${TIMESTAMP}\">|" "$INDEX_FILE"
    echo "✅ index.html atualizado com versão ${TIMESTAMP}"
fi

# Commit e push
echo ""
echo "📤 Enviando para GitHub..."
git add -A
git commit -m "force: cache v${NEW_VERSION} - $(date)" || echo "Nada para commitar"
git push origin main

echo ""
echo "✅ FEITO! Aguarde 2-3 minutos para o deploy Vercel"
echo ""
echo "Para limpar cache no navegador:"
echo "1. Acesse: https://cinecasa.vercel.app/clear-cache.html"
echo "2. Ou use: Ctrl + Shift + R (hard reload)"
echo "3. Ou DevTools → Application → Service Workers → Unregister"
echo ""
