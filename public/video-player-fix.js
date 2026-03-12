// Script para corrigir autoplay em todos os navegadores
(function() {
  'use strict';

  // Função para habilitar autoplay em iframes do YouTube
  function enableAutoplay() {
    const iframes = document.querySelectorAll('iframe[src*="youtube.com"], iframe[src*="youtu.be"]');
    
    iframes.forEach(iframe => {
      const src = iframe.src;
      
      // Adicionar parâmetros para autoplay e compatibilidade máxima
      if (src.includes('autoplay=1')) {
        // Já tem autoplay, apenas adicionar parâmetros adicionais
        if (!src.includes('mute=1')) {
          iframe.src = src + '&mute=1';
        }
        if (!src.includes('playsinline=1')) {
          iframe.src = src + '&playsinline=1';
        }
        if (!src.includes('origin=')) {
          iframe.src = src + '&origin=' + window.location.origin;
        }
      }
      
      // Configurações de permissão para máximo compatibilidade
      iframe.setAttribute('allow', 'autoplay; fullscreen; encrypted-media; picture-in-picture; web-share');
      iframe.setAttribute('allowfullscreen', '');
      iframe.setAttribute('loading', 'eager');
      
      // Adicionar listener para erro de autoplay
      iframe.addEventListener('error', function() {
        console.log('Trailer error, retrying with different parameters');
        // Tentar reload com parâmetros diferentes
        const retrySrc = src.replace('autoplay=1', 'autoplay=1&mute=0&controls=1');
        iframe.src = retrySrc;
      });
    });
  }

  // Função para tentar autoplay em vídeos HTML5
  function enableVideoAutoplay() {
    const videos = document.querySelectorAll('video');
    
    videos.forEach(video => {
      // Tentar autoplay com mute
      video.muted = false;
      video.playsInline = true;
      
      // Adicionar listener para tentar autoplay
      video.addEventListener('loadeddata', function() {
        const playPromise = video.play();
        
        if (playPromise !== undefined) {
          playPromise.then(() => {
            console.log('Autoplay started successfully');
          }).catch(error => {
            console.log('Autoplay was prevented, trying with mute');
            video.muted = true;
            video.play().then(() => {
              console.log('Muted autoplay started');
            }).catch(mutedError => {
              console.log('Even muted autoplay failed');
            });
          });
        }
      });
    });
  }

  // Função para configurar eventos de interação do usuário
  function setupUserInteraction() {
    // Adicionar listener para primeiro clique/touch
    document.addEventListener('click', function initAutoplay() {
      enableAutoplay();
      enableVideoAutoplay();
      // Remover listener após primeira interação
      document.removeEventListener('click', initAutoplay);
    }, { once: true });
    
    document.addEventListener('touchstart', function initAutoplay() {
      enableAutoplay();
      enableVideoAutoplay();
      // Remover listener após primeira interação
      document.removeEventListener('touchstart', initAutoplay);
    }, { once: true });
  }

  // Inicializar quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupUserInteraction);
  } else {
    setupUserInteraction();
  }

  // Tentar imediatamente também
  enableAutoplay();
  enableVideoAutoplay();

})();
