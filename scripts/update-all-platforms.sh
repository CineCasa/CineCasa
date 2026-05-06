#!/bin/bash

# Script de atualização unificada para todas as plataformas
# Vercel, GitHub, Cloudflare Workers e ambiente local
set -e

# Configurações
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_ROOT/logs/update-all.log"

# Criar diretório de logs se não existir
mkdir -p "$(dirname "$LOG_FILE")"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# IDs das plataformas
VERCEL_PROJECT_ID="prj_0bqSB8wLnBeewfMawndo8tSEbR8U"
GITHUB_REPO="kassiaavilla/cinecasa"
CLOUDFLARE_PROJECT="cinecasa"

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

log_info() {
    echo -e "${CYAN}[ℹ️ INFO]${NC} $1" | tee -a "$LOG_FILE"
}

# Banner
echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           🚀 CINECASA - ATUALIZAÇÃO MULTI-PLATAFORMA        ║"
echo "║    Vercel • GitHub • Cloudflare • Local • Zero Downtime     ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Verificar pré-requisitos
check_prerequisites() {
    log "🔍 Verificando pré-requisitos..."
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js não está instalado"
        exit 1
    fi
    
    # Verificar npm
    if ! command -v npm &> /dev/null; then
        log_error "npm não está instalado"
        exit 1
    fi
    
    # Verificar Git
    if ! command -v git &> /dev/null; then
        log_error "Git não está instalado"
        exit 1
    fi
    
    # Verificar Vercel CLI
    if ! command -v vercel &> /dev/null; then
        log_warning "Vercel CLI não encontrado. Instalando..."
        npm install -g vercel
    fi
    
    # Verificar Wrangler
    if ! command -v wrangler &> /dev/null; then
        log_warning "Wrangler não encontrado. Instalando..."
        npm install -g wrangler
    fi
    
    log_success "✅ Pré-requisitos verificados"
}

# Gerar versão do build
generate_version() {
    log "📦 Gerando versão do build..."
    
    VERSION=$(date +'%Y%m%d-%H%M%S')-$(git rev-parse --short HEAD)
    BUILD_HASH=$(echo -n "$VERSION" | sha256sum | cut -d' ' -f1 | head -c 16)
    TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    
    export VERSION="$VERSION"
    export BUILD_HASH="$BUILD_HASH"
    export TIMESTAMP="$TIMESTAMP"
    
    # Criar arquivo de versão
    echo "{\"version\": \"$VERSION\", \"hash\": \"$BUILD_HASH\", \"timestamp\": \"$TIMESTAMP\"}" > "$PROJECT_ROOT/public/version.json"
    
    log_success "Versão gerada: $VERSION"
    log_info "Build hash: $BUILD_HASH"
}

# Build local
build_local() {
    log "🔨 Fazendo build local..."
    
    cd "$PROJECT_ROOT"
    
    # Limpar node_modules e reinstalar
    log "🧹 Limpando dependências..."
    rm -rf node_modules
    npm install --legacy-peer-deps
    
    # Build da aplicação
    log "🏗️  Compilando aplicação..."
    npm run build
    
    # Verificar se o build foi criado
    if [ ! -d "dist" ]; then
        log_error "Diretório dist não foi criado"
        exit 1
    fi
    
    log_success "✅ Build local concluído"
}

# Atualizar repositório GitHub
update_github() {
    log "📤 Atualizando repositório GitHub..."
    
    cd "$PROJECT_ROOT"
    
    # Adicionar todas as alterações
    git add .
    
    # Commit com versão
    git commit -m "🚀 Auto-update: $VERSION

- Build version: $VERSION
- Build hash: $BUILD_HASH
- Timestamp: $TIMESTAMP
- Platforms: Vercel, Cloudflare, GitHub Pages

[skip ci]" || log_warning "Nenhuma alteração para commit"
    
    # Push para GitHub
    git push origin main
    
    log_success "✅ GitHub atualizado"
}

# Deploy para Vercel
deploy_vercel() {
    log "🌐 Fazendo deploy para Vercel..."
    
    cd "$PROJECT_ROOT"
    
    # Deploy para Vercel
    vercel --prod --confirm
    
    # Limpar cache
    log "🧹 Limpando cache Vercel..."
    curl -X POST "https://api.vercel.com/v3/projects/$VERCEL_PROJECT_ID/cache" \
        -H "Authorization: Bearer $VERCEL_TOKEN" \
        -H "Content-Type: application/json" \
        --data '{"action": "revalidate"}' 2>/dev/null || log_warning "Cache purge falhou"
    
    log_success "✅ Vercel deploy concluído: https://cinecasa.vercel.app"
}

# Deploy para Cloudflare
deploy_cloudflare() {
    log "☁️  Fazendo deploy para Cloudflare..."
    
    cd "$PROJECT_ROOT"
    
    # Deploy para Cloudflare Pages
    wrangler pages deploy dist --project-name="$CLOUDFLARE_PROJECT" --branch=main
    
    # Limpar cache
    log "🧹 Limpando cache Cloudflare..."
    if [ -n "$CLOUDFLARE_ZONE_ID" ] && [ -n "$CLOUDFLARE_API_TOKEN" ]; then
        curl -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/purge_cache" \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            -H "Content-Type: application/json" \
            --data '{"purge_everything":true}' 2>/dev/null || log_warning "Cache purge falhou"
    fi
    
    log_success "✅ Cloudflare deploy concluído: https://cinecasa.pages.dev"
}

