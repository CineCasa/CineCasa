#!/bin/bash

# Script de deploy automatizado com blue-green deployment
set -e

# Configurações
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="$PROJECT_ROOT/.env.deploy"
LOG_FILE="$PROJECT_ROOT/logs/deploy.log"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções de log
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Carregar configurações
load_config() {
    if [[ -f "$CONFIG_FILE" ]]; then
        source "$CONFIG_FILE"
        log "Configurações carregadas de $CONFIG_FILE"
    else
        log_error "Arquivo de configuração não encontrado: $CONFIG_FILE"
        exit 1
    fi
}

# Verificar pré-requisitos
check_prerequisites() {
    log "Verificando pré-requisitos..."
    
    # Verificar Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker não está instalado"
        exit 1
    fi
    
    # Verificar Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose não está instalado"
        exit 1
    fi
    
    # Verificar kubectl se for Kubernetes
    if [[ "$DEPLOY_TARGET" == "kubernetes" ]]; then
        if ! command -v kubectl &> /dev/null; then
            log_error "kubectl não está instalado"
            exit 1
        fi
    fi
    
    # Verificar variáveis de ambiente obrigatórias
    local required_vars=("ENVIRONMENT" "DEPLOY_TARGET" "DOMAIN")
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            log_error "Variável de ambiente obrigatória não definida: $var"
            exit 1
        fi
    done
    
    log_success "Pré-requisitos verificados"
}

# Build da aplicação
build_application() {
    log "Iniciando build da aplicação..."
    
    cd "$PROJECT_ROOT"
    
    # Limpar builds antigos
    docker system prune -f
    
    # Build da imagem
    docker build -t "$IMAGE_NAME:$COMMIT_SHA" .
    docker tag "$IMAGE_NAME:$COMMIT_SHA" "$IMAGE_NAME:latest"
    
    log_success "Build concluído"
}

# Testes automatizados
run_tests() {
    log "Executando testes automatizados..."
    
    cd "$PROJECT_ROOT"
    
    # Testes unitários
    npm run test:unit
    log_success "Testes unitários passaram"
    
    # Testes de integração
    npm run test:integration
    log_success "Testes de integração passaram"
    
    # Testes E2E
    npm run test:e2e
    log_success "Testes E2E passaram"
    
    # Security scan
    npm audit --audit-level=moderate
    log_success "Security scan concluído"
}

# Deploy para staging
deploy_staging() {
    log "Iniciando deploy para staging..."
    
    # Fazer deploy do branch develop
    git checkout develop
    git pull origin develop
    
    # Build
    build_application
    
    # Deploy
    if [[ "$DEPLOY_TARGET" == "docker" ]]; then
        docker-compose -f docker-compose.staging.yml up -d
    elif [[ "$DEPLOY_TARGET" == "kubernetes" ]]; then
        kubectl apply -f k8s/staging/
        kubectl rollout status deployment/cinecasa-staging -n staging
    fi
    
    # Health checks
    run_health_checks "staging"
    
    # Testes no ambiente
    run_staging_tests
    
    log_success "Deploy para staging concluído"
}

# Blue-Green Deployment
deploy_production_blue_green() {
    log "Iniciando blue-green deployment..."
    
    # Determinar ambiente ativo
    local active_env=$(get_active_environment)
    local target_env="blue"
    
    if [[ "$active_env" == "blue" ]]; then
        target_env="green"
    fi
    
    log "Ambiente ativo: $active_env"
    log "Deploy para: $target_env"
    
    # Build da aplicação
    build_application
    
    # Deploy para o ambiente target
    deploy_to_environment "$target_env"
    
    # Health checks no novo ambiente
    run_health_checks "$target_env"
    
    # Smoke tests
    run_smoke_tests "$target_env"
    
    # Switch de tráfego
    switch_traffic "$target_env"
    
    # Health checks pós-switch
    run_health_checks "production"
    
    # Manter ambiente antigo por 30 minutos
    log "Ambiente $active_env mantido por 30 minutos para rollback rápido"
    sleep 1800
    
    # Cleanup do ambiente antigo
    cleanup_old_environment "$active_env"
    
    log_success "Blue-green deployment concluído"
}

# Obter ambiente ativo
get_active_environment() {
    local response=$(curl -s "$ACTIVE_ENV_CHECK_URL" 2>/dev/null || echo "blue")
    echo "$response"
}

# Deploy para ambiente específico
deploy_to_environment() {
    local env="$1"
    log "Deploy para ambiente: $env"
    
    if [[ "$DEPLOY_TARGET" == "docker" ]]; then
        # Variáveis de ambiente específicas
        export ENVIRONMENT_COLOR="$env"
        export DEPLOY_VERSION="$COMMIT_SHA"
        export DEPLOY_TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
        
        # Deploy do ambiente específico
        if [[ "$env" == "green" ]]; then
            docker-compose --profile green up -d app-green
        else
            docker-compose up -d app
        fi
        
        # Aguardar containers estarem prontos
        wait_for_containers "$env"
        
    elif [[ "$DEPLOY_TARGET" == "kubernetes" ]]; then
        # Deploy Kubernetes
        envsubst < k8s/production/deployment.yaml | kubectl apply -f -
        kubectl rollout status deployment/cinecasa-"$env" -n production
        
        # Aguardar pods estarem prontos
        kubectl wait --for=condition=ready pod -l app=cinecasa,env="$env" -n production --timeout=300s
    fi
}

