import { useContinueWatching } from "@/hooks/useContinueWatching";
import ContentRow from "./ContentRow";
import { useNavigate } from 'react-router-dom';

interface ContentItem {
  id: string;
  tmdbId?: string;
  title: string;
  image: string;
  backdrop?: string;
  year: number;
  rating: string;
  duration: string;
  genre: string[];
  category: string;
  description: string;
  type: "movie" | "series";
  trailer?: string;
  url?: string;
  identificadorArchive?: string;
}

const ContinueWatchingRow = () => {
  const { rawItems, isLoading } = useContinueWatching();
  const navigate = useNavigate();

  // Filtrar itens com progresso válido (entre 1% e 95%)
  const validItems = rawItems.filter((item) => {
    return item.progress > 1 && item.progress < 95;
  });

  if (isLoading) {
    return (
      <div className="px-4 md:px-12 py-4">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin" />
          <span className="text-white">Carregando continuar assistindo...</span>
        </div>
      </div>
    );
  }

  if (validItems.length === 0) {
    return null;
  }

  // Converter ContinueWatchingItem para o formato esperado pelo ContentRow
  const historyItems: ContentItem[] = validItems.map((item) => ({
    id: item.contentId,
    tmdbId: item.contentId,
    title: item.title,
    image: item.poster,
    backdrop: item.banner,
    year: new Date(item.updatedAt).getFullYear(),
    rating: `${item.progress}%`,
    duration: String(Math.round(item.duration / 60)) + ' min',
    genre: [],
    category: item.contentType === 'movie' ? 'Filmes' : 'Séries',
    description: item.episodeTitle ? `Episódio: ${item.episodeTitle}` : '',
    type: item.contentType,
  }));

  return (
    <div className="relative">
      <ContentRow 
        category={{ id: "continue-watching", title: "Continuar assistindo", items: historyItems }} 
        showProgress={true} 
      />
    </div>
  );
};

export default ContinueWatchingRow;
