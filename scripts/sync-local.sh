#!/bin/bash

# Script de sincronização local - mantém ambiente local atualizado
# Monitora mudanças e sincroniza automaticamente
set -e

# Configurações
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_ROOT/logs/sync-local.log"

# Criar diretório de logs se não existir
mkdir -p "$(dirname "$LOG_FILE")"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Funções de log
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[✅ SYNC]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[❌ ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[⚠️ WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${CYAN}[ℹ️ INFO]${NC} $1" | tee -a "$LOG_FILE"
}

# Banner
echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           🔄 CINECASA - SINCRONIZAÇÃO LOCAL                 ║"
echo "║          Auto-sync • Hot-reload • Zero Downtime            ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Verificar se estamos no diretório correto
check_directory() {
    if [ ! -f "package.json" ]; then
        log_error "package.json não encontrado. Execute este script do diretório raiz do projeto."
        exit 1
    fi
}

# Sincronizar com repositório remoto
sync_with_remote() {
    log_info "🔄 Sincronizando com repositório remoto..."
    
    # Verificar se há alterações locais não commitadas
    if ! git diff --quiet || ! git diff --staged --quiet; then
        log_warning "⚠️  Existem alterações locais não commitadas"
        log_info "Fazendo commit automático..."
        
        git add .
        git commit -m "🔄 Auto-sync local: $(date +'%Y-%m-%d %H:%M:%S')

[skip ci]" || log_warning "Nenhuma alteração para commit"
    fi
    
    # Pull do repositório remoto
    log_info "📥 Baixando alterações do remoto..."
    git pull origin main --rebase
    
    log_success "✅ Sincronização com remoto concluída"
}

# Instalar/atualizar dependências
update_dependencies() {
    log_info "📦 Verificando dependências..."
    
    # Verificar se package-lock.json foi modificado
    if [ "package.json" -nt "node_modules" ] || [ ! -d "node_modules" ]; then
        log_info "🔧 Instalando/atualizando dependências..."
        npm install --legacy-peer-deps
        log_success "✅ Dependências atualizadas"
    else
        log_info "✅ Dependências estão atualizadas"
    fi
}

# Build da aplicação
build_application() {
    log_info "🏗️  Compilando aplicação..."
    
    # Build em modo desenvolvimento para maior velocidade
    npm run build:dev
    
    if [ ! -d "dist" ]; then
        log_error "❌ Build falhou - diretório dist não criado"
        exit 1
    fi
    
    log_success "✅ Build concluído"
}

# Iniciar servidor de desenvolvimento
start_dev_server() {
    log_info "🚀 Iniciando servidor de desenvolvimento..."
    
    # Verificar se já existe um servidor rodando
    if lsof -i :3000 > /dev/null 2>&1; then
        log_warning "⚠️  Servidor já rodando na porta 3000"
        log_info "Parando servidor existente..."
        pkill -f "vite.*3000" || true
        sleep 2
    fi
    
    # Iniciar servidor em background
    npm run dev > /dev/null 2>&1 &
    DEV_PID=$!
    
    # Aguardar servidor iniciar
    sleep 5
    
    # Verificar se o servidor está rodando
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        log_success "✅ Servidor de desenvolvimento iniciado (PID: $DEV_PID)"
        log_info "🌐 Acesse: http://localhost:3000"
    else
        log_error "❌ Falha ao iniciar servidor de desenvolvimento"
        kill $DEV_PID 2>/dev/null || true
        exit 1
    fi
}

# Modo watch - monitora alterações
watch_mode() {
    log_info "👁️  Iniciando modo de observação..."
    log_info "Alterações serão sincronizadas automaticamente"
    log_info "Pressione Ctrl+C para parar"
    
    # Loop infinito de verificação
    while true; do
        # Verificar alterações no repositório remoto a cada 30 segundos
        git fetch origin main
        LOCAL=$(git rev-parse HEAD)
        REMOTE=$(git rev-parse origin/main)
        
        if [ "$LOCAL" != "$REMOTE" ]; then
            log_info "🔄 Novas alterações detectadas no repositório"
            sync_with_remote
            update_dependencies
            build_application
            log_success "✅ Ambiente atualizado"
        fi
        
        sleep 30
    done
}

# Modo one-time sync
one_time_sync() {
    log_info "🔄 Executando sincronização única..."
    
    sync_with_remote
    update_dependencies
    build_application
    
    log_success "✅ Sincronização concluída"
}

# Health check do ambiente local
health_check() {
    log_info "🏥 Verificando saúde do ambiente local..."
    
    # Verificar servidor de desenvolvimento
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        log_success "✅ Servidor de desenvolvimento online"
    else
        log_warning "⚠️  Servidor de desenvolvimento offline"
    fi
    
    # Verificar build
    if [ -d "dist" ] && [ -f "dist/index.html" ]; then
        log_success "✅ Build disponível"
    else
        log_warning "⚠️  Build não encontrado"
    fi
    
    # Verificar dependências
    if [ -d "node_modules" ]; then
        log_success "✅ Dependências instaladas"
    else
        log_warning "⚠️  Dependências não instaladas"
    fi
}

# Limpar ambiente
clean_environment() {
    log_info "🧹 Limpando ambiente local..."
    
    # Parar servidor de desenvolvimento
    pkill -f "vite.*3000" || true
    
    # Limpar build
    rm -rf dist
    
    # Limpar logs antigos (manter últimos 7 dias)
    find logs -name "*.log" -mtime +7 -delete 2>/dev/null || true
    
    log_success "✅ Ambiente limpo"
}

# Função principal
main() {
    local command="${1:-sync}"
    local start_server=false
    
    cd "$PROJECT_ROOT"
    check_directory
    
    case "$command" in
        "sync")
            one_time_sync
            ;;
        "watch")
            one_time_sync
            start_server
            watch_mode
            ;;
        "dev")
            one_time_sync
            start_dev_server
            ;;
        "health")
            health_check
            ;;
        "clean")
            clean_environment
            ;;
        "full")
            clean_environment
            one_time_sync
            start_dev_server
            ;;
        --help|-h)
            echo "Uso: $0 [comando]"
            echo ""
            echo "Comandos:"
            echo "  sync     - Sincronização única (padrão)"
            echo "  watch    - Modo de observação contínua"
            echo "  dev      - Sincronizar e iniciar servidor de desenvolvimento"
            echo "  health   - Verificar saúde do ambiente"
            echo "  clean    - Limpar ambiente local"
            echo "  full     - Limpar, sincronizar e iniciar servidor"
            echo "  --help   - Mostrar esta ajuda"
            echo ""
            echo "Exemplos:"
            echo "  $0 sync      # Sincronização única"
            echo "  $0 watch     # Modo observação"
            echo "  $0 dev       # Iniciar servidor"
            exit 0
            ;;
        *)
            log_error "Comando desconhecido: $command"
            echo "Use --help para ver os comandos disponíveis"
            exit 1
            ;;
    esac
}

# Trap para limpeza
trap 'log_info "🛑 Parando sincronização..."; pkill -f "vite.*3000" || true; exit 0' INT TERM

# Executar função principal
main "$@"
