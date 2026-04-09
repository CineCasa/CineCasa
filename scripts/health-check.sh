#!/bin/bash

# Health check abrangente para a aplicação
set -e

# Configurações
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="$PROJECT_ROOT/.env.deploy"
LOG_FILE="$PROJECT_ROOT/logs/health-check.log"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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
    else
        log_error "Arquivo de configuração não encontrado: $CONFIG_FILE"
        exit 1
    fi
}

# Health check da aplicação
check_application() {
    log "Verificando saúde da aplicação..."
    
    local health_url="$1"
    local timeout="${2:-30}"
    
    # Verificar se a URL responde
    if ! curl -f --max-time "$timeout" "$health_url" &>/dev/null; then
        log_error "Application health check failed: $health_url"
        return 1
    fi
    
    # Verificar conteúdo da resposta
    local response=$(curl -s --max-time "$timeout" "$health_url")
    if [[ "$response" != *"healthy"* ]]; then
        log_error "Application health check response invalid: $response"
        return 1
    fi
    
    log_success "Application health check passed"
    return 0
}

# Health check de APIs
check_apis() {
    log "Verificando saúde das APIs..."
    
    # API principal
    if ! curl -f --max-time 30 "$API_HEALTH_URL" &>/dev/null; then
        log_error "API health check failed: $API_HEALTH_URL"
        return 1
    fi
    
    # Verificar endpoints críticos
    local endpoints=("/health" "/api/health" "/api/status")
    for endpoint in "${endpoints[@]}"; do
        local url="$BASE_URL$endpoint"
        if ! curl -f --max-time 10 "$url" &>/dev/null; then
            log_error "API endpoint health check failed: $url"
            return 1
        fi
    done
    
    log_success "API health checks passed"
    return 0
}

