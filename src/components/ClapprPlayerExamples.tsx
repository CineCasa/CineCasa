import React from 'react';
import ClapprPlayer from '@/components/ClapprPlayer';

/**
 * EXEMPLOS DE INTEGRAÇÃO - ClapprPlayer
 * 
 * Estes são exemplos práticos de como usar o ClapprPlayer
 * em diferentes cenários do projeto CineCasa
 */

// ============================================
// EXEMPLO 1: Reprodutor Simples
// ============================================

export function SimplePlayerExample() {
  return (
    <ClapprPlayer
      source="https://example.com/video.mp4"
      title="Vídeo Simples"
      poster="https://example.com/poster.jpg"
      autoPlay={false}
    />
  );
}

// ============================================
// EXEMPLO 2: Player Completo com Legendas
// ============================================

export function FullPlayerExample() {
  return (
    <ClapprPlayer
      source="https://example.com/video.m3u8"
      title="Série Incrível - Episódio 1"
      poster="https://example.com/series/poster.jpg"
      autoPlay={false}
      muted={false}
      controls={true}
      fullscreenEnabled={true}
      width="100%"
      height="600px"
      subtitles={[
        {
          lang: 'pt-BR',
          src: 'https://example.com/subtitles/pt-BR.vtt',
          label: 'Português (Brasil)',
        },
        {
          lang: 'en',
          src: 'https://example.com/subtitles/en.vtt',
          label: 'English',
        },
        {
          lang: 'es',
          src: 'https://example.com/subtitles/es.vtt',
          label: 'Español',
        },
      ]}
      audioTracks={[
        {
          lang: 'pt-BR',
          label: 'Português (Brasil) - Original',
        },
        {
          lang: 'en',
          label: 'English - Dub (Dublagem)',
        },
        {
          lang: 'es',
          label: 'Español - Dub (Dublaje)',
        },
      ]}
      onClose={() => console.log('Player fechado')}
    />
  );
}

// ============================================
// EXEMPLO 3: Elemento Modal Responsivo
// ============================================

export function ModalPlayerExample({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="w-full h-[80vh] max-w-6xl rounded-lg overflow-hidden">
        <ClapprPlayer
          source="https://example.com/video.m3u8"
          title="Filme em Modal"
          poster="https://example.com/movie-poster.jpg"
          autoPlay={true}
          fullscreenEnabled={true}
          width="100%"
          height="100%"
          onClose={onClose}
        />
      </div>
    </div>
  );
}

// ============================================
// EXEMPLO 4: Streaming de Conteúdo Dinâmico
// ============================================

interface VideoContent {
  id: string;
  title: string;
  description: string;
  source: string;
  poster: string;
  duration: number;
  subtitles: Array<{
    lang: string;
    src: string;
    label: string;
  }>;
  audioTracks: Array<{
    lang: string;
    label: string;
  }>;
}

export function DynamicContentPlayer({ content }: { content: VideoContent }) {
  const handlePlayerClose = () => {
    console.log(`Fechado: ${content.title}`);
    // Voltar para listagem, etc
  };

  return (
    <div className="w-full h-screen bg-black">
      <ClapprPlayer
        source={content.source}
        title={content.title}
        poster={content.poster}
        subtitles={content.subtitles}
        audioTracks={content.audioTracks}
        autoPlay={true}
        fullscreenEnabled={true}
        width="100%"
        height="100%"
        onClose={handlePlayerClose}
      />
    </div>
  );
}

// ============================================
// EXEMPLO 5: Player com História/Progressão
// ============================================

export function ContinueWatchingPlayer({ episodeData }: { episodeData: any }) {
  const handlePlayerClose = () => {
    console.log(`Salvando progresso do episódio: ${episodeData.episodeNumber}`);
    // Salvar no localStorage/Supabase
  };

  return (
    <div className="w-full">
      {/* Info do Episódio */}
      <div className="bg-black p-4">
        <h2 className="text-white text-xl font-bold">{episodeData.seriesTitle}</h2>
        <p className="text-gray-400">
          Temporada {episodeData.season} - Episódio {episodeData.episode}
        </p>
        <p className="text-white mt-2">{episodeData.episodeTitle}</p>
      </div>

      {/* Player */}
      <div className="w-full aspect-video bg-black">
        <ClapprPlayer
          source={episodeData.source}
          title={`${episodeData.seriesTitle} - S${episodeData.season}E${episodeData.episode}`}
          poster={episodeData.poster}
          subtitles={episodeData.subtitles}
          autoPlay={true}
          muted={false}
          controls={true}
          fullscreenEnabled={true}
          width="100%"
          height="100%"
          onClose={handlePlayerClose}
        />
      </div>

      {/* Próximo Episódio */}
      <div className="bg-gray-900 p-4 text-white">
        <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
          Próximo Episódio →
        </button>
      </div>
    </div>
  );
}

