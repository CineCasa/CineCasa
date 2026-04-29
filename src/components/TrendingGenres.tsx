import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Flame, Activity } from 'lucide-react';
import { useGenreWeights } from '@/hooks/useGenreWeights';
import { cn } from '@/lib/utils';

// Mapeamento de gêneros EN -> PT-BR
const genreTranslations: Record<string, string> = {
  'action': 'ação',
  'adventure': 'aventura',
  'comedy': 'comédia',
  'drama': 'drama',
  'horror': 'terror',
  'thriller': 'thriller',
  'romance': 'romance',
  'sci-fi': 'ficção científica',
  'science fiction': 'ficção científica',
  'fantasy': 'fantasia',
  'animation': 'animação',
  'documentary': 'documentário',
  'crime': 'crime',
  'mystery': 'mistério',
  'war': 'guerra',
  'history': 'história',
  'family': 'família',
  'musical': 'musical',
  'music': 'musical',
  'western': 'faroeste',
  'sport': 'esporte',
  'sports': 'esporte',
  'film noir': 'noir',
  'noir': 'noir',
};

interface TrendingGenresProps {
  onGenreClick?: (genre: string) => void;
  className?: string;
}

const genreColors: Record<string, string> = {
  'ação': 'from-red-500 to-orange-500',
  'aventura': 'from-green-500 to-emerald-500',
  'comédia': 'from-yellow-500 to-amber-500',
  'drama': 'from-blue-500 to-indigo-500',
  'terror': 'from-purple-500 to-violet-500',
  'thriller': 'from-slate-500 to-gray-500',
  'romance': 'from-pink-500 to-rose-500',
  'ficção científica': 'from-cyan-500 to-blue-500',
  'fantasia': 'from-indigo-500 to-purple-500',
  'animação': 'from-orange-400 to-pink-400',
  'documentário': 'from-emerald-500 to-green-500',
  'crime': 'from-red-600 to-red-800',
  'mistério': 'from-violet-600 to-purple-700',
  'guerra': 'from-stone-500 to-stone-600',
  'história': 'from-amber-600 to-yellow-700',
  'família': 'from-teal-400 to-cyan-400',
  'musical': 'from-fuchsia-500 to-purple-500',
  'faroeste': 'from-orange-600 to-amber-700',
  'esporte': 'from-lime-500 to-green-500',
  'noir': 'from-neutral-600 to-neutral-800',
};

export const TrendingGenres: React.FC<TrendingGenresProps> = ({
  onGenreClick,
  className
}) => {
  const navigate = useNavigate();
  const { trendingGenres, isLoadingTrending, topGenres } = useGenreWeights();

  // Função para traduzir gênero para PT-BR
  const translateGenre = (genre: string): string => {
    const normalized = genre.toLowerCase().trim();
    return genreTranslations[normalized] || genre;
  };

  // Função de navegação interna
  const handleGenreClick = (genre: string) => {
    const translatedGenre = translateGenre(genre);
    if (onGenreClick) {
      onGenreClick(translatedGenre);
    } else {
      navigate(`/categoria/${encodeURIComponent(translatedGenre)}`);
    }
  };

  // Usar trending ou top genres como fallback
  const displayGenres = trendingGenres.length > 0 
    ? trendingGenres.slice(0, 6)
    : topGenres.slice(0, 6);

  if (isLoadingTrending) {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="flex items-center gap-2 animate-pulse">
          <TrendingUp className="w-5 h-5 text-gray-600" />
          <div className="h-5 w-32 bg-gray-800 rounded" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-8 w-24 bg-gray-800 rounded-full animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (displayGenres.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-cyan-400" />
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
          Gêneros em Alta
        </h3>
      </div>
      
      <div className="flex gap-2 flex-wrap">
        {displayGenres.map((genreData) => {
          const genre = genreData.genre;
          const weight = genreData.weight;
          const normalizedGenre = genre.toLowerCase();
          const colorClass = genreColors[normalizedGenre] || 'from-gray-500 to-slate-500';
          
          // Determinar ícone baseado no engagement
          const isHot = (genreData.engagement_score || 0) > 70;
          const isTrending = (genreData.trending_score || 0) > 50;
          
          return (
            <button
              key={genre}
              onClick={() => handleGenreClick(genre)}
              className={cn(
                'group relative px-4 py-2 rounded-full text-sm font-medium',
                'bg-gradient-to-r text-white transition-all duration-300',
                'hover:scale-105 hover:shadow-lg hover:shadow-white/10',
                'border border-white/10',
                colorClass
              )}
            >
              <span className="flex items-center gap-1.5">
                {isHot && <Flame className="w-3.5 h-3.5 text-yellow-300" />}
                {isTrending && !isHot && <Activity className="w-3.5 h-3.5 text-cyan-300" />}
                {translateGenre(genre).charAt(0).toUpperCase() + translateGenre(genre).slice(1)}
              </span>
              
              {/* Tooltip com stats */}
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                Peso: {weight.toFixed(2)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TrendingGenres;
