# Configurações do CineCasa por Sistema Operacional

## Visão Geral

O CineCasa é uma aplicação web streaming responsiva projetada para funcionar em **todos os sistemas operacionais** com suporte a navegadores modernos. Abaixo estão as configurações específicas para cada plataforma.

---

## 1. Windows (10/11)

### Requisitos Mínimos
- **Navegadores Suportados:** Chrome 90+, Edge 90+, Firefox 88+
- **Resolução:** 1280x720 (Full HD 1920x1080 recomendado)
- **GPU:** DirectX 11 compatible

### Configuração
```powershell
# Instalação Node.js via Chocolatey
choco install nodejs-lts

# Clone do projeto
git clone https://github.com/seu-usuario/cinecasa.git
cd cinecasa

# Instalação de dependências
npm install

# Configuração .env.local
copy .env .env.local
notepad .env.local
```

### Variáveis de Ambiente Windows
```
VITE_SUPABASE_PROJECT_ID=seu_project_id
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_publica
VITE_SUPABASE_URL=https://seu-project.supabase.co
VITE_TMDB_API_KEY=sua_chave_tmdb
```

### Execução
```powershell
npm run dev        # Modo desenvolvimento
npm run build      # Build produção
npm run preview    # Preview build
```

---

## 2. macOS (Big Sur / Monterey / Ventura / Sonoma)

### Requisitos Mínimos
- **Navegadores Suportados:** Safari 14+, Chrome 90+, Firefox 88+
- **Resolução:** Retina display recomendado
- **GPU:** Metal compatible

### Configuração
```bash
# Instalação Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Instalação Node.js
brew install node@20

# Clone do projeto
git clone https://github.com/seu-usuario/cinecasa.git
cd cinecasa

# Instalação de dependências
npm install

# Configuração .env.local
cp .env .env.local
open -e .env.local
```

### Permissões macOS (segurança)
```bash
# Permitir acesso a localhost
sudo lsof -i :5173  # Verificar porta

# Firewall - permitir Node.js
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add $(which node)
```

### Execução
```bash
npm run dev        # Modo desenvolvimento
npm run build      # Build produção
npm run preview    # Preview build
```

---

## 3. Linux (Ubuntu/Debian/Fedora/Arch)

### Requisitos Mínimos
- **Navegadores Suportados:** Chrome 90+, Firefox 88+, Chromium 90+
- **Resolução:** 1280x720 (Full HD recomendado)
- **GPU:** OpenGL 3.0+

### Configuração Ubuntu/Debian
```bash
# Instalação Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Dependências de build
sudo apt-get install -y build-essential git

# Clone do projeto
git clone https://github.com/seu-usuario/cinecasa.git
cd cinecasa

# Instalação de dependências
npm install

# Configuração .env.local
cp .env .env.local
nano .env.local  # ou vim/code
```

### Configuração Fedora
```bash
# Instalação Node.js
sudo dnf install nodejs20 npm

# Dependências
sudo dnf install git gcc-c++ make

# Clone e setup
git clone https://github.com/seu-usuario/cinecasa.git
cd cinecasa
npm install
cp .env .env.local
```

### Configuração Arch Linux
```bash
# Instalação Node.js
sudo pacman -S nodejs npm git base-devel

# Clone e setup
git clone https://github.com/seu-usuario/cinecasa.git
cd cinecasa
npm install
cp .env .env.local
```

### Firewall Linux (UFW)
```bash
# Permitir porta de desenvolvimento
sudo ufw allow 5173/tcp
sudo ufw allow 4173/tcp  # preview
sudo ufw reload
```

---

## 4. Smart TVs

### Samsung Tizen
```javascript
// Configuração específica em vite.config.ts
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    cors: true
  },
  build: {
    target: 'es2015', // Compatibilidade Tizen 5.0+
  }
});
```

### LG webOS
```javascript
// webOS requer polyfills adicionais
// Adicionar no index.html
<script src="https://polyfill.io/v3/polyfill.min.js?features=es2015%2Ces2016%2Ces2017"></script>
```

### Android TV / Google TV
```bash
# ADB Debug
adb connect <tv-ip>:5555
adb shell am start -a android.intent.action.VIEW -d "http://<seu-ip>:5173"
```

### Configurações de TV
```css
/* TV-Safe Zones e navegação por controle remoto */
@media (min-width: 1920px) and (pointer: coarse) {
  .tv-focusable:focus {
    outline: 4px solid #00E5FF;
    outline-offset: 6px;
  }
  
  /* Safe zones para TVs */
  .tv-safe-zone {
    padding: 5% 5% 10% 5%;
  }
}
```

---

## 5. Dispositivos Móveis

### iOS (iPhone/iPad)

#### Requisitos
- iOS 14+ 
- Safari ou Chrome iOS