# Deploy para GitHub Pages
deploy_github_pages() {
    log "📄 Fazendo deploy para GitHub Pages..."
    
    cd "$PROJECT_ROOT"
    
    # Usar script do package.json
    npm run deploy:github-pages
    
    log_success "✅ GitHub Pages deploy concluído: https://kassiaavilla.github.io/cinecasa/"
}

# Verificar deployments
verify_deployments() {
    log "🔍 Verificando deployments..."
    
    local urls=(
        "https://cinecasa.vercel.app"
        "https://cinecasa.pages.dev"
        "https://kassiaavilla.github.io/cinecasa/"
    )
    
    for url in "${urls[@]}"; do
        log_info "Verificando: $url"
        if curl -f -s -m 10 "$url" > /dev/null; then
            log_success "✅ $url - Online"
        else
            log_warning "⚠️  $url - Falhou verificação"
        fi
        sleep 2
    done
}

# Health checks
run_health_checks() {
    log "🏥 Executando health checks..."
    
    # Verificar se os arquivos críticos existem
    local critical_files=(
        "dist/index.html"
        "dist/assets"
        "public/version.json"
    )
    
    for file in "${critical_files[@]}"; do
        if [ -f "$file" ] || [ -d "$file" ]; then
            log_success "✅ $file existe"
        else
            log_error "❌ $file não encontrado"
        fi
    done
}

# Relatório final
generate_report() {
    log "📊 Gerando relatório final..."
    
    echo -e "\n${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                    📋 RELATÓRIO DE ATUALIZAÇÃO                 ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo -e "${GREEN}✅ Versão:${NC} $VERSION"
    echo -e "${GREEN}✅ Hash:${NC} $BUILD_HASH"
    echo -e "${GREEN}✅ Timestamp:${NC} $TIMESTAMP"
    echo ""
    echo -e "${CYAN}🌐 PLATAFORMAS ATUALIZADAS:${NC}"
    echo -e "${GREEN}  • Vercel:${NC} https://cinecasa.vercel.app"
    echo -e "${GREEN}  • Cloudflare:${NC} https://cinecasa.pages.dev"
    echo -e "${GREEN}  • GitHub Pages:${NC} https://kassiaavilla.github.io/cinecasa/"
    echo -e "${GREEN}  • GitHub Repo:${NC} https://github.com/$GITHUB_REPO"
    echo ""
    echo -e "${CYAN}📁 Arquivos gerados:${NC}"
    echo -e "${GREEN}  • Build:${NC} dist/"
    echo -e "${GREEN}  • Version:${NC} public/version.json"
    echo -e "${GREEN}  • Log:${NC} $LOG_FILE"
    echo ""
    echo -e "${GREEN}🎉 ATUALIZAÇÃO CONCLUÍDA COM SUCESSO!${NC}"
    echo -e "${YELLOW}⏱️  Aguarde 2-3 minutos para propagação completa...${NC}"
}

# Função principal
main() {
    local start_time=$(date +%s)
    
    # Verificar argumentos
    local skip_github=false
    local skip_vercel=false
    local skip_cloudflare=false
    local skip_build=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-github)
                skip_github=true
                shift
                ;;
            --skip-vercel)
                skip_vercel=true
                shift
                ;;
            --skip-cloudflare)
                skip_cloudflare=true
                shift
                ;;
            --skip-build)
                skip_build=true
                shift
                ;;
            --help|-h)
                echo "Uso: $0 [opções]"
                echo ""
                echo "Opções:"
                echo "  --skip-github      Pular atualização do GitHub"
                echo "  --skip-vercel      Pular deploy Vercel"
                echo "  --skip-cloudflare  Pular deploy Cloudflare"
                echo "  --skip-build       Pular build local"
                echo "  --help, -h         Mostrar esta ajuda"
                exit 0
                ;;
            *)
                log_error "Opção desconhecida: $1"
                exit 1
                ;;
        esac
    done
    
    # Executar steps
    check_prerequisites
    generate_version
    
    if [ "$skip_build" = false ]; then
        build_local
    fi
    
    if [ "$skip_github" = false ]; then
        update_github
    fi
    
    if [ "$skip_vercel" = false ]; then
        deploy_vercel
    fi
    
    if [ "$skip_cloudflare" = false ]; then
        deploy_cloudflare
    fi
    
    # GitHub Pages é sempre feito se o build existir
    if [ -d "dist" ]; then
        deploy_github_pages
    fi
    
    run_health_checks
    verify_deployments
    generate_report
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    log_info "⏱️  Tempo total: ${duration}s"
}

# Trap para erros
trap 'log_error "Script falhou na linha $LINENO"' ERR

# Executar função principal
main "$@"
