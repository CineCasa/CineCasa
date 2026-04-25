import React from 'react';
import { Play, Star, TrendingUp, Users, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Button } from '@/components/ui';
import { useRecommendations } from '@/hooks/useRecommendations';
import { cn } from '@/lib/utils';

interface RecommendationRowProps {
  userId?: string;
  title?: string;
  limit?: number;
  categories?: string[];
  onItemSelect?: (item: any) => void;
  showMore?: boolean;
  className?: string;
}

export function RecommendationRow({
  userId,
  title = 'Recomendados para Você',
  limit = 12,
  categories = ['personalized', 'similar', 'trending'],
  onItemSelect,
  showMore = true,
  className,
}: RecommendationRowProps) {
  const {
    recommendations,
    isLoading,
    error,
    stats,
    hasRecommendations,
    isEmpty,
  } = useRecommendations({
    userId,
    limit,
    categories,
    algorithm: 'hybrid',
  });

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {Array.from({ length: limit }).map((_, index) => (
            <div key={index} className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden animate-pulse">
              <div className="aspect-video bg-gray-800" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
        </div>
        <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-4">
          <p className="text-red-400 text-center">
            Erro ao carregar recomendações. Tente novamente.
          </p>
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
          <Sparkles className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-400 mb-2">
            Sem recomendações disponíveis
          </h3>
          <p className="text-gray-500 text-sm">
            Assista a mais conteúdo para receber recomendações personalizadas
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header com estatísticas */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            <span>{stats.total}</span>
          </div>
          <div className="hidden md:flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>Personalizado</span>
          </div>
        </div>
      </div>

      {/* Categorias de recomendações */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {categories.map(category => (
          <Badge
            key={category}
            variant={stats.byCategory[category] > 0 ? 'primary' : 'secondary'}
            size="sm"
            className="whitespace-nowrap"
          >
            {getCategoryLabel(category)}
          </Badge>
        ))}
      </div>

      {/* Grid de recomendações */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {recommendations.map((item) => (
          <RecommendationCard
            key={item.id}
            item={item}
            onSelect={() => onItemSelect?.(item)}
          />
        ))}
      </div>

      {/* Botão ver mais */}
      {showMore && hasRecommendations && (
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => console.log('Ver mais recomendações')}
            className="text-gray-400 border-gray-700 hover:text-gray-300"
          >
            Ver mais recomendações
          </Button>
        </div>
      )}
    </div>
  );
}

// Componente para card de recomendação
interface RecommendationCardProps {
  item: any;
  onSelect: () => void;
}

function RecommendationCard({ item, onSelect }: RecommendationCardProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'similar':
        return <Users className="w-4 h-4" />;
      case 'genre':
        return <Star className="w-4 h-4" />;
      case 'trending':
        return <TrendingUp className="w-4 h-4" />;
      case 'personalized':
        return <Sparkles className="w-4 h-4" />;
      default:
        return <Play className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'similar':
        return 'text-blue-400';
      case 'genre':
        return 'text-green-400';
      case 'trending':
        return 'text-yellow-400';
      case 'personalized':
        return 'text-purple-400';
      default:
        return 'text-gray-400';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-gray-400';
  };

  return (
    <Card
      variant="default"
      size="md"
      interactive
      onClick={onSelect}
      className="group relative overflow-hidden"
    >
      {/* Score indicator */}
      <div className="absolute top-2 right-2 z-10">
        <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
          <div className={cn('text-xs font-medium', getScoreColor(item.score))}>
            {Math.round(item.score)}%
          </div>
        </div>
      </div>

        {/* Imagem */}
      <div className="aspect-video relative">
        <img
          src={item.coverImage || '/placeholder-movie.jpg'}
          alt={item.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Conteúdo */}
      <CardContent className="p-3">
        {/* Categoria e score */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <div className={cn('flex items-center gap-1 text-xs', getCategoryColor(item.category))}>
              {getCategoryIcon(item.category)}
              <span>{getCategoryLabel(item.category)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-500" />
            <span className="text-xs text-gray-400">{item.rating?.toFixed(1)}</span>
          </div>
        </div>

        {/* Título */}
        <h3 className="text-white font-medium line-clamp-2 text-sm mb-2">
          {item.title}
        </h3>

        {/* Motivo da recomendação */}
        <div className="flex items-start gap-2">
          <div className="w-1 h-1 bg-primary rounded-full mt-1 flex-shrink-0"></div>
          <p className="text-xs text-gray-400 line-clamp-2">
            {item.reason}
          </p>
        </div>

        {/* Metadados */}
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
          {item.year && <span>{item.year}</span>}
          {item.genre && (
            <>
              <span>•</span>
              <span>{item.genre}</span>
            </>
          )}
          {item.duration && (
            <>
              <span>•</span>
              <span>{formatDuration(item.duration)}</span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Função para obter label da categoria
function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    similar: 'Similar',
    genre: 'Gênero',
    trending: 'Em Alta',
    personalized: 'Para Você',
    collaborative: 'Popular entre Usuários',
  };
  
  return labels[category] || category;
}

// Função para formatar duração
function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${mins}min`;
  }
  return `${mins}min`;
}

// Componente para recomendações específicas
interface SpecificRecommendationsProps {
  title: string;
  items: any[];
  category: string;
  onItemSelect?: (item: any) => void;
  showMore?: boolean;
  onMoreClick?: () => void;
}

export function SpecificRecommendations({
  title,
  items,
  category,
  onItemSelect,
  showMore = true,
  onMoreClick,
}: SpecificRecommendationsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {showMore && items.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMoreClick}
            className="text-gray-400 hover:text-gray-300"
          >
            Ver mais
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.slice(0, 8).map((item) => (
          <RecommendationCard
            key={item.id}
            item={{ ...item, category }}
            onSelect={() => onItemSelect?.(item)}
          />
        ))}
      </div>
    </div>
  );
}