# Aguardar containers estarem prontos
wait_for_containers() {
    local env="$1"
    local container_name="cinecasa-app"
    
    if [[ "$env" == "green" ]]; then
        container_name="cinecasa-app-green"
    fi
    
    log "Aguardando container $container_name estar pronto..."
    
    local timeout=300
    local elapsed=0
    
    while [[ $elapsed -lt $timeout ]]; do
        if docker exec "$container_name" curl -f http://localhost:8080/health &>/dev/null; then
            log_success "Container $container_name está pronto"
            return 0
        fi
        
        sleep 5
        elapsed=$((elapsed + 5))
        echo -n "."
    done
    
    log_error "Timeout aguardando container $container_name"
    return 1
}

# Health checks
run_health_checks() {
    local env="$1"
    local health_url
    
    if [[ "$env" == "staging" ]]; then
        health_url="$STAGING_HEALTH_CHECK_URL"
    else
        health_url="$PRODUCTION_HEALTH_CHECK_URL"
    fi
    
    log "Executando health checks em $env..."
    
    # Health check principal
    if ! curl -f --max-time 30 "$health_url" &>/dev/null; then
        log_error "Health check falhou para $env"
        return 1
    fi
    
    # Health check de APIs
    if ! curl -f --max-time 30 "$health_url/api/health" &>/dev/null; then
        log_error "API health check falhou para $env"
        return 1
    fi
    
    # Health check do Supabase
    if ! curl -f --max-time 30 "$SUPABASE_URL/rest/v1/" &>/dev/null; then
        log_error "Supabase health check falhou para $env"
        return 1
    fi
    
    log_success "Health checks passaram para $env"
}

# Smoke tests
run_smoke_tests() {
    local env="$1"
    log "Executando smoke tests em $env..."
    
    local base_url
    if [[ "$env" == "staging" ]]; then
        base_url="$STAGING_URL"
    else
        base_url="$PRODUCTION_URL"
    fi
    
    # Testes críticos
    npm run test:smoke -- --baseUrl="$base_url"
    
    log_success "Smoke tests passaram para $env"
}

# Switch de tráfego
switch_traffic() {
    local target_env="$1"
    log "Switchando tráfego para $target_env..."
    
    # Atualizar load balancer
    curl -X POST "$LOAD_BALANCER_WEBHOOK" \
        -H "Content-Type: application/json" \
        -d "{
            \"active\": \"$target_env\",
            \"version\": \"$COMMIT_SHA\",
            \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
            \"deployer\": \"$(git config user.name)\"
        }"
    
    # Aguardar propagação
    sleep 30
    
    log_success "Tráfego switchado para $target_env"
}

# Cleanup de ambiente antigo
cleanup_old_environment() {
    local old_env="$1"
    log "Fazendo cleanup do ambiente $old_env..."
    
    if [[ "$DEPLOY_TARGET" == "docker" ]]; then
        if [[ "$old_env" == "green" ]]; then
            docker-compose --profile green down
        else
            docker-compose down app
        fi
    elif [[ "$DEPLOY_TARGET" == "kubernetes" ]]; then
        kubectl delete deployment cinecasa-"$old_env" -n production
    fi
    
    log_success "Cleanup do ambiente $old_env concluído"
}

# Rollback automático
rollback() {
    local reason="$1"
    log "Executando rollback automaticamente..."
    log "Motivo: $reason"
    
    # Obter ambiente ativo
    local active_env=$(get_active_environment)
    local rollback_env="blue"
    
    if [[ "$active_env" == "blue" ]]; then
        rollback_env="green"
    fi
    
    log "Rollback para: $rollback_env"
    
    # Switch de tráfego
    switch_traffic "$rollback_env"
    
    # Health checks
    run_health_checks "production"
    
    # Notificar rollback
    notify_rollback "$reason"
    
    log_success "Rollback concluído"
}

# Notificações
notify_rollback() {
    local reason="$1"
    log "Enviando notificação de rollback..."
    
    # Slack
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        curl -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 Rollback executado! Motivo: $reason\"}"
    fi
    
    # Email
    if [[ -n "$NOTIFICATION_EMAIL" ]]; then
        echo "Rollback executado. Motivo: $reason" | \
            mail -s "CineCasa Rollback" "$NOTIFICATION_EMAIL"
    fi
}

# Monitoramento pós-deploy
post_deploy_monitoring() {
    log "Iniciando monitoramento pós-deploy..."
    
    # Aguardar estabilização
    sleep 300
    
    # Health checks
    run_health_checks "production"
    
    # Performance tests
    run_performance_tests
    
    # Error rate check
    check_error_rates
    
    log_success "Monitoramento pós-deploy concluído"
}

# Performance tests
run_performance_tests() {
    log "Executando performance tests..."
    
    npm run test:performance -- --baseUrl="$PRODUCTION_URL"
    
    log_success "Performance tests concluídos"
}

# Verificar taxas de erro
check_error_rates() {
    log "Verificando taxas de erro..."
    
    local error_rate=$(curl -s "$MONITORING_API_URL/error-rate" 2>/dev/null || echo "0")
    
    if (( $(echo "$error_rate > 5" | bc -l) )); then
        log_error "Alta taxa de erro detectada: $error_rate%"
        rollback "High error rate: $error_rate%"
        return 1
    fi
    
    log_success "Taxa de erro aceitável: $error_rate%"
}

# Função principal
main() {
    local command="${1:-deploy}"
    
    case "$command" in
        "staging")
            load_config
            check_prerequisites
            run_tests
            deploy_staging
            ;;
        "production")
            load_config
            check_prerequisites
            run_tests
            deploy_production_blue_green
            post_deploy_monitoring
            ;;
        "rollback")
            load_config
            rollback "Manual rollback"
            ;;
        "health")
            load_config
            run_health_checks "production"
            ;;
        "monitor")
            load_config
            post_deploy_monitoring
            ;;
        *)
            echo "Uso: $0 {staging|production|rollback|health|monitor}"
            exit 1
            ;;
    esac
}

# Executar função principal
main "$@"
