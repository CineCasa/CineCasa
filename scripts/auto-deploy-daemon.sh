#!/bin/bash

# Daemon de deploy automático para CineCasa v4
# Monitora mudanças e faz deploy sem interrupção

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_ROOT/logs/auto-deploy.log"
PID_FILE="$PROJECT_ROOT/.auto-deploy.pid"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Funções de log
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[✅ SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[❌ ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[⚠️ WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Verificar se já está rodando
check_running() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            log_warning "Daemon já rodando com PID $pid"
            exit 1
        else
            rm -f "$PID_FILE"
        fi
    fi
}

# Salvar PID
save_pid() {
    echo $$ > "$PID_FILE"
    trap 'rm -f "$PID_FILE"; exit 0' EXIT INT TERM
}

# Monitorar mudanças
monitor_changes() {
    log "🔍 Iniciando monitoramento de mudanças..."
    
    # Usar inotifywait para monitorar mudanças em tempo real
    while true; do
        inotifywait -r -e modify,create,delete,move \
            --exclude '\.git/|node_modules/|dist/|\.log$|\.pid$' \
            --format '%w%f %e' \
            "$PROJECT_ROOT/src" \
            "$PROJECT_ROOT/public" \
            "$PROJECT_ROOT/package.json" \
            "$PROJECT_ROOT/index.html" \
            "$PROJECT_ROOT/sw.js" \
            2>/dev/null | while read file event; do
            
            # Ignorar mudanças temporárias
            if [[ "$file" =~ \.(tmp|log|pid|swp)$ ]]; then
                continue
            fi
            
            # Aguardar um pouco para agrupar múltiplas mudanças
            sleep 2
            
            log "📝 Mudança detectada: $event em $file"
            
            # Verificar se é uma mudança relevante
            if is_relevant_change "$file"; then
                log "🚀 Iniciando deploy automático..."
                trigger_deploy "$file"
            fi
        done
        
        # Se inotifywait falhar, esperar e tentar novamente
        log_warning "Monitoramento interrompido, reiniciando em 10s..."
        sleep 10
    done
}

# Verificar se mudança é relevante
is_relevant_change() {
    local file="$1"
    
    # Mudanças relevantes
    if [[ "$file" =~ \.(ts|tsx|js|jsx|css|json|html)$ ]]; then
        return 0
    fi
    
    if [[ "$file" =~ (package\.json|index\.html|sw\.js|manifest\.json)$ ]]; then
        return 0
    fi
    
    # Mudanças em diretórios importantes
    if [[ "$file" =~ (src/|public/)$ ]]; then
        return 0
    fi
    
    return 1
}

# Disparar deploy
trigger_deploy() {
    local trigger_file="$1"
    
    log "📦 Gerando trigger de deploy..."
    
    # Criar arquivo de trigger
    echo "{
        \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
        \"trigger_file\": \"$trigger_file\",
        \"auto_deploy\": true,
        \"version\": \"$(date +'%Y%m%d-%H%M%S')\"
    }" > "$PROJECT_ROOT/.deploy-trigger.json"
    
    # Executar script de deploy em background
    (
        cd "$PROJECT_ROOT"
        nohup "$SCRIPT_DIR/update-all-platforms.sh" --skip-github > "$PROJECT_ROOT/logs/deploy-output.log" 2>&1 &
        echo $! > "$PROJECT_ROOT/.deploy-job.pid"
        
        log "🔄 Deploy iniciado em background (PID: $(cat "$PROJECT_ROOT/.deploy-job.pid"))"
    )
    
    # Aguardar um pouco antes de continuar
    sleep 5
}

# Health check do daemon
health_check() {
    log "🏥 Health check do daemon..."
    
    # Verificar se deploy está rodando
    if [ -f "$PROJECT_ROOT/.deploy-job.pid" ]; then
        local deploy_pid=$(cat "$PROJECT_ROOT/.deploy-job.pid")
        if ps -p "$deploy_pid" > /dev/null 2>&1; then
            log "✅ Deploy em andamento (PID: $deploy_pid)"
        else
            log_warning "Deploy finalizado ou falhou"
            rm -f "$PROJECT_ROOT/.deploy-job.pid"
        fi
    fi
    
    # Verificar espaço em disco
    local disk_usage=$(df "$PROJECT_ROOT" | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 90 ]; then
        log_warning "⚠️ Uso de disco alto: ${disk_usage}%"
    fi
    
    # Limpar logs antigos
    find "$PROJECT_ROOT/logs" -name "*.log" -mtime +7 -delete 2>/dev/null || true
}

# Status do daemon
show_status() {
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                    📊 STATUS DO AUTO-DEPLOY                    ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Daemon rodando (PID: $pid)${NC}"
        else
            echo -e "${RED}❌ Daemon não está rodando${NC}"
        fi
    else
        echo -e "${RED}❌ Daemon não está rodando${NC}"
    fi
    
    if [ -f "$PROJECT_ROOT/.deploy-job.pid" ]; then
        local deploy_pid=$(cat "$PROJECT_ROOT/.deploy-job.pid")
        if ps -p "$deploy_pid" > /dev/null 2>&1; then
            echo -e "${YELLOW}⚠️ Deploy em andamento (PID: $deploy_pid)${NC}"
        fi
    fi
    
    echo -e "${CYAN}📁 Log: $LOG_FILE${NC}"
    echo -e "${CYAN}📁 Último deploy: ${PROJECT_ROOT}/logs/deploy-output.log${NC}"
}

# Parar daemon
stop_daemon() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            log "🛑 Parando daemon (PID: $pid)..."
            kill "$pid"
            sleep 2
            
            # Forçar se ainda estiver rodando
            if ps -p "$pid" > /dev/null 2>&1; then
                kill -9 "$pid"
            fi
            
            rm -f "$PID_FILE"
            log_success "✅ Daemon parado"
        else
            log_warning "Daemon não estava rodando"
            rm -f "$PID_FILE"
        fi
    else
        log_warning "Daemon não está rodando"
    fi
}

# Função principal
main() {
    case "${1:-start}" in
        start)
            check_running
            save_pid
            log "🚀 Iniciando daemon de auto-deploy..."
            log "📁 Monitorando: $PROJECT_ROOT"
            log "📝 Log: $LOG_FILE"
            monitor_changes
            ;;
        stop)
            stop_daemon
            ;;
        status)
            show_status
            ;;
        health)
            health_check
            ;;
        restart)
            stop_daemon
            sleep 2
            main start
            ;;
        *)
            echo "Uso: $0 {start|stop|status|health|restart}"
            echo ""
            echo "Comandos:"
            echo "  start   - Inicia daemon de monitoramento"
            echo "  stop    - Para daemon"
            echo "  status  - Mostra status atual"
            echo "  health  - Executa health check"
            echo "  restart - Reinicia daemon"
            exit 1
            ;;
    esac
}

# Criar diretório de logs
mkdir -p "$(dirname "$LOG_FILE")"

# Executar função principal
main "$@"
