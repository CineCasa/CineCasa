import React, { useState } from 'react';
import { Play, Star, Brain, Clock, Users, TrendingUp, Sparkles, Filter, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Button } from '@/components/ui';
import { usePersonalizedRecommendations } from '@/hooks/usePersonalizedRecommendations';
import { cn } from '@/lib/utils';

interface PersonalizedRecommendationsProps {
  userId?: string;
  profileId?: string;
  limit?: number;
  showFilters?: boolean;
  showStats?: boolean;
  onItemSelect?: (item: any) => void;
  onFeedback?: (recommendationId: string, feedback: string) => void;
  className?: string;
}

export function PersonalizedRecommendations({
  userId,
  profileId,
  limit = 20,
  showFilters = true,
  showStats = true,
  onItemSelect,
  onFeedback,
  className,
}: PersonalizedRecommendationsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFeedback, setShowFeedback] = useState<string | null>(null);

  const {
    recommendations,
    behaviorPatterns,
    isLoading,
    error,
    stats,
    patternsLoading,
    provideFeedback,
    hasRecommendations,
    isEmpty,
    isLearning,
  } = usePersonalizedRecommendations({
    userId,
    profileId,
    enableLearning: true,
    enableContextual: true,
    enableSocialProof: true,
  });

  // Filtrar recomendações por categoria
  const filteredRecommendations = React.useMemo(() => {
    if (selectedCategory === 'all') return recommendations;
    return recommendations.filter(rec => rec.category === selectedCategory);
  }, [recommendations, selectedCategory]);

  const handleFeedback = (recommendationId: string, feedback: string, rating?: number) => {
    provideFeedback.mutate({
      recommendationId,
      feedback,
      rating,
    });
    setShowFeedback(null);
    onFeedback?.(recommendationId, feedback);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'behavioral':
        return <Brain className="w-4 h-4" />;
      case 'contextual':
        return <Clock className="w-4 h-4" />;
      case 'social':
        return <Users className="w-4 h-4" />;
      case 'adaptive':
        return <Sparkles className="w-4 h-4" />;
      default:
        return <TrendingUp className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'behavioral':
        return 'text-blue-400 bg-blue-900/20';
      case 'contextual':
        return 'text-green-400 bg-green-900/20';
      case 'social':
        return 'text-purple-400 bg-purple-900/20';
      case 'adaptive':
        return 'text-orange-400 bg-orange-900/20';
      default:
        return 'text-gray-400 bg-gray-900/20';
    }
  };

  const formatScore = (score: number): string => {
    return `${Math.round(score * 100)}%`;
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  if (error) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-8 text-center">
          <Brain className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-400 mb-2">
            Erro ao carregar recomendações
          </h3>
          <p className="text-red-300 text-sm">
            Não foi possível gerar suas recomendações personalizadas.
          </p>
          <Button
            variant="outline"
            className="mt-4 text-red-400 border-red-800"
            onClick={() => window.location.reload()}
          >
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            Recomendações Personalizadas
          </h2>
          <p className="text-gray-400 mt-1">
            Conteúdo selecionado especialmente para você baseado no seu comportamento
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {isLearning && (
            <Badge variant="secondary" className="text-xs">
              <Brain className="w-3 h-3 mr-1" />
              Aprendendo
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            className="text-gray-400 border-gray-700"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      {showStats && stats.total > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-gray-400 text-sm">Total</span>
              <div className="text-white font-semibold">{stats.total}</div>
            </div>
            <div>
              <span className="text-gray-400 text-sm">Score Médio</span>
              <div className="text-white font-semibold">{formatScore(stats.avgScore)}</div>
            </div>
            <div>
              <span className="text-gray-400 text-sm">Confiança</span>
              <div className="text-white font-semibold">{formatScore(stats.confidence)}</div>
            </div>
            <div>
              <span className="text-gray-400 text-sm">Categorias</span>
              <div className="text-white font-semibold">{Object.keys(stats.byCategory).length}</div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros de categoria */}
      {showFilters && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {['all', 'behavioral', 'contextual', 'social', 'adaptive'].map(category => (
            <Badge
              key={category}
              variant={selectedCategory === category ? 'primary' : 'secondary'}
              size="sm"
              className="cursor-pointer hover:opacity-80 whitespace-nowrap"
              onClick={() => setSelectedCategory(category)}
            >
              {getCategoryIcon(category)}
              <span className="ml-1">
                {getCategoryLabel(category)}
              </span>
              {category !== 'all' && (
                <span className="ml-1">
                  ({stats.byCategory[category] || 0})
                </span>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
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
      ) : isEmpty ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
          <Brain className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-400 mb-2">
            Nenhuma recomendação disponível
          </h3>
          <p className="text-gray-500 text-sm">
            Assista a mais conteúdo para receber recomendações personalizadas.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.href = '/explore'}
          >
            Explorar Catálogo
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Grid de recomendações */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {filteredRecommendations.slice(0, limit).map((item) => (
              <PersonalizedRecommendationCard
                key={item.id}
                item={item}
                onSelect={() => onItemSelect?.(item)}
                onFeedback={(feedback, rating) => handleFeedback(item.id, feedback, rating)}
                showFeedback={showFeedback === item.id}
                setShowFeedback={setShowFeedback}
              />
            ))}
          </div>

          {/* Ver mais */}
          {filteredRecommendations.length > limit && (
            <div className="flex justify-center mt-6">
              <Button
                variant="outline"
                className="text-gray-400 border-gray-700"
              >
                Ver Mais Recomendações
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Componente para card de recomendação personalizada
interface PersonalizedRecommendationCardProps {
  item: any;
  onSelect: () => void;
  onFeedback: (feedback: string, rating?: number) => void;
  showFeedback: boolean;
  setShowFeedback: (id: string | null) => void;
}

function PersonalizedRecommendationCard({
  item,
  onSelect,
  onFeedback,
  showFeedback,
  setShowFeedback,
}: PersonalizedRecommendationCardProps) {
  const [selectedRating, setSelectedRating] = useState<number>(0);

  const handleFeedback = (feedback: string) => {
    onFeedback(feedback, selectedRating > 0 ? selectedRating : undefined);
    setSelectedRating(0);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'behavioral':
        return <Brain className="w-4 h-4" />;
      case 'contextual':
        return <Clock className="w-4 h-4" />;
      case 'social':
        return <Users className="w-4 h-4" />;
      case 'adaptive':
        return <Sparkles className="w-4 h-4" />;
      default:
        return <TrendingUp className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'behavioral':
        return 'text-blue-400 bg-blue-900/20';
      case 'contextual':
        return 'text-green-400 bg-green-900/20';
      case 'social':
        return 'text-purple-400 bg-purple-900/20';
      case 'adaptive':
        return 'text-orange-400 bg-orange-900/20';
      default:
        return 'text-gray-400 bg-gray-900/20';
    }
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  return (
    <Card
      variant="default"
      size="md"
      interactive
      onClick={onSelect}
      className="group relative overflow-hidden"
    >
      {/* Score de personalização */}
      <div className="absolute top-2 right-2 z-10">
        <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
          <div className="text-xs font-medium text-primary">
            {Math.round(item.personalizedScore * 100)}%
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
          <div className={cn('flex items-center gap-1 text-xs px-2 py-1 rounded-full', getCategoryColor(item.category))}>
            {getCategoryIcon(item.category)}
            <span>{getCategoryLabel(item.category)}</span>
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

        {/* Motivos da recomendação */}
        <div className="space-y-1 mb-2">
          {item.reasons.slice(0, 2).map((reason: string, index: number) => (
            <div key={index} className="flex items-start gap-1">
              <div className="w-1 h-1 bg-primary rounded-full mt-1 flex-shrink-0"></div>
              <p className="text-xs text-gray-400 line-clamp-2">
                {reason}
              </p>
            </div>
          ))}
        </div>

        {/* Metadados */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
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
              <span>{formatTime(item.duration)}</span>
            </>
          )}
        </div>

        {/* Feedback buttons */}
        <div className="flex gap-1 mt-3">
          <Button
            variant="ghost"
            size="xs"
            onClick={(e) => {
              e.stopPropagation();
              handleFeedback('liked');
            }}
            className="text-green-400 hover:text-green-300 p-1"
          >
            👍
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={(e) => {
              e.stopPropagation();
              handleFeedback('disliked');
            }}
            className="text-red-400 hover:text-red-300 p-1"
          >
            👎
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={(e) => {
              e.stopPropagation();
              setShowFeedback(showFeedback ? null : item.id);
            }}
            className="text-gray-400 hover:text-gray-300 p-1"
          >
            ⭐
          </Button>
        </div>

        {/* Rating feedback */}
        {showFeedback && (
          <div className="mt-2 p-2 bg-gray-800 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">Avalie esta recomendação:</div>
            <div className="flex gap-1 mb-2">
              {[1, 2, 3, 4, 5].map(rating => (
                <button
                  key={rating}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedRating(rating);
                  }}
                  className={cn(
                    'text-lg transition-colors',
                    selectedRating >= rating ? 'text-yellow-400' : 'text-gray-600'
                  )}
                >
                  ★
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFeedback('liked', selectedRating);
                }}
                className="text-xs"
              >
                Enviar
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFeedback(null);
                  setSelectedRating(0);
                }}
                className="text-xs text-gray-400"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Função para obter label da categoria
function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    all: 'Todos',
    behavioral: 'Comportamental',
    contextual: 'Contextual',
    social: 'Social',
    adaptive: 'Adaptativo',
  };
  
  return labels[category] || category;
}
