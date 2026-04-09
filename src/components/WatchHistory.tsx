import React, { useState } from 'react';
import { Search, Filter, Calendar, Clock, Star, Download, Trash2, Eye, Play, ChevronDown, BarChart3, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import { cn } from '@/lib/utils';

interface WatchHistoryProps {
  userId?: string;
  profileId?: string;
  limit?: number;
  showFilters?: boolean;
  showStats?: boolean;
  showExport?: boolean;
  onItemSelect?: (item: any) => void;
  className?: string;
}

export function WatchHistory({
  userId,
  profileId,
  limit = 50,
  showFilters = true,
  showStats = true,
  showExport = true,
  onItemSelect,
  className,
}: WatchHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    contentType: 'all' as 'all' | 'movie' | 'series',
    genres: [] as string[],
    ratingRange: [0, 10] as [number, number],
    dateRange: 'all' as 'all' | 'today' | 'week' | 'month' | 'year',
  });

  const {
    history,
    stats,
    isLoading,
    error,
    addToHistory,
    updateHistoryItem,
    clearHistory,
    searchHistory,
    exportHistory,
    hasHistory,
    isEmpty,
  } = useWatchHistory({
    userId,
    profileId,
    limit,
    includeDetails: true,
    filters: selectedFilters,
  });

  // Filtrar histórico baseado na busca
  const filteredHistory = React.useMemo(() => {
    if (!searchQuery.trim()) return history;
    return searchHistory(searchQuery);
  }, [history, searchQuery, searchHistory]);

  const handleExport = (format: 'json' | 'csv') => {
    exportHistory(format);
  };

  const handleClearHistory = (options?: { olderThan?: Date; contentType?: 'movie' | 'series' }) => {
    if (window.confirm('Tem certeza que deseja limpar o histórico? Esta ação não pode ser desfeita.')) {
      clearHistory.mutate(options);
    }
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `há ${diffMins} min`;
    if (diffHours < 24) return `há ${diffHours} h`;
    return `há ${diffDays} d`;
  };

  if (error) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-8 text-center">
          <Calendar className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-400 mb-2">
            Erro ao carregar histórico
          </h3>
          <p className="text-red-300 text-sm">
            Não foi possível carregar seu histórico de visualização.
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
            <Calendar className="w-6 h-6 text-primary" />
            Histórico de Visualização
          </h2>
          <p className="text-gray-400 mt-1">
            Todo o conteúdo que você assistiu, com detalhes completos
          </p>
        </div>
        
        {showExport && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-gray-400 border-gray-700"
              onClick={() => handleExport('json')}
            >
              <Download className="w-4 h-4 mr-2" />
              JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-gray-400 border-gray-700"
              onClick={() => handleExport('csv')}
            >
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
          </div>
        )}
      </div>

      {/* Estatísticas */}
      {showStats && stats.totalWatchTime > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-gray-400 text-sm">Tempo Total</span>
              <div className="text-white font-semibold">{formatDuration(stats.totalWatchTime)}</div>
            </div>
            <div>
              <span className="text-gray-400 text-sm">Itens Assistidos</span>
              <div className="text-white font-semibold">{stats.totalItemsWatched}</div>
            </div>
            <div>
              <span className="text-gray-400 text-sm">Sessão Média</span>
              <div className="text-white font-semibold">{formatDuration(stats.averageSessionDuration)}</div>
            </div>
            <div>
              <span className="text-gray-400 text-sm">Avaliação Média</span>
              <div className="text-white font-semibold">⭐ {stats.averageRating.toFixed(1)}</div>
            </div>
          </div>
          
          {/* Top gêneros */}
          {stats.topGenres.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-800">
              <div className="text-sm text-gray-400 mb-2">Gêneros mais assistidos:</div>
              <div className="flex flex-wrap gap-2">
                {stats.topGenres.slice(0, 5).map((genre, index) => (
                  <Badge
                    key={genre.genre}
                    variant="secondary"
                    size="sm"
                    className="text-xs"
                  >
                    {genre.genre} ({genre.percentage.toFixed(1)}%)
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Padrões de visualização */}
          <div className="mt-4 pt-4 border-t border-gray-800">
            <div className="text-sm text-gray-400 mb-2">Padrões de visualização:</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-gray-500">Melhor dia:</span>
                <div className="text-white font-medium">{stats.watchingPatterns.bestDay}</div>
              </div>
              <div>
                <span className="text-gray-500">Melhor horário:</span>
                <div className="text-white font-medium">{stats.watchingPatterns.bestTime}</div>
              </div>
              <div>
                <span className="text-gray-500">Média diária:</span>
                <div className="text-white font-medium">{formatDuration(stats.watchingPatterns.averageDailyTime)}</div>
              </div>
              <div>
                <span className="text-gray-500">Dias de maratona:</span>
                <div className="text-white font-medium">{stats.watchingPatterns.bingeDays.join(', ') || '-'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Busca e filtros */}
      <div className="space-y-4">
        {/* Barra de busca */}
        <div className="relative">
          <Input
            placeholder="Buscar no histórico..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-5 h-5" />}
            className="bg-gray-900 border-gray-700"
          />
        </div>

        {/* Filtros rápidos */}
        {showFilters && (
          <div className="flex items-center gap-4 overflow-x-auto pb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Tipo:</span>
              <select
                value={selectedFilters.contentType}
                onChange={(e) => setSelectedFilters(prev => ({
                  ...prev,
                  contentType: e.target.value as any
                }))}
                className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm"
              >
                <option value="all">Todos</option>
                <option value="movie">Filmes</option>
                <option value="series">Séries</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Período:</span>
              <select
                value={selectedFilters.dateRange}
                onChange={(e) => setSelectedFilters(prev => ({
                  ...prev,
                  dateRange: e.target.value as any
                }))}
                className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm"
              >
                <option value="all">Todos</option>
                <option value="today">Hoje</option>
                <option value="week">Esta semana</option>
                <option value="month">Este mês</option>
                <option value="year">Este ano</option>
              </select>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="text-gray-400 hover:text-gray-300"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros Avançados
            </Button>
          </div>
        )}

        {/* Filtros avançados */}
        {showAdvancedFilters && (
          <Card variant="outlined" className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Faixa de Avaliação
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={selectedFilters.ratingRange[0]}
                    onChange={(e) => setSelectedFilters(prev => ({
                      ...prev,
                      ratingRange: [parseFloat(e.target.value) || 0, prev.ratingRange[1]]
                    }))}
                    className="flex-1"
                    min="0"
                    max="10"
                    step="0.1"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={selectedFilters.ratingRange[1]}
                    onChange={(e) => setSelectedFilters(prev => ({
                      ...prev,
                      ratingRange: [prev.ratingRange[0], parseFloat(e.target.value) || 10]
                    }))}
                    className="flex-1"
                    min="0"
                    max="10"
                    step="0.1"
                  />
                </div>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleClearHistory()}
                  className="text-red-400 border-red-800"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpar Histórico
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: limit }).map((_, index) => (
            <div key={index} className="bg-gray-900 border border-gray-800 rounded-lg p-4 animate-pulse">
              <div className="flex gap-4">
                <div className="w-20 h-16 bg-gray-800 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-700 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : isEmpty ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
          <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-400 mb-2">
            Nenhum histórico encontrado
          </h3>
          <p className="text-gray-500 text-sm">
            Você ainda não assistiu a nenhum conteúdo.
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
        <div className="space-y-4">
          {/* Lista de histórico */}
          {filteredHistory.map((item) => (
            <WatchHistoryItem
              key={item.id}
              item={item}
              onSelect={() => onItemSelect?.(item)}
            />
          ))}

          {/* Carregar mais */}
          {filteredHistory.length >= limit && (
            <div className="flex justify-center mt-6">
              <Button
                variant="outline"
                className="text-gray-400 border-gray-700"
              >
                Carregar Mais
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Componente para item do histórico
interface WatchHistoryItemProps {
  item: any;
  onSelect: () => void;
}

function WatchHistoryItem({ item, onSelect }: WatchHistoryItemProps) {
  const [showDetails, setShowDetails] = useState(false);

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `há ${diffMins} min`;
    if (diffHours < 24) return `há ${diffHours} h`;
    return `há ${diffDays} d`;
  };

  return (
    <Card
      variant="default"
      size="md"
      interactive
      onClick={onSelect}
      className="group"
    >
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Imagem */}
          <img
            src={item.coverImage || '/placeholder-movie.jpg'}
            alt={item.title}
            className="w-20 h-16 object-cover rounded-lg"
            loading="lazy"
          />

          {/* Conteúdo principal */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium line-clamp-1 flex items-center gap-2">
                  {item.title}
                  {item.content_type === 'series' && (
                    <Badge variant="secondary" size="xs">Série</Badge>
                  )}
                </h3>
                {item.series_title && (
                  <p className="text-gray-400 text-sm">{item.series_title}</p>
                )}
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                {item.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500" />
                    <span className="text-xs text-gray-400">{item.rating.toFixed(1)}</span>
                  </div>
                )}
                <Badge variant="default" size="xs" className="bg-black/60">
                  {Math.round(item.progress)}%
                </Badge>
              </div>
            </div>

            {/* Metadados */}
            <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
              <span>{item.year}</span>
              <span>•</span>
              <span>{item.genre}</span>
              <span>•</span>
              <span>{formatDuration(item.duration)}</span>
              <span>•</span>
              <span>{formatDate(item.watch_date)}</span>
            </div>

            {/* Progresso */}
            <div className="mb-2">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>Progresso</span>
                <span>{Math.round(item.current_time / 60)}min / {Math.round(item.total_time / 60)}min</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-1">
                <div
                  className="bg-primary h-1 rounded-full transition-all duration-300"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>

            {/* Detalhes adicionais */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>{getRelativeTime(item.watch_date)}</span>
              {item.device_type && (
                <>
                  <span>•</span>
                  <span>{item.device_type}</span>
                </>
              )}
              {item.rewatch_count && item.rewatch_count > 0 && (
                <>
                  <span>•</span>
                  <span>Assistido {item.rewatch_count + 1}x</span>
                </>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetails(!showDetails);
                }}
                className="text-primary hover:text-primary/80"
              >
                {showDetails ? 'Menos' : 'Mais'} detalhes
              </button>
            </div>

            {/* Detalhes expandidos */}
            {showDetails && (
              <div className="mt-4 p-3 bg-gray-800 rounded-lg space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Qualidade:</span>
                    <span className="text-white ml-2">{item.quality || 'Auto'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Legendas:</span>
                    <span className="text-white ml-2">{item.subtitles_enabled ? 'Sim' : 'Não'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Velocidade:</span>
                    <span className="text-white ml-2">{item.playback_speed || '1.0'}x</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Localização:</span>
                    <span className="text-white ml-2">{item.location || 'Desconhecida'}</span>
                  </div>
                </div>

                {item.metadata && (
                  <div className="border-t border-gray-700 pt-2">
                    <div className="text-sm text-gray-400 mb-1">Metadados:</div>
                    <div className="flex flex-wrap gap-2">
                      {item.metadata.binge_session && (
                        <Badge variant="secondary" size="xs">Maratona</Badge>
                      )}
                      {item.metadata.skipped_intro && (
                        <Badge variant="secondary" size="xs">Intro pulado</Badge>
                      )}
                      {item.metadata.skipped_credits && (
                        <Badge variant="secondary" size="xs">Créditos pulados</Badge>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect();
                    }}
                  >
                    <Play className="w-3 h-3 mr-2" />
                    Assistir Novamente
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Abrir página de detalhes
                    }}
                  >
                    <Eye className="w-3 h-3 mr-2" />
                    Detalhes
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
