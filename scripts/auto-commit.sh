#!/bin/bash

# Script para commits automáticos com confirmação
# Uso: ./scripts/auto-commit.sh "mensagem do commit"

set -e

# Verificar se há mensagem de commit
if [ -z "$1" ]; then
    echo "❌ Erro: Forneça uma mensagem de commit"
    echo "Uso: ./scripts/auto-commit.sh \"mensagem do commit\""
    exit 1
fi

COMMIT_MESSAGE="$1"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "🚀 Iniciando commit automático..."
echo "📅 Timestamp: $TIMESTAMP"
echo "📝 Mensagem: $COMMIT_MESSAGE"
echo ""

# Adicionar todas as alterações
echo "📦 Adicionando arquivos..."
git add .

# Verificar se há alterações para commit
if git diff --cached --quiet; then
    echo "ℹ️  Nenhuma alteração para commit"
    exit 0
fi

# Mostrar status
echo "📋 Status das alterações:"
git status --porcelain
echo ""

# Confirmar antes de fazer commit
read -p "✅ Confirmar commit? (s/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "❌ Commit cancelado"
    exit 1
fi

# Fazer commit
echo "🔄 Fazendo commit..."
git commit -m "$COMMIT_MESSAGE

🤖 Auto-commit em: $TIMESTAMP"

# Push automático
echo "📤 Enviando para GitHub..."
git push origin main

echo ""
echo "✅ Commit realizado com sucesso!"
echo "🔗 Repositório: https://github.com/CineCasa/CineCasa"
echo "📊 Commit hash: $(git rev-parse --short HEAD)"
