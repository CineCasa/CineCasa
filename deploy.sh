#!/bin/bash
# Script de deploy automático para GitHub + Vercel

set -e

echo "🚀 Iniciando deploy automático..."

# Verificar se há alterações
if [ -z "$(git status --porcelain)" ]; then
    echo "✅ Nenhuma alteração para commitar"
    exit 0
fi

# Adicionar todas as alterações
echo "📦 Adicionando arquivos..."
git add -A

# Criar commit com timestamp
COMMIT_MSG="🤖 Auto-deploy: $(date '+%Y-%m-%d %H:%M:%S')"
echo "💾 Criando commit: $COMMIT_MSG"
git commit -m "$COMMIT_MSG" || true

# Push para GitHub
echo "⬆️  Enviando para GitHub..."
git push origin main

echo "✅ Deploy iniciado!"
echo "📊 Acompanhe em: https://github.com/CineCasa/CineCasa/actions"
