# CineCasa - Streaming Platform

🎬 **Plataforma completa de streaming de filmes e séries com PWA avançada, CI/CD automatizado e deploy blue-green**

## 🚀 **Features Implementadas**

### 📱 **PWA Completa**
- ✅ **Manifest otimizado** com shortcuts, share targets e file handlers
- ✅ **Service Worker avançado** com cache inteligente e background sync
- ✅ **Offline functionality** com gestão de conteúdo offline
- ✅ **App shortcuts** para acesso rápido
- ✅ **Share API** integrada com redes sociais
- ✅ **Install prompts inteligentes** com múltiplos gatilhos
- ✅ **Notificações push** e sincronização automática

### 🔄 **CI/CD Pipeline**
- ✅ **Automated testing pipeline** com unit, integration e E2E tests
- ✅ **Staging environment** com deploy automático
- ✅ **Blue-green deployment** com rollback instantâneo
- ✅ **Rollback strategies** automáticas e manuais
- ✅ **Health checks implementados** abrangentes

### 🛠️ **Infraestrutura**
- ✅ **Docker containerização** multi-stage
- ✅ **Kubernetes deployment** com HPA e PDB
- ✅ **Load balancer** com NGINX
- ✅ **Monitoramento** com Prometheus + Grafana
- ✅ **Logging centralizado** com ELK Stack
- ✅ **Backup automático** do banco de dados

### 🔒 **Segurança**
- ✅ **Security headers** completos
- ✅ **Rate limiting** por endpoint
- ✅ **SSL/TLS** automático
- ✅ **CORS** configurado
- ✅ **Security scans** automatizados

## 📁 **Estrutura do Projeto**

```
cinecasa/
├── .github/workflows/          # CI/CD pipelines
├── k8s/                       # Kubernetes manifests
├── scripts/                    # Scripts de deploy e health
├── src/
│   ├── components/            # Componentes React
│   │   ├── PWA*            # Componentes PWA
│   │   ├── HealthCheck*     # Health dashboard
│   │   └── ...
│   ├── hooks/                # React hooks
│   │   ├── usePWA.ts       # Hook PWA principal
│   │   ├── useOfflineContent.ts
│   │   └── useServiceWorker.ts
│   └── ...
├── public/
│   ├── manifest.json         # PWA manifest
│   ├── sw.js               # Service worker
│   └── icons/              # Ícones PWA
├── docker-compose.yml        # Docker compose
├── Dockerfile              # Docker image
├── nginx.conf             # NGINX config
└── package.json           # Dependencies e scripts
```

## 🚀 **Quick Start**

### Pré-requisitos
- Node.js 18+
- Docker & Docker Compose
- kubectl (para Kubernetes)
- Git

### Desenvolvimento Local
```bash
# Clonar repositório
git clone https://github.com/cinecasa/cinecasa.git
cd cinecasa

# Instalar dependências
npm install

# Iniciar desenvolvimento
npm run dev

# Rodar testes
npm run test:unit
npm run test:integration
npm run test:e2e
```

### Deploy com Docker
```bash
# Build da imagem
npm run docker:build

# Subir ambiente completo
npm run docker:compose

# Ver logs
npm run docker:compose:logs
```

### Deploy em Produção
```bash
# Deploy para staging
npm run deploy:staging

# Deploy para produção (blue-green)
npm run deploy:production

# Rollback automático
npm run deploy:rollback
```
- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
