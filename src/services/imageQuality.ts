/**
 * Serviço para gerenciar qualidade de imagens
 * Em modo projeção (telas 4K/200"), usa resoluções máximas (w1280/original)
 * Em telas normais, usa resoluções otimizadas (w500/w780)
 */

export type ImageSize = 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'w1280' | 'original';

// TMDB base URL
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

interface ImageQualityOptions {
  isProjectionMode?: boolean;
  screenWidth?: number;
  type?: 'poster' | 'backdrop' | 'profile' | 'still';
}

/**
 * Retorna o tamanho ideal de imagem baseado no contexto
 */
export function getOptimalImageSize(options: ImageQualityOptions = {}): ImageSize {
  const { isProjectionMode = false, screenWidth = window.innerWidth, type = 'poster' } = options;
  
  // Modo projeção: sempre usar alta qualidade
  if (isProjectionMode || screenWidth >= 2560) {
    return type === 'backdrop' ? 'w1280' : 'w780';
  }
  
  // Modo normal: otimizar baseado na tela
  if (screenWidth >= 1920) {
    return type === 'backdrop' ? 'w1280' : 'w500';
  }
  
  if (screenWidth >= 1280) {
    return type === 'backdrop' ? 'w780' : 'w342';
  }
  
  return type === 'backdrop' ? 'w500' : 'w342';
}

/**
 * Constrói URL de imagem TMDB com qualidade otimizada
 */
export function buildTmdbImageUrl(
  path: string | null | undefined,
  options: ImageQualityOptions = {}
): string | null {
  if (!path) return null;
  
  // Se já for URL completa, retornar como está
  if (path.startsWith('http')) return path;
  
  const size = getOptimalImageSize(options);
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${TMDB_IMAGE_BASE}/${size}${cleanPath}`;
}

/**
 * Força resolução máxima para modo projeção
 */
export function getProjectionQualityUrl(
  path: string | null | undefined,
  type: 'poster' | 'backdrop' = 'poster'
): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  
  const size = type === 'backdrop' ? 'w1280' : 'w780';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${TMDB_IMAGE_BASE}/${size}${cleanPath}`;
}

/**
 * Hook helper para detectar se deve usar qualidade de projeção
 */
export function shouldUseProjectionQuality(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Verificar classe no HTML
  const isProjectionMode = document.documentElement.classList.contains('projection-mode');
  
  // Verificar tamanho da tela
  const isLargeScreen = window.innerWidth >= 2560;
  
  return isProjectionMode || isLargeScreen;
}
