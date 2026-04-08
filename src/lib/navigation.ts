// Importar estilos de navegação global
import '../styles/navigation.css';
import { useEffect } from 'react';

// Configurações globais de navegação
export const NavigationConfig = {
  // Ativar navegação por setas automaticamente
  autoActivate: true,
  
  // Tempo de animação do foco (ms)
  focusAnimationDuration: 200,
  
  // Configurações por dispositivo
  devices: {
    mobile: {
      scrollBehavior: 'smooth',
      focusScale: 1.03,
      focusBorderWidth: '3px'
    },
    tv: {
      scrollBehavior: 'smooth',
      focusScale: 1.05,
      focusBorderWidth: '4px',
      enablePulse: true
    },
    desktop: {
      scrollBehavior: 'smooth',
      focusScale: 1.02,
      focusBorderWidth: '2px'
    }
  },
  
  // Teclas suportadas
  keys: {
    navigation: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Up', 'Down', 'Left', 'Right'],
    select: ['Enter', ' ', 'OK'],
    back: ['Escape', 'Back'],
    menu: ['Menu', 'ContextMenu']
  }
};

// Detector de tipo de dispositivo
export const getDeviceType = () => {
  const ua = navigator.userAgent;
  
  if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    return 'mobile';
  } else if (/TV|SmartTV|Internet TV|NetTV|Apple TV|Google TV|Chromecast|Web0S|Tizen| Roku/i.test(ua)) {
    return 'tv';
  }
  
  return 'desktop';
};

// Inicialização da navegação
export const initializeNavigation = () => {
  const deviceType = getDeviceType();
  const config = NavigationConfig.devices[deviceType];
  
  // Adicionar classes específicas do dispositivo ao body
  document.body.classList.add(`nav-device-${deviceType}`);
  
  // Configurar CSS custom properties
  const root = document.documentElement;
  root.style.setProperty('--nav-focus-scale', config.focusScale.toString());
  root.style.setProperty('--nav-focus-border-width', config.focusBorderWidth);
  
  console.log(`🎮 Navegação inicializada para dispositivo: ${deviceType}`);
  
  return deviceType;
};

// Hook para detectar mudanças de orientação (mobile)
export const useOrientationChange = (callback: () => void) => {
  useEffect(() => {
    const handleOrientationChange = () => {
      callback();
    };
    
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
    
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, [callback]);
};
