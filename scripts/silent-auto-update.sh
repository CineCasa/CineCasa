#!/bin/bash

# Sistema de Atualização Silenciosa e Automática
# Funciona em background sem intervenção do usuário
# Zero downtime, zero notificações, zero ações necessárias
set -e

# Configurações
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_ROOT/logs/silent-updates.log"
PID_FILE="$PROJECT_ROOT/.silent-update.pid"
LOCK_FILE="$PROJECT_ROOT/.silent-update.lock"

# Criar diretório de logs se não existir
mkdir -p "$(dirname "$LOG_FILE")"

# Configurações silenciosas
SILENT_MODE=true
NO_NOTIFICATIONS=true
ZERO_DOWNTIME=true
AUTO_RECOVERY=true

# IDs das plataformas
VERCEL_PROJECT_ID="prj_0bqSB8wLnBeewfMawndo8tSEbR8U"

# Cores (apenas para logs, não para usuário)
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Função de log silencioso
log_silent() {
    if [ "$SILENT_MODE" = "true" ]; then
        echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
    fi
}

# Verificar se já está rodando
check_running() {
    if [ -f "$PID_FILE" ]; then
        local old_pid=$(cat "$PID_FILE")
        if kill -0 "$old_pid" 2>/dev/null; then
            log_silent "Processo já rodando (PID: $old_pid)"
            exit 0
        else
            rm -f "$PID_FILE"
        fi
    fi
    
    # Criar lock
    if [ -f "$LOCK_FILE" ]; then
        log_silent "Lock file existe, saindo"
        exit 0
    fi
    
    echo $$ > "$PID_FILE"
    touch "$LOCK_FILE"
}

# Cleanup ao sair
cleanup() {
    rm -f "$PID_FILE" "$LOCK_FILE"
    exit 0
}

trap cleanup EXIT INT TERM

# Verificar alterações silenciosamente
check_silent_changes() {
    cd "$PROJECT_ROOT"
    
    # Verificar se há alterações no repositório
    git fetch origin main --quiet 2>/dev/null || return 1
    
    local local_commit=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
    local remote_commit=$(git rev-parse origin/main 2>/dev/null || echo "unknown")
    
    if [ "$local_commit" != "$remote_commit" ]; then
        log_silent "Novas alterações detectadas: $remote_commit"
        return 0
    fi
    
    return 1
}

# Build silencioso
silent_build() {
    cd "$PROJECT_ROOT"
    
    log_silent "Iniciando build silencioso..."
    
    # Build sem output
    npm run build > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        log_silent "Build silencioso concluído"
        return 0
    else
        log_silent "Build falhou, tentando recovery"
        return 1
    fi
}

# Deploy silencioso para Vercel
silent_deploy_vercel() {
    cd "$PROJECT_ROOT"
    
    log_silent "Iniciando deploy silencioso para Vercel..."
    
    # Deploy sem interação
    vercel --prod --yes > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        log_silent "Deploy Vercel concluído"
        return 0
    else
        log_silent "Deploy Vercel falhou"
        return 1
    fi
}

# Deploy silencioso para Cloudflare
silent_deploy_cloudflare() {
    cd "$PROJECT_ROOT"
    
    log_silent "Iniciando deploy silencioso para Cloudflare..."
    
    # Deploy sem interação
    wrangler pages deploy dist --project-name=cinecasa --branch=main > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        log_silent "Deploy Cloudflare concluído"
        return 0
    else
        log_silent "Deploy Cloudflare falhou"
        return 1
    fi
}

# Deploy silencioso para GitHub Pages
silent_deploy_github_pages() {
    cd "$PROJECT_ROOT"
    
    log_silent "Iniciando deploy silencioso para GitHub Pages..."
    
    # Deploy sem interação
    npm run deploy:github-pages > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        log_silent "Deploy GitHub Pages concluído"
        return 0
    else
        log_silent "Deploy GitHub Pages falhou"
        return 1
    fi
}

# Cache invalidation silenciosa
silent_cache_invalidation() {
    log_silent "Iniciando cache invalidation silenciosa..."
    
    # Vercel cache purge
    curl -X POST "https://api.vercel.com/v3/projects/$VERCEL_PROJECT_ID/cache" \
        -H "Authorization: Bearer $VERCEL_TOKEN" \
        -H "Content-Type: application/json" \
        --data '{"action": "revalidate"}" > /dev/null 2>&1 &
    
    # Cloudflare cache purge (se disponível)
    if [ -n "$CLOUDFLARE_ZONE_ID" ] && [ -n "$CLOUDFLARE_API_TOKEN" ]; then
        curl -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/purge_cache" \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            -H "Content-Type: application/json" \
            --data '{"purge_everything":true}' > /dev/null 2>&1 &
    fi
    
    log_silent "Cache invalidation iniciada"
}

# Verificação silenciosa de saúde
silent_health_check() {
    local urls=(
        "https://cinecasa.vercel.app"
        "https://cinecasa.pages.dev"
        "https://kassiaavilla.github.io/cinecasa/"
    )
    
    for url in "${urls[@]}"; do
        # Verificação silenciosa com timeout curto
        if timeout 5 curl -f -s "$url" > /dev/null 2>&1; then
            log_silent "Health check OK: $url"
        else
            log_silent "Health check falhou: $url"
        fi
    done
}

