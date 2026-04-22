// ============================================
// CLOUDFLARE WORKER VIDEO PROXY
// CineCasa Elite Video Streaming
// ============================================

import { supabase } from '@/integrations/supabase/client';

const PROXY_BASE_URL = 'https://proxy-cinecasa.paixaoflix-vip.workers.dev/?url=';

/**
 * Gera token JWT para autenticação com o Worker
 */
export async function generateVideoToken(
  userId: string,
  contentId: string,
  contentType: 'movie' | 'series'
): Promise<string | null> {
  try {
    // Buscar sessão atual para obter token JWT
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      console.error('[VideoProxy] No session token available');
      return null;
    }
    
    // Criar token com claims específicos para o vídeo
    const tokenPayload = {
      user_id: userId,
      content_id: contentId,
      content_type: contentType,
      exp: Math.floor(Date.now() / 1000) + (4 * 60 * 60), // 4 horas
      iat: Math.floor(Date.now() / 1000),
    };
    
    // Usar token do Supabase como base
    return session.access_token;
  } catch (error) {
    console.error('[VideoProxy] Error generating token:', error);
    return null;
  }
}

/**
 * Converte URL do Archive.org para URL do proxy Cloudflare
 * Seguindo especificação exata: https://proxy-cinecasa.paixaoflix-vip.workers.dev/?url=
 */
export function getProxiedUrl(originalUrl: string): string {
  if (!originalUrl) return '';

  // Se a URL já está proxied, retorna ela mesma para evitar dupla codificação
  if (originalUrl.includes('proxy-cinecasa.paixaoflix-vip.workers.dev')) {
    console.log('[VideoProxy] URL already proxied, skipping:', originalUrl.substring(0, 50));
    return originalUrl;
  }

  // Verifica se é URL do Archive.org ou IA
  if (originalUrl.includes('archive.org') || originalUrl.includes('ia.')) {
    const encodedUrl = encodeURIComponent(originalUrl);
    console.log('[VideoProxy] Encoding archive.org URL:', originalUrl.substring(0, 50));
    return `${PROXY_BASE_URL}${encodedUrl}`;
  }

  // Se não for archive.org, retorna URL original
  return originalUrl;
}

/**
 * Converte URL do Archive.org para URL do proxy Cloudflare (com token JWT)
 * Versão legacy mantida para compatibilidade
 */
export function getProxiedVideoUrl(
  originalUrl: string,
  token: string | null
): string {
  if (!originalUrl) return '';
  
  // Usar nova função getProxiedUrl para consistência
  return getProxiedUrl(originalUrl);
}

/**
 * Headers necessários para requisições de vídeo
 */
export function getVideoHeaders(token: string | null): HeadersInit {
  const headers: HeadersInit = {
    'Accept': '*/*',
    'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    'Origin': window.location.origin,
    'Referer': window.location.origin + '/',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['X-CineCasa-Token'] = token;
  }
  
  return headers;
}

/**
 * Verifica se URL é do Archive.org ou IA
 */
export function isArchiveOrgUrl(url: string): boolean {
  return url.includes('archive.org') || 
         url.includes('ia.');
}

/**
 * Extrai ID do Archive.org da URL
 */
export function extractArchiveId(url: string): string | null {
  const match = url.match(/archive\.org\/(?:download|stream)\/([^\/]+)/);
  return match ? match[1] : null;
}

/**
 * Valida se token ainda é válido
 */
export function isTokenValid(token: string): boolean {
  try {
    // Decodificar payload do JWT (base64)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp;
    
    // Verificar se não expirou (com margem de 5 minutos)
    return exp > (Math.floor(Date.now() / 1000) + 300);
  } catch {
    return false;
  }
}

/**
 * Faz refresh do token se necessário
 */
export async function refreshVideoToken(
  currentToken: string | null,
  userId: string,
  contentId: string,
  contentType: 'movie' | 'series'
): Promise<string | null> {
  if (!currentToken || !isTokenValid(currentToken)) {
    return generateVideoToken(userId, contentId, contentType);
  }
  return currentToken;
}

/**
 * Configuração de qualidade do vídeo
 */
export interface VideoQuality {
  label: string;
  value: string;
  height: number;
}

/**
 * Obtém lista de qualidades disponíveis
 */
export function getAvailableQualities(): VideoQuality[] {
  return [
    { label: '4K', value: '2160p', height: 2160 },
    { label: '1080p', value: '1080p', height: 1080 },
    { label: '720p', value: '720p', height: 720 },
    { label: '480p', value: '480p', height: 480 },
    { label: '360p', value: '360p', height: 360 },
    { label: 'Auto', value: 'auto', height: 0 },
  ];
}

/**
 * Seleciona qualidade baseada na largura da tela
 */
export function getOptimalQuality(screenWidth: number): string {
  if (screenWidth >= 2560) return '2160p';
  if (screenWidth >= 1920) return '1080p';
  if (screenWidth >= 1280) return '720p';
  if (screenWidth >= 854) return '480p';
  return '360p';
}

/**
 * Constrói URL da thumbnail do Archive.org
 */
export function getArchiveThumbnailUrl(archiveId: string): string {
  return `https://archive.org/services/img/${archiveId}`;
}

/**
 * Configuração de buffer para diferentes tipos de conexão
 */
export function getBufferConfig(connectionType: string): {
  preload: 'none' | 'metadata' | 'auto';
  bufferLength: number;
} {
  switch (connectionType) {
    case '4g':
    case 'wifi':
      return { preload: 'metadata', bufferLength: 30 };
    case '3g':
      return { preload: 'metadata', bufferLength: 15 };
    case '2g':
    case 'slow-2g':
      return { preload: 'none', bufferLength: 5 };
    default:
      return { preload: 'metadata', bufferLength: 20 };
  }
}

/**
 * Detecta tipo de conexão
 */
export function getConnectionType(): string {
  const nav = navigator as any;
  if (nav.connection) {
    return nav.connection.effectiveType || '4g';
  }
  return '4g';
}

/**
 * Verifica se dispositivo é mobile
 */
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Obtém dimensões ideais para o player baseado no dispositivo
 */
export function getOptimalPlayerDimensions(): {
  width: number;
  height: number;
} {
  const isMobile = isMobileDevice();
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  
  if (isMobile) {
    // Modo retrato para mobile
    return {
      width: screenWidth,
      height: screenHeight,
    };
  }
  
  // Desktop: manter aspect ratio 16:9
  const maxWidth = Math.min(screenWidth * 0.9, 1920);
  const height = (maxWidth * 9) / 16;
  
  return {
    width: maxWidth,
    height: Math.min(height, screenHeight * 0.8),
  };
}
