# CineCasa PWA - Progressive Web App Configuration

## 📱 Plataformas Suportadas

O CineCasa está configurado como PWA nativo para todas as plataformas:

### Mobile & Desktop
- ✅ iOS (iPhone/iPad) - Safari, Chrome
- ✅ Android - Chrome, Samsung Internet
- ✅ Windows - Edge, Chrome
- ✅ macOS - Safari, Chrome
- ✅ Linux - Chrome, Firefox

### Smart TVs
- ✅ Samsung Smart TV (Tizen OS)
- ✅ LG Smart TV (WebOS)
- ✅ Android TV / Google TV
- ✅ Roku
- ✅ Apple TV (tvOS via AirPlay)

## 🎨 Ícones

Todos os ícones são gerados a partir de `public/logo.png`.

### Tamanhos de Ícones

| Tamanho | Uso |
|---------|-----|
| 16x16 | Favicon browser |
| 32x32 | Favicon retina |
| 48x48 | Chrome apps |
| 57x57 | iOS non-retina |
| 60x60 | iOS iPhone |
| 72x72 | iOS iPad, Android |
| 76x76 | iOS iPad |
| 96x96 | Android, favicon |
| 114x114 | iOS retina |
| 120x120 | iOS iPhone retina |
| 128x128 | Chrome Web Store |
| 144x144 | Windows tile, Android |
| 152x152 | iOS iPad retina |
| 167x167 | iOS iPad Pro |
| 180x180 | iOS iPhone 6+ |
| 192x192 | Android, PWA icon |
| 256x256 | Android splash |
| 384x384 | Android splash |
| 512x512 | PWA, Android TV |
| 1024x1024 | macOS, App Store |

### Ícones Especiais

- **Maskable**: 192x192, 512x512 (com padding para safe zone)
- **Monochrome**: 192x192, 512x512 (para temas escuros)
- **Apple Touch**: Todos os tamanhos iOS com cantos arredondados

## 🚀 Gerar Ícones

Execute o script para gerar todos os ícones a partir do logo:

```bash
# Instalar dependência
npm install sharp

# Executar script
node scripts/generate-icons.js
```

Os ícones serão salvos em `public/icons/`.

## 📋 Arquivos de Configuração

### PWA Universal
- `manifest.json` - Configuração principal PWA
- `sw.js` - Service Worker (offline, cache, push)
- `browserconfig.xml` - Windows/Microsoft Edge tiles

### Smart TVs
- `config.xml` - Samsung Tizen
- `appinfo.json` - LG WebOS
- `android-tv.json` - Android TV manifest
- `manifest` - Roku channel

## 🔧 Meta Tags (index.html)

Todas as meta tags necessárias já estão configuradas:

```html
<!-- PWA Básico -->
<meta name="theme-color" content="#00A8E1">
<meta name="mobile-web-app-capable" content="yes">

<!-- iOS -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="CineCasa">

<!-- Smart TVs -->
<meta name="tv-app" content="true">
<meta name="android-tv-app" content="true">
<meta name="leanback" content="true">
<meta name="tizen-application-id" content="cinecasa.app">
<meta name="webos-app" content="true">
<meta name="roku-app" content="true">
```

## 📦 Instalação como App

### Android
1. Abra Chrome no celular
2. Acesse cinecasa.com.br
3. Toque em "Adicionar à tela inicial"
4. O app será instalado com ícone nativo

### iOS
1. Abra Safari no iPhone/iPad
2. Acesse cinecasa.com.br
3. Toque em Compartilhar → "Adicionar à Tela de Início"
4. O app será instalado com ícone nativo

### Windows/Mac
1. Abra Chrome/Edge
2. Acesse cinecasa.com.br
3. Clique no ícone de instalação na barra de endereço
4. O app será instalado como aplicativo nativo

### Smart TV Samsung (Tizen)
1. Acesse a Smart Hub
2. Procure por "CineCasa"
3. Instale o app oficial

### Smart TV LG (WebOS)
1. Acesse a LG Content Store
2. Procure por "CineCasa"
3. Instale o app oficial

### Android TV
1. Acesse Google Play Store
2. Procure por "CineCasa"
3. Instale o app oficial

### Roku
1. Acesse Roku Channel Store
2. Procure por "CineCasa"
3. Adicione o canal

## 🔄 Atualizações

O Service Worker gerencia automaticamente:
- Cache de recursos estáticos
- Atualizações em background
- Modo offline
- Push notifications

Quando houver nova versão:
1. Build do projeto: `npm run build`
2. Deploy para produção
3. O SW detectará e atualizará automaticamente

## 📱 Recursos Nativos

O PWA suporta:
- ✅ Instalação na tela inicial
- ✅ Execução em fullscreen
- ✅ Orientação landscape (TVs)
- ✅ Suporte a gamepad/remoto
- ✅ Navegação por teclado
- ✅ Atalhos rápidos (Filmes, Séries, Favoritos)
- ✅ Compartilhamento nativo
- ✅ Notificações push
- ✅ Background sync
- ✅ Modo offline

## 🎮 Controles de TV

O app detecta automaticamente Smart TVs e habilita:
- Navegação por direcional do controle
- Botão Voltar do controle
- Botão Home do controle
- Suporte a voz (onde disponível)

## 🐛 Troubleshooting

### Ícones não aparecem
1. Verifique se os arquivos estão em `public/icons/`
2. Execute `node scripts/generate-icons.js`
3. Verifique se `logo.png` existe em `public/`

### Service Worker não registra
1. Verifique se está em HTTPS (obrigatório)
2. Verifique console por erros
3. Limpe cache do navegador

### App não instala
1. Verifique se manifest.json é válido em https://manifest-validator.appspot.com/
2. Certifique-se de que todos os ícones existem
3. Verifique se SW está registrado

## 📚 Recursos

- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Samsung Tizen](https://developer.samsung.com/smarttv/develop/)
- [LG WebOS](https://webostv.developer.lge.com/)
- [Android TV](https://developer.android.com/training/tv)
- [Roku Developer](https://developer.roku.com/)

## 📞 Suporte

Para dúvidas sobre o PWA:
- Email: suporte@cinecasa.com.br
- Site: https://cinecasa.com.br