#### Configuração PWA
```html
<!-- index.html -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
```

#### Instalação
1. Abrir no Safari
2. Compartilhar → "Adicionar à Tela de Início"
3. Icone aparecerá no home screen

### Android

#### Requisitos
- Android 8.0+ (API 26+)
- Chrome 90+

#### Configuração PWA
```json
// manifest.json
{
  "short_name": "CineCasa",
  "name": "CineCasa Streaming",
  "icons": [...],
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#000000"
}
```

#### Instalação
1. Abrir no Chrome
2. Menu → "Adicionar à tela inicial"
3. Ou aguardar prompt de instalação

---

## 6. Configurações de Responsividade

### Breakpoints Suportados
```css
/* Mobile pequeno */
@media (max-width: 375px) { ... }

/* Mobile */
@media (min-width: 376px) and (max-width: 639px) { ... }

/* Tablet */
@media (min-width: 640px) and (max-width: 1023px) { ... }

/* Desktop */
@media (min-width: 1024px) and (max-width: 1279px) { ... }

/* Large Desktop / TV */
@media (min-width: 1920px) { ... }

/* 4K+ */
@media (min-width: 2560px) { ... }
```

### Configuração Vite para Mobile
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    cssMinify: true,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar chunks para mobile otimizado
          'vendor-mobile': ['react', 'react-dom'],
          'ui-mobile': ['framer-motion', 'lucide-react']
        }
      }
    }
  },
  server: {
    // Permitir acesso de dispositivos na rede
    host: '0.0.0.0',
    port: 5173
  }
});
```

---

## 7. Docker (Multi-plataforma)

### Dockerfile
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 4173
CMD ["npm", "run", "preview"]
```

### Execução Docker
```bash
# Build
docker build -t cinecasa .

# Run
docker run -p 4173:4173 -e VITE_TMDB_API_KEY=xxx cinecasa

# Multi-arquitetura
docker buildx build --platform linux/amd64,linux/arm64 -t cinecasa:latest .
```

---

## 8. Variáveis de Ambiente por Ambiente

### Desenvolvimento (.env.local)
```
VITE_SUPABASE_PROJECT_ID=eqhstnlsmfrwxhvcwoid
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...
VITE_SUPABASE_URL=https://eqhstnlsmfrwxhvcwoid.supabase.co
VITE_TMDB_API_KEY=b275ce8e1a6b3d5d879bb0907e4f56ad
```

### Produção (.env.production)
```
VITE_SUPABASE_PROJECT_ID=${SUPABASE_PROJECT_ID}
VITE_SUPABASE_PUBLISHABLE_KEY=${SUPABASE_PUBLISHABLE_KEY}
VITE_SUPABASE_URL=${SUPABASE_URL}
VITE_TMDB_API_KEY=${TMDB_API_KEY}
```

---

## 9. Testes por Sistema Operacional

### Windows
```powershell
# Testes E2E com Playwright
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### macOS
```bash
# Testes Safari específicos
npx playwright test --project=webkit

# Testes mobile simulados
npx playwright test --project="Mobile Safari"
```

### Linux
```bash
# Testes headless
npx playwright test --project=chromium --headless

# Testes com Docker
npx playwright test --project=chromium --grep "@docker"
```

---

## 10. Troubleshooting

### Problemas Comuns

#### Windows - Porta em uso
```powershell
# Liberar porta 5173
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

#### macOS - Permissão negada
```bash
# Resetar permissões
sudo xattr -cr .
npm install
```

#### Linux - Permissões de porta
```bash
# Liberar portas baixas
sudo setcap cap_net_bind_service=+ep $(which node)
```

#### Todas as plataformas - Cache
```bash
# Limpar cache npm
npm cache clean --force
rm -rf node_modules
rm package-lock.json
npm install
```

---

## Resumo de Compatibilidade

| Sistema | Versão Mínima | Navegador | Status |
|---------|--------------|-----------|--------|
| Windows 10/11 | 1903+ | Chrome 90+ | ✅ Suportado |
| macOS | 11.0+ | Safari 14+ | ✅ Suportado |
| Ubuntu | 20.04+ | Chrome 90+ | ✅ Suportado |
| iOS | 14.0+ | Safari | ✅ Suportado |
| Android | 8.0+ | Chrome 90+ | ✅ Suportado |
| Samsung Tizen | 5.0+ | WebKit | ✅ Suportado |
| LG webOS | 4.0+ | WebKit | ✅ Suportado |
| Android TV | 10+ | Chrome | ✅ Suportado |

---

## Suporte

Para problemas específicos de plataforma, consulte:
- GitHub Issues: `https://github.com/seu-usuario/cinecasa/issues`
- Documentação Vite: `https://vitejs.dev/guide/`
- Documentação React: `https://react.dev/`
