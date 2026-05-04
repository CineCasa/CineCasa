#!/bin/bash

# =============================================================================
# DEPLOY AUTOMÁTICO - CINECASA
# GitHub Pages + Vercel + Cloudflare Workers (Paralelo)
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Version
VERSION=$(date +'%Y%m%d-%H%M%S')-$(git rev-parse --short HEAD 2>/dev/null || echo "local")
BUILD_HASH=$(echo -n "$VERSION" | sha256sum | cut -d' ' -f1 | head -c 16)

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     🚀 CINECASA - DEPLOY AUTOMÁTICO PARALELO              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo -e "📦 Versão: ${YELLOW}$VERSION${NC}"
echo -e "🔑 Hash: ${YELLOW}$BUILD_HASH${NC}"
echo ""

# =============================================================================
# FUNÇÕES
# =============================================================================

log_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# =============================================================================
# BUILD
# =============================================================================

log_section "1. BUILD DA APLICAÇÃO"

# Create version file
mkdir -p public
echo "{\"version\": \"$VERSION\", \"hash\": \"$BUILD_HASH\", \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > public/version.json
log_success "Version file criado"

# Install dependencies
log_info "Instalando dependências..."
npm install --legacy-peer-deps

# Build
log_info "Building..."
VITE_BUILD_VERSION=$VERSION VITE_BUILD_HASH=$BUILD_HASH npm run build
log_success "Build concluído"

# Add cache headers files
log_info "Configurando cache headers..."

# _headers para Cloudflare Pages
cat > dist/_headers << 'EOF'
/*
  X-Build-Version: __VERSION__
  X-Build-Hash: __HASH__
  Cache-Control: public, max-age=0, must-revalidate

/assets/*
  Cache-Control: public, max-age=31536000, immutable
  X-Build-Version: __VERSION__

*.js
  Cache-Control: public, max-age=300, must-revalidate

*.css
  Cache-Control: public, max-age=300, must-revalidate

/cache-nuclear.js
  Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0
  Pragma: no-cache

/index.html
  Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0
  Pragma: no-cache

/sw.js
  Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0
  Pragma: no-cache
EOF

sed -i "s/__VERSION__/$VERSION/g" dist/_headers
sed -i "s/__HASH__/$BUILD_HASH/g" dist/_headers

# .nojekyll para GitHub Pages
touch dist/.nojekyll

log_success "Cache headers configurados"

# =============================================================================
# DEPLOY - PARALELO
# =============================================================================

log_section "2. DEPLOY PARALELO NOS 3 SERVIÇOS"

# Array para armazenar PIDs
pids=()
services=()

# -----------------------------------------------------------------------------
# VERCEL
# -----------------------------------------------------------------------------
deploy_vercel() {
    log_info "[VERCEL] Iniciando deploy..."
    
    if [ -z "$VERCEL_TOKEN" ] || [ -z "$VERCEL_ORG_ID" ] || [ -z "$VERCEL_PROJECT_ID" ]; then
        log_error "[VERCEL] Secrets não configurados"
        return 1
    fi
    
    npx vercel --token=$VERCEL_TOKEN --org-id=$VERCEL_ORG_ID --project-id=$VERCEL_PROJECT_ID --prod --yes --cwd=dist 2>&1 | tee /tmp/vercel-deploy.log
    
    if [ $? -eq 0 ]; then
        log_success "[VERCEL] Deploy concluído: https://cinecasa.vercel.app"
        
        # Purge cache
        curl -X POST "https://api.vercel.com/v3/projects/$VERCEL_PROJECT_ID/cache" \
            -H "Authorization: Bearer $VERCEL_TOKEN" \
            -H "Content-Type: application/json" \
            --data '{"action": "revalidate"}' 2>/dev/null || true
        
        return 0
    else
        log_error "[VERCEL] Deploy falhou"
        return 1
    fi
}

# -----------------------------------------------------------------------------
# CLOUDFLARE
# -----------------------------------------------------------------------------
deploy_cloudflare() {
    log_info "[CLOUDFLARE] Iniciando deploy..."
    
    if [ -z "$CLOUDFLARE_API_TOKEN" ] || [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
        log_error "[CLOUDFLARE] Secrets não configurados"
        return 1
    fi
    
    npx wrangler pages deploy dist --project-name=cinecasa --branch=main 2>&1 | tee /tmp/cloudflare-deploy.log
    
    if [ $? -eq 0 ]; then
        log_success "[CLOUDFLARE] Deploy concluído: https://cinecasa.pages.dev/"
        
        # Purge cache
        if [ -n "$CLOUDFLARE_ZONE_ID" ]; then
            curl -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/purge_cache" \
                -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
                -H "Content-Type: application/json" \
                --data '{"purge_everything":true}' 2>/dev/null || true
        fi
        
        return 0
    else
        log_error "[CLOUDFLARE] Deploy falhou"
        return 1
    fi
}

# -----------------------------------------------------------------------------
# GITHUB PAGES
# -----------------------------------------------------------------------------
deploy_github_pages() {
    log_info "[GITHUB PAGES] Iniciando deploy..."
    
    if [ -z "$GITHUB_TOKEN" ]; then
        log_error "[GITHUB PAGES] GITHUB_TOKEN não configurado"
        return 1
    fi
    
    # Criar branch gh-pages se não existir
    git checkout --orphan gh-pages-temp 2>/dev/null || true
    
    # Limpar e adicionar arquivos do dist
    git rm -rf . 2>/dev/null || true
    cp -r dist/* .
    
    # Commit e push
    git add .
    git commit -m "Deploy $VERSION" 2>/dev/null || true
    git push -f origin gh-pages-temp:gh-pages 2>&1 | tee /tmp/github-deploy.log
    
    if [ $? -eq 0 ]; then
        log_success "[GITHUB PAGES] Deploy concluído: https://kassiaavilla.github.io/cinecasa/"
        return 0
    else
        log_error "[GITHUB PAGES] Deploy falhou"
        return 1
    fi
}

# =============================================================================
# EXECUTAR DEPLOYS EM PARALELO
# =============================================================================

log_info "Iniciando deploys em paralelo..."

# Iniciar cada deploy em background
deploy_vercel &
pids+=($!)
services+=("Vercel")

deploy_cloudflare &
pids+=($!)
services+=("Cloudflare")

deploy_github_pages &
pids+=($!)
services+=("GitHub Pages")

# Aguardar todos os deploys
log_info "Aguardando conclusão dos deploys..."

results=()
for i in "${!pids[@]}"; do
    pid=${pids[$i]}
    service=${services[$i]}
    
    wait $pid
    exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        results+=("${GREEN}✅ $service${NC}")
    else
        results+=("${RED}❌ $service${NC}")
    fi
done

# =============================================================================
# RESUMO
# =============================================================================

log_section "3. RESUMO DO DEPLOY"

echo ""
echo -e "${BLUE}Serviços:${NC}"
for result in "${results[@]}"; do
    echo -e "  $result"
done

echo ""
echo -e "${YELLOW}🌐 URLs:${NC}"
echo -e "  • Vercel:       https://cinecasa.vercel.app"
echo -e "  • Cloudflare:   https://cinecasa.pages.dev/"
echo -e "  • GitHub Pages: https://kassiaavilla.github.io/cinecasa/"

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ DEPLOY AUTOMÁTICO CONCLUÍDO!${NC}"
echo -e "${GREEN}  🔄 Todos os serviços atualizados sem reinicialização${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo ""

exit 0