# Health check do banco de dados
check_database() {
    log "Verificando saúde do banco de dados..."
    
    if [[ "$DEPLOY_TARGET" == "docker" ]]; then
        # Verificar container PostgreSQL
        if ! docker exec cinecasa-postgres pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" &>/dev/null; then
            log_error "PostgreSQL health check failed"
            return 1
        fi
        
        # Verificar conexões
        local connections=$(docker exec cinecasa-postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT count(*) FROM pg_stat_activity;")
        if [[ "$connections" -gt 100 ]]; then
            log_warning "High number of database connections: $connections"
        fi
        
    elif [[ "$DEPLOY_TARGET" == "kubernetes" ]]; then
        # Verificar pod PostgreSQL
        if ! kubectl exec -n production deployment/cinecasa-postgres -- pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" &>/dev/null; then
            log_error "PostgreSQL health check failed"
            return 1
        fi
    fi
    
    log_success "Database health check passed"
    return 0
}

# Health check do Redis
check_redis() {
    log "Verificando saúde do Redis..."
    
    if [[ "$DEPLOY_TARGET" == "docker" ]]; then
        if ! docker exec cinecasa-redis redis-cli ping &>/dev/null; then
            log_error "Redis health check failed"
            return 1
        fi
        
        # Verificar uso de memória
        local memory_info=$(docker exec cinecasa-redis redis-cli info memory)
        local used_memory=$(echo "$memory_info" | grep "used_memory:" | cut -d: -f2 | tr -d '\r')
        local max_memory=$(echo "$memory_info" | grep "maxmemory:" | cut -d: -f2 | tr -d '\r')
        
        if [[ -n "$max_memory" && "$max_memory" != "0" ]]; then
            local usage_percent=$((used_memory * 100 / max_memory))
            if [[ "$usage_percent" -gt 90 ]]; then
                log_warning "Redis memory usage high: ${usage_percent}%"
            fi
        fi
        
    elif [[ "$DEPLOY_TARGET" == "kubernetes" ]]; then
        if ! kubectl exec -n production deployment/cinecasa-redis -- redis-cli ping &>/dev/null; then
            log_error "Redis health check failed"
            return 1
        fi
    fi
    
    log_success "Redis health check passed"
    return 0
}

# Health check do Supabase
check_supabase() {
    log "Verificando saúde do Supabase..."
    
    # Verificar REST API
    if ! curl -f --max-time 30 "$SUPABASE_URL/rest/v1/" &>/dev/null; then
        log_error "Supabase REST API health check failed"
        return 1
    fi
    
    # Verificar Auth API
    if ! curl -f --max-time 30 "$SUPABASE_URL/auth/v1/" &>/dev/null; then
        log_error "Supabase Auth API health check failed"
        return 1
    fi
    
    # Verificar Storage API
    if ! curl -f --max-time 30 "$SUPABASE_URL/storage/v1/" &>/dev/null; then
        log_error "Supabase Storage API health check failed"
        return 1
    fi
    
    log_success "Supabase health checks passed"
    return 0
}

# Health check de recursos do sistema
check_system_resources() {
    log "Verificando recursos do sistema..."
    
    if [[ "$DEPLOY_TARGET" == "docker" ]]; then
        # Verificar uso de CPU
        local cpu_usage=$(docker stats --no-stream --format "table {{.CPUPerc}}" cinecasa-app | tail -n 1 | sed 's/%//')
        if [[ "${cpu_usage%.*}" -gt 80 ]]; then
            log_warning "High CPU usage: ${cpu_usage}%"
        fi
        
        # Verificar uso de memória
        local mem_usage=$(docker stats --no-stream --format "table {{.MemPerc}}" cinecasa-app | tail -n 1 | sed 's/%//')
        if [[ "${mem_usage%.*}" -gt 85 ]]; then
            log_warning "High memory usage: ${mem_usage}%"
        fi
        
        # Verificar espaço em disco
        local disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
        if [[ "$disk_usage" -gt 90 ]]; then
            log_warning "High disk usage: ${disk_usage}%"
        fi
        
    elif [[ "$DEPLOY_TARGET" == "kubernetes" ]]; then
        # Verificar pods
        local pod_status=$(kubectl get pods -n production -l app=cinecasa -o jsonpath='{.items[*].status.phase}')
        if echo "$pod_status" | grep -q "Pending\|Failed\|CrashLoopBackOff"; then
            log_error "Unhealthy pod states detected: $pod_status"
            return 1
        fi
        
        # Verificar nodes
        local node_status=$(kubectl get nodes -o jsonpath='{.items[*].status.conditions[?(@.type=="Ready")].status}')
        if echo "$node_status" | grep -q "False"; then
            log_error "Unhealthy nodes detected"
            return 1
        fi
    fi
    
    log_success "System resources check passed"
    return 0
}

# Health check de SSL/TLS
check_ssl_certificates() {
    log "Verificando certificados SSL/TLS..."
    
    local domain="$DOMAIN"
    local port="${SSL_PORT:-443}"
    
    # Verificar validade do certificado
    local expiry_date=$(echo | openssl s_client -servername "$domain" -connect "$domain:$port" 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)
    local expiry_timestamp=$(date -d "$expiry_date" +%s)
    local current_timestamp=$(date +%s)
    local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
    
    if [[ "$days_until_expiry" -lt 30 ]]; then
        log_error "SSL certificate expires in $days_until_expiry days"
        return 1
    elif [[ "$days_until_expiry" -lt 60 ]]; then
        log_warning "SSL certificate expires in $days_until_expiry days"
    fi
    
    log_success "SSL certificates check passed"
    return 0
}

# Health check de performance
check_performance() {
    log "Verificando métricas de performance..."
    
    # Tempo de resposta
    local response_time=$(curl -o /dev/null -s -w '%{time_total}' --max-time 30 "$BASE_URL")
    if (( $(echo "$response_time > 5" | bc -l) )); then
        log_warning "Slow response time: ${response_time}s"
    fi
    
    # Tamanho da página
    local page_size=$(curl -s --max-time 30 "$BASE_URL" | wc -c)
    if [[ "$page_size" -gt 2097152 ]]; then  # 2MB
        log_warning "Large page size: $((page_size / 1024))KB"
    fi
    
    # Verificar se há erros 5xx
    local status_code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 "$BASE_URL")
    if [[ "$status_code" -ge 500 ]]; then
        log_error "Server error detected: $status_code"
        return 1
    fi
    
    log_success "Performance checks passed"
    return 0
}

# Health check de dependências externas
check_external_dependencies() {
    log "Verificando dependências externas..."
    
    # TMDB API
    if ! curl -f --max-time 10 "https://api.themoviedb.org/3/movie/550?api_key=$TMDB_API_KEY" &>/dev/null; then
        log_error "TMDB API health check failed"
        return 1
    fi
    
    # CDN de imagens
    if ! curl -f --max-time 10 "https://image.tmdb.org/t/p/w500/wwemzKWzjKYJFfCeiB57q3r4Bcm.png" &>/dev/null; then
        log_error "TMDB image CDN health check failed"
        return 1
    fi
    
    log_success "External dependencies check passed"
    return 0
}

