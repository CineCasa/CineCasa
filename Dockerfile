# Multi-stage build para produção otimizada
FROM node:20-alpine AS base

# Instalar dependências de build
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production && npm cache clean --force

# ========================================
# BUILD STAGE
# ========================================
FROM base AS build

# Instalar todas as dependências para build
RUN npm ci

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# ========================================
# PRODUCTION STAGE
# ========================================
FROM nginx:alpine AS production

# Instalar ferramentas adicionais
RUN apk add --no-cache \
    curl \
    jq \
    tzdata

# Configurar timezone
ENV TZ=America/Sao_Paulo

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copiar build da stage anterior
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar configuração do Nginx
COPY nginx.conf /etc/nginx/nginx.conf
COPY default.conf /etc/nginx/conf.d/default.conf

# Criar diretórios necessários
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/run && \
    chown -R nextjs:nodejs /var/cache/nginx /var/log/nginx /var/run /usr/share/nginx/html

# Copiar scripts de health check
COPY health-check.sh /usr/local/bin/health-check.sh
RUN chmod +x /usr/local/bin/health-check.sh

# Expor portas
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD /usr/local/bin/health-check.sh

# Switch para usuário não-root
USER nextjs

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
