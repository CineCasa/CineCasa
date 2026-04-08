export type StreamingPlatform = 'netflix' | 'disneyplus' | 'globoplay' | 'hbomax' | 'primevideo';

export interface Top5Content {
  id: string;
  title: string;
  poster: string;
  backdrop?: string;
  type: 'movie' | 'series';
  year: string;
  rating: string;
  platform: StreamingPlatform;
  platformRank: number; // Posição no ranking da plataforma (1, 2, 3...)
  globalRank?: number; // Posição global no top 5
  description?: string;
  genres?: string[];
  duration?: string;
  existsInDatabase: boolean; // Se existe no banco local
  lastUpdated: string;
}

export interface MissingContent {
  id: string;
  title: string;
  poster: string;
  platform: StreamingPlatform;
  platformRank: number;
  type: 'movie' | 'series';
  requestedAt: string;
}

export const PLATFORM_NAMES: Record<StreamingPlatform, string> = {
  netflix: 'Netflix',
  disneyplus: 'Disney+',
  globoplay: 'Globoplay',
  hbomax: 'HBO Max',
  primevideo: 'Prime Video',
};

export const PLATFORM_COLORS: Record<StreamingPlatform, string> = {
  netflix: '#E50914',
  disneyplus: '#113CCF',
  globoplay: '#ED1C24',
  hbomax: '#9900FF',
  primevideo: '#00A8E1',
};

// URLs de placeholder para cada plataforma (em produção, seriam APIs reais)
export const PLATFORM_API_URLS: Record<StreamingPlatform, string> = {
  netflix: 'https://api.netflix.com/top10',
  disneyplus: 'https://api.disneyplus.com/top10',
  globoplay: 'https://api.globoplay.com/top10',
  hbomax: 'https://api.hbomax.com/top10',
  primevideo: 'https://api.primevideo.com/top10',
};