# Gerar relatório de saúde
generate_health_report() {
    log "Gerando relatório de saúde..."
    
    local report_file="$PROJECT_ROOT/logs/health-report-$(date +%Y%m%d-%H%M%S).json"
    
    cat > "$report_file" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "environment": "$ENVIRONMENT",
  "version": "$COMMIT_SHA",
  "checks": {
    "application": $([ -n "$APP_HEALTH_PASSED" ] && echo "true" || echo "false"),
    "apis": $([ -n "$API_HEALTH_PASSED" ] && echo "true" || echo "false"),
    "database": $([ -n "$DB_HEALTH_PASSED" ] && echo "true" || echo "false"),
    "redis": $([ -n "$REDIS_HEALTH_PASSED" ] && echo "true" || echo "false"),
    "supabase": $([ -n "$SUPABASE_HEALTH_PASSED" ] && echo "true" || echo "false"),
    "system_resources": $([ -n "$SYSTEM_HEALTH_PASSED" ] && echo "true" || echo "false"),
    "ssl_certificates": $([ -n "$SSL_HEALTH_PASSED" ] && echo "true" || echo "false"),
    "performance": $([ -n "$PERFORMANCE_HEALTH_PASSED" ] && echo "true" || echo "false"),
    "external_dependencies": $([ -n "$EXTERNAL_HEALTH_PASSED" ] && echo "true" || echo "false")
  },
  "metrics": {
    "response_time": "$RESPONSE_TIME",
    "page_size": "$PAGE_SIZE",
    "disk_usage": "$DISK_USAGE",
    "memory_usage": "$MEMORY_USAGE",
    "cpu_usage": "$CPU_USAGE"
  }
}
EOF
    
    log_success "Health report generated: $report_file"
}

# Função principal
main() {
    local check_type="${1:-full}"
    
    load_config
    
    case "$check_type" in
        "application")
            check_application "$BASE_URL"
            APP_HEALTH_PASSED="true"
            ;;
        "apis")
            check_apis
            API_HEALTH_PASSED="true"
            ;;
        "database")
            check_database
            DB_HEALTH_PASSED="true"
            ;;
        "redis")
            check_redis
            REDIS_HEALTH_PASSED="true"
            ;;
        "supabase")
            check_supabase
            SUPABASE_HEALTH_PASSED="true"
            ;;
        "system")
            check_system_resources
            SYSTEM_HEALTH_PASSED="true"
            ;;
        "ssl")
            check_ssl_certificates
            SSL_HEALTH_PASSED="true"
            ;;
        "performance")
            check_performance
            PERFORMANCE_HEALTH_PASSED="true"
            RESPONSE_TIME="$response_time"
            PAGE_SIZE="$page_size"
            ;;
        "external")
            check_external_dependencies
            EXTERNAL_HEALTH_PASSED="true"
            ;;
        "full")
            # Executar todos os checks
            if check_application "$BASE_URL"; then
                APP_HEALTH_PASSED="true"
            fi
            
            if check_apis; then
                API_HEALTH_PASSED="true"
            fi
            
            if check_database; then
                DB_HEALTH_PASSED="true"
            fi
            
            if check_redis; then
                REDIS_HEALTH_PASSED="true"
            fi
            
            if check_supabase; then
                SUPABASE_HEALTH_PASSED="true"
            fi
            
            if check_system_resources; then
                SYSTEM_HEALTH_PASSED="true"
            fi
            
            if check_ssl_certificates; then
                SSL_HEALTH_PASSED="true"
            fi
            
            if check_performance; then
                PERFORMANCE_HEALTH_PASSED="true"
            fi
            
            if check_external_dependencies; then
                EXTERNAL_HEALTH_PASSED="true"
            fi
            
            generate_health_report
            
            # Verificar se todos os checks passaram
            if [[ "$APP_HEALTH_PASSED" == "true" && \
                  "$API_HEALTH_PASSED" == "true" && \
                  "$DB_HEALTH_PASSED" == "true" && \
                  "$REDIS_HEALTH_PASSED" == "true" && \
                  "$SUPABASE_HEALTH_PASSED" == "true" && \
                  "$SYSTEM_HEALTH_PASSED" == "true" && \
                  "$SSL_HEALTH_PASSED" == "true" && \
                  "$PERFORMANCE_HEALTH_PASSED" == "true" && \
                  "$EXTERNAL_HEALTH_PASSED" == "true" ]]; then
                log_success "All health checks passed ✅"
                exit 0
            else
                log_error "Some health checks failed ❌"
                exit 1
            fi
            ;;
        *)
            echo "Uso: $0 {application|apis|database|redis|supabase|system|ssl|performance|external|full}"
            exit 1
            ;;
    esac
}

# Executar função principal
main "$@"