# Recuperação automática
auto_recovery() {
    log_silent "Iniciando recuperação automática..."
    
    cd "$PROJECT_ROOT"
    
    # Reset para estado seguro
    git reset --hard HEAD~1 > /dev/null 2>&1 || true
    git clean -fd > /dev/null 2>&1 || true
    
    # Tentar build novamente
    if silent_build; then
        log_silent "Recuperação automática bem-sucedida"
        return 0
    else
        log_silent "Recuperação automática falhou"
        return 1
    fi
}

# Processo principal de atualização silenciosa
silent_update_process() {
    log_silent "Iniciando processo de atualização silenciosa"
    
    # Verificar alterações
    if ! check_silent_changes; then
        log_silent "Nenhuma alteração detectada"
        return 0
    fi
    
    # Fazer pull das alterações
    cd "$PROJECT_ROOT"
    git pull origin main --quiet > /dev/null 2>&1 || {
        log_silent "Falha no git pull, tentando recovery"
        auto_recovery
        return 1
    }
    
    # Build
    if ! silent_build; then
        log_silent "Build falhou, tentando recovery"
        auto_recovery
        return 1
    fi
    
    # Deploy paralelo silencioso
    log_silent "Iniciando deploys paralelos..."
    
    # Deploy em background para não bloquear
    silent_deploy_vercel &
    local vercel_pid=$!
    
    silent_deploy_cloudflare &
    local cloudflare_pid=$!
    
    silent_deploy_github_pages &
    local github_pid=$!
    
    # Aguardar deploys (com timeout)
    local timeout=300  # 5 minutos
    local elapsed=0
    
    while [ $elapsed -lt $timeout ]; do
        if ! kill -0 $vercel_pid 2>/dev/null && \
           ! kill -0 $cloudflare_pid 2>/dev/null && \
           ! kill -0 $github_pid 2>/dev/null; then
            break
        fi
        sleep 5
        elapsed=$((elapsed + 5))
    done
    
    # Forçar término se necessário
    kill $vercel_pid $cloudflare_pid $github_pid 2>/dev/null || true
    
    # Cache invalidation
    silent_cache_invalidation
    
    # Health check
    sleep 10  # Aguardar um pouco para propagação
    silent_health_check
    
    log_silent "Processo de atualização silenciosa concluído"
}

# Modo daemon - rodar continuamente
daemon_mode() {
    log_silent "Iniciando modo daemon"
    
    while true; do
        # Verificar a cada 5 minutos
        sleep 300
        
        # Executar atualização silenciosa
        silent_update_process
        
        # Limpar logs antigos (manter 7 dias)
        find "$(dirname "$LOG_FILE")" -name "*.log" -mtime +7 -delete 2>/dev/null || true
    done
}

# Instalar serviço automático (systemd)
install_systemd_service() {
    local service_file="/etc/systemd/system/cinecasa-silent-update.service"
    
    if [ "$EUID" -eq 0 ]; then
        cat > "$service_file" << EOF
[Unit]
Description=CineCasa Silent Auto-Update Service
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$PROJECT_ROOT
ExecStart=$SCRIPT_DIR/silent-auto-update.sh --daemon
Restart=always
RestartSec=30
Environment=NODE_ENV=production
Environment=SILENT_MODE=true

[Install]
WantedBy=multi-user.target
EOF
        
        systemctl daemon-reload
        systemctl enable cinecasa-silent-update
        systemctl start cinecasa-silent-update
        
        log_silent "Serviço systemd instalado e iniciado"
    else
        log_silent "Precisa de root para instalar serviço systemd"
    fi
}

# Função principal
main() {
    local command="${1:-daemon}"
    
    # Verificar se já está rodando
    check_running
    
    case "$command" in
        "daemon")
            daemon_mode
            ;;
        "once")
            silent_update_process
            ;;
        "install")
            install_systemd_service
            ;;
        "status")
            if [ -f "$PID_FILE" ]; then
                echo "Silent update running (PID: $(cat "$PID_FILE"))"
            else
                echo "Silent update not running"
            fi
            ;;
        "stop")
            if [ -f "$PID_FILE" ]; then
                kill $(cat "$PID_FILE")
                rm -f "$PID_FILE" "$LOCK_FILE"
                echo "Silent update stopped"
            fi
            ;;
        --help|-h)
            echo "Uso: $0 [comando]"
            echo ""
            echo "Comandos:"
            echo "  daemon    - Modo daemon (padrão)"
            echo "  once      - Executar uma vez"
            echo "  install   - Instalar como serviço systemd"
            echo "  status    - Verificar status"
            echo "  stop      - Parar serviço"
            echo "  --help    - Mostrar ajuda"
            exit 0
            ;;
        *)
            echo "Comando desconhecido: $command"
            exit 1
            ;;
    esac
}

# Executar função principal
main "$@"