// ============================================
// EXEMPLO 6: Responsivo para Todos os Tamanhos
// ============================================

export function ResponsivePlayerExample() {
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  return (
    <div className="w-full">
      {/* Desktop */}
      <div className="hidden lg:block w-full aspect-video bg-black">
        <ClapprPlayer
          source="https://example.com/desktop.m3u8"
          title="Conteúdo Desktop"
          width="100%"
          height="100%"
        />
      </div>

      {/* Tablet */}
      <div className="hidden md:block lg:hidden w-full aspect-video bg-black">
        <ClapprPlayer
          source="https://example.com/tablet.m3u8"
          title="Conteúdo Tablet"
          width="100%"
          height="100%"
        />
      </div>

      {/* Mobile */}
      <div className="md:hidden w-full aspect-video bg-black">
        <ClapprPlayer
          source="https://example.com/mobile.m3u8"
          title="Conteúdo Mobile"
          width="100%"
          height="100%"
        />
      </div>
    </div>
  );
}

// ============================================
// EXEMPLO 7: Integração com Dados Reais do Supabase
// ============================================

export function SupabaseIntegratedPlayer({ contentId }: { contentId: string }) {
  const [content, setContent] = React.useState<VideoContent | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Simular carregamento do Supabase
    const loadContent = async () => {
      try {
        // const { data, error } = await supabase
        //   .from('content')
        //   .select('*')
        //   .eq('id', contentId)
        //   .single();

        // Mock de dados
        setContent({
          id: contentId,
          title: 'Série Demo',
          description: 'Descrição da série',
          source: 'https://example.com/video.m3u8',
          poster: 'https://example.com/poster.jpg',
          duration: 3600,
          subtitles: [
            {
              lang: 'pt-BR',
              src: 'https://example.com/pt.vtt',
              label: 'Português',
            },
          ],
          audioTracks: [
            {
              lang: 'pt-BR',
              label: 'Português',
            },
          ],
        });
      } catch (error) {
        console.error('Erro ao carregar conteúdo:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [contentId]);

  if (isLoading) {
    return <div className="w-full h-screen bg-black flex items-center justify-center text-white">Carregando...</div>;
  }

  if (!content) {
    return <div className="w-full h-screen bg-black flex items-center justify-center text-white">Conteúdo não encontrado</div>;
  }

  return (
    <div className="w-full bg-black">
      <div className="aspect-video">
        <ClapprPlayer
          source={content.source}
          title={content.title}
          poster={content.poster}
          subtitles={content.subtitles}
          audioTracks={content.audioTracks}
          autoPlay={false}
          fullscreenEnabled={true}
          width="100%"
          height="100%"
        />
      </div>
    </div>
  );
}

// ============================================
// EXEMPLO 8: Galeria de Vídeos com Player Modal
// ============================================

const mockVideos: VideoContent[] = [
  {
    id: '1',
    title: 'Vídeo 1',
    description: 'Descrição do vídeo 1',
    source: 'https://example.com/video1.m3u8',
    poster: 'https://example.com/poster1.jpg',
    duration: 1200,
    subtitles: [],
    audioTracks: [],
  },
  {
    id: '2',
    title: 'Vídeo 2',
    description: 'Descrição do vídeo 2',
    source: 'https://example.com/video2.m3u8',
    poster: 'https://example.com/poster2.jpg',
    duration: 1800,
    subtitles: [],
    audioTracks: [],
  },
];

export function VideoGalleryExample() {
  const [selectedVideo, setSelectedVideo] = React.useState<VideoContent | null>(null);

  return (
    <div className="w-full bg-black p-4">
      {/* Galeria */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {mockVideos.map((video) => (
          <button
            key={video.id}
            onClick={() => setSelectedVideo(video)}
            className="relative overflow-hidden rounded-lg group"
          >
            <img
              src={video.poster}
              alt={video.title}
              className="w-full h-48 object-cover group-hover:scale-110 transition-transform"
            />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white text-2xl">▶</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-2">
              <p className="text-white font-semibold text-sm">{video.title}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Modal com Player */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl">
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute top-4 right-4 text-white text-3xl z-51"
            >
              ✕
            </button>
            <div className="aspect-video">
              <ClapprPlayer
                source={selectedVideo.source}
                title={selectedVideo.title}
                poster={selectedVideo.poster}
                autoPlay={true}
                fullscreenEnabled={true}
                width="100%"
                height="100%"
                onClose={() => setSelectedVideo(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * COMO USAR ESTES EXEMPLOS:
 * 
 * 1. Importe o exemplo desejado:
 *    import { SimplePlayerExample } from '@/components/ClapprPlayerExamples';
 * 
 * 2. Use no seu componente:
 *    <SimplePlayerExample />
 * 
 * 3. Customize conforme necessário adaptando URLs e dados
 */
