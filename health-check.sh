#!/bin/sh

# Health check script para o container
set -e

# Verificar se o Nginx está rodando
if ! pgrep nginx > /dev/null; then
    echo "❌ Nginx is not running"
    exit 1
fi

# Verificar se a porta está respondendo
if ! curl -f -s http://localhost:8080/health > /dev/null; then
    echo "❌ Health check endpoint failed"
    exit 1
fi

# Verificar se os arquivos essenciais existem
if [ ! -f /usr/share/nginx/html/index.html ]; then
    echo "❌ index.html not found"
    exit 1
fi

if [ ! -f /usr/share/nginx/html/manifest.json ]; then
    echo "❌ manifest.json not found"
    exit 1
fi

# Verificar se o Service Worker está disponível
if [ ! -f /usr/share/nginx/html/sw.js ]; then
    echo "❌ Service worker not found"
    exit 1
fi

# Verificar espaço em disco
DISK_USAGE=$(df /usr/share/nginx/html | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    echo "⚠️ Disk usage is high: ${DISK_USAGE}%"
fi

# Verificar uso de memória
MEM_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ "$MEM_USAGE" -gt 85 ]; then
    echo "⚠️ Memory usage is high: ${MEM_USAGE}%"
fi

# Verificar conexões ativas
CONNECTIONS=$(netstat -an | grep :8080 | grep ESTABLISHED | wc -l)
if [ "$CONNECTIONS" -gt 1000 ]; then
    echo "⚠️ High number of connections: $CONNECTIONS"
fi

echo "✅ All health checks passed"
exit 0
