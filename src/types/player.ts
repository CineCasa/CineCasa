/**
 * Tipos para ClapprPlayer
 */

export interface ClapprPlayerProps {
  // Propriedades obrigatórias
  source: string; // URL do vídeo (MP4, HLS, DASH, WebM)
  title: string; // Título do vídeo

  // Propriedades opcionais
  poster?: string; // URL da imagem de capa
  subtitles?: SubtitleTrack[]; // Array de legendas
  audioTracks?: AudioTrack[]; // Array de faixas de áudio
  onClose?: () => void; // Callback ao fechar o player
  autoPlay?: boolean; // Iniciar automaticamente (padrão: false)
  muted?: boolean; // Iniciar mudo (padrão: false)
  controls?: boolean; // Mostrar controles (padrão: true)
  fullscreenEnabled?: boolean; // Permitir tela cheia (padrão: true)
  width?: string | number; // Largura (padrão: 100%)
  height?: string | number; // Altura (padrão: 100%)
}

export interface SubtitleTrack {
  lang: string; // Código do idioma (pt-BR, en, es, etc)
  src: string; // URL do arquivo .vtt
  label: string; // Nome exibido ao usuário
}

export interface AudioTrack {
  lang: string; // Código do idioma
  label: string; // Nome exibido ao usuário (ex: "Português - Original")
}

export interface VideoContent {
  id: string;
  title: string;
  description: string;
  source: string; // URL HLS/DASH
  poster: string; // URL da imagem de capa
  backdrop?: string; // URL da imagem de fundo (opcional)
  duration: number; // Duração em segundos
  year?: number; // Ano de lançamento
  rating?: string; // Classificação (ex: "12+", "PG-13")
  genres?: string[]; // Array de gêneros
  subtitles: SubtitleTrack[]; // Legendas disponíveis
  audioTracks: AudioTrack[]; // Faixas de áudio disponíveis
  progress?: number; // Progresso de reprodução (0-100)
  type?: 'movie' | 'series' | 'episode'; // Tipo de conteúdo
}

export interface SeriesContent extends VideoContent {
  type: 'series';
  seasonNumber: number;
  episodes: EpisodeContent[];
}

export interface EpisodeContent extends VideoContent {
  type: 'episode';
  seriesId: string;
  seriesTitle: string;
  seasonNumber: number;
  episodeNumber: number;
  releaseDate: string;
  nextEpisodeId?: string;
}

export interface PlayerEvent {
  type:
    | 'play'
    | 'pause'
    | 'timeupdate'
    | 'ended'
    | 'error'
    | 'fullscreen'
    | 'qualitychange'
    | 'volumechange';
  data: any;
  timestamp: number;
}

export interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  playbackRate: number;
  currentQuality?: string;
  selectedSubtitle?: string;
  selectedAudio?: string;
}
