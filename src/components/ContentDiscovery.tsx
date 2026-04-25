import React, { useState } from 'react';
import { Search, Filter, ChevronDown, X, Grid, List } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { useContentDiscovery } from '@/hooks/useContentDiscovery';
import { cn } from '@/lib/utils';

interface ContentDiscoveryProps {
  userId?: string;
  onItemSelect?: (item: any) => void;
  className?: string;
}

export function ContentDiscovery({ userId, onItemSelect, className }: ContentDiscoveryProps) {
  const {
    content,
    categories,
    filterOptions,
    activeFilters,
    searchQuery,
    selectedCategory,
    isLoading,
    error,
    updateFilters,
    clearFilters,
    toggleGenre,
    toggleYear,
    setRatingRange,
    search,
    nextPage,
    prevPage,
    currentPage,
    hasContent,
    isEmpty,
    hasActiveFilters,
    isSearching,
  } = useContentDiscovery({
    userId,
    includeFilters: true,
  });

  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Componente de filtros
  const FiltersPanel = () => (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
      {/* Filtros ativos */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-400">
            {Object.values(activeFilters).filter(arr => arr.length > 0).length} filtros ativos
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-gray-400 hover:text-gray-300"
          >
            <X className="w-4 h-4 mr-1" />
            Limpar
          </Button>
        </div>
      )}

      {/* Filtro de gêneros */}
      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-3">Gêneros</h4>
        <div className="flex flex-wrap gap-2">
          {(filterOptions as any)?.genres?.slice(0, 8).map((genre: string) => (
            <Badge
              key={genre}
              variant={activeFilters.genres.includes(genre) ? 'primary' : 'secondary'}
              size="sm"
              className="cursor-pointer hover:opacity-80"
              onClick={() => toggleGenre(genre)}
            >
              {genre}
            </Badge>
          ))}
          {(filterOptions as any)?.genres && (filterOptions as any).genres.length > 8 && (
            <Badge
              variant="secondary"
              size="sm"
              className="cursor-pointer"
              onClick={() => console.log('Mostrar mais gêneros')}
            >
              +{(filterOptions as any).genres.length - 8}
            </Badge>
          )}
        </div>
      </div>

      {/* Filtro de anos */}
      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-3">Ano</h4>
        <div className="flex flex-wrap gap-2">
          {(filterOptions as any)?.years?.slice(0, 6).map((year: number) => (
            <Badge
              key={year}
              variant={activeFilters.years.includes(year) ? 'primary' : 'secondary'}
              size="sm"
              className="cursor-pointer hover:opacity-80"
              onClick={() => toggleYear(year)}
            >
              {year}
            </Badge>
          ))}
          {(filterOptions as any)?.years && (filterOptions as any).years.length > 6 && (
            <Badge
              variant="secondary"
              size="sm"
              className="cursor-pointer"
              onClick={() => console.log('Mostrar mais anos')}
            >
              +{(filterOptions as any).years.length - 6}
            </Badge>
          )}
        </div>
      </div>

      {/* Filtro de rating */}
      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-3">Avaliação</h4>
        <div className="flex gap-2">
          {[7, 8, 9].map(rating => (
            <Badge
              key={rating}
              variant={activeFilters.ratings.some(r => r >= rating - 0.5 && r <= rating + 0.5) ? 'primary' : 'secondary'}
              size="sm"
              className="cursor-pointer hover:opacity-80"
              onClick={() => setRatingRange(rating - 0.5, rating + 0.5)}
            >
              {rating}+ ⭐
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );

  // Componente de categorias
  const CategoriesRow = () => (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {Object.entries(categories || {}).map(([key, items]) => (
        <Badge
          key={key}
          variant={selectedCategory === key ? 'primary' : 'secondary'}
          size="sm"
          className="whitespace-nowrap cursor-pointer hover:opacity-80"
          onClick={() => console.log('Selecionar categoria:', key)}
        >
          {getCategoryLabel(key)} ({items.length})
        </Badge>
      ))}
    </div>
  );

  // Componente de busca
  const SearchBar = () => (
    <div className="relative">
      <Input
        placeholder="Buscar filmes, séries, atores..."
        value={searchQuery}
        onChange={(e) => search(e.target.value)}
        leftIcon={<Search className="w-5 h-5" />}
        className="bg-gray-900 border-gray-700"
      />
      {searchQuery && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => search('')}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );

  if (error) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-8 text-center">
          <h3 className="text-red-400 text-lg font-medium mb-2">
            Erro ao carregar conteúdo
          </h3>
          <p className="text-red-300 text-sm">
            Não foi possível carregar o conteúdo. Tente novamente mais tarde.
          </p>
          <Button
            variant="primary"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Recarregar Página
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header com busca e filtros */}
      <div className="space-y-4">
        {/* Barra de busca */}
        <SearchBar />

        {/* Filtros e categorias */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Botão de filtros */}
          <div className="lg:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="w-full lg:w-auto"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros
              {hasActiveFilters && (
                <Badge variant="primary" size="xs" className="ml-2">
                  {Object.values(activeFilters).filter(arr => arr.length > 0).length}
                </Badge>
              )}
            </Button>
          </div>

          {/* Categorias */}
          <div className="flex-1 min-w-0">
            <CategoriesRow />
          </div>

          {/* View mode (desktop) */}
          <div className="hidden lg:flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="p-2"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="p-2"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Painel de filtros (mobile e desktop) */}
        <div className={cn('lg:hidden', showFilters ? 'block' : 'hidden')}>
          <FiltersPanel />
        </div>
      </div>

      {/* Filtros desktop */}
      <div className="hidden lg:block">
        <FiltersPanel />
      </div>

      {/* Conteúdo */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, index) => (
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
          <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-400 mb-2">
            {isSearching ? 'Nenhum resultado encontrado' : 'Nenhum conteúdo disponível'}
          </h3>
          <p className="text-gray-500 text-sm">
            {isSearching 
              ? 'Tente usar termos diferentes ou ajustar os filtros'
              : 'Tente ajustar os filtros para encontrar conteúdo'
            }
          </p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={clearFilters}
            >
              Limpar Filtros
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Grid de conteúdo */}
          <div className={cn(
            viewMode === 'grid' 
              ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4'
              : 'space-y-4'
          )}>
            {content.map((item) => (
              <ContentCard
                key={item.id}
                item={item}
                viewMode={viewMode}
                onSelect={() => onItemSelect?.(item)}
              />
            ))}
          </div>

          {/* Paginação */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Página {currentPage + 1}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={prevPage}
                disabled={currentPage === 0}
                className="text-gray-400 border-gray-700 disabled:opacity-50"
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={nextPage}
                disabled={content.length < 50}
                className="text-gray-400 border-gray-700 disabled:opacity-50"
              >
                Próximo
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente para card de conteúdo
interface ContentCardProps {
  item: any;
  viewMode: 'grid' | 'list';
  onSelect: () => void;
}

function ContentCard({ item, viewMode, onSelect }: ContentCardProps) {
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  const isNewContent = (releaseDate?: string): boolean => {
    if (!releaseDate) return false;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return new Date(releaseDate) > thirtyDaysAgo;
  };

  if (viewMode === 'list') {
    return (
      <Card
        variant="default"
        size="md"
        interactive
        onClick={onSelect}
        className="flex gap-4"
      >
        <img
          src={item.coverImage || '/placeholder-movie.jpg'}
          alt={item.title}
          className="w-24 h-16 object-cover rounded-lg"
          loading="lazy"
        />
        <CardContent className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-white font-medium line-clamp-1 flex-1">
              {item.title}
            </h3>
            <div className="flex items-center gap-2 ml-4">
              {item.metadata?.isNew && (
                <Badge variant="success" size="xs">Novo</Badge>
              )}
              {item.metadata?.isTrending && (
                <Badge variant="warning" size="xs">Em Alta</Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>{item.year}</span>
            <span>•</span>
            <span>{item.genre}</span>
            <span>•</span>
            <span>{formatDuration(item.duration)}</span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <span>⭐</span>
              <span>{item.rating?.toFixed(1)}</span>
            </div>
          </div>
          {item.description && (
            <p className="text-gray-300 text-sm line-clamp-2 mt-2">
              {item.description}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Grid view
  return (
    <Card
      variant="default"
      size="md"
      interactive
      onClick={onSelect}
      className="overflow-hidden group"
    >
      <div className="aspect-video relative">
        <img
          src={item.coverImage || '/placeholder-movie.jpg'}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          {item.metadata?.isNew && (
            <Badge variant="success" size="xs">Novo</Badge>
          )}
          {item.metadata?.isTrending && (
            <Badge variant="warning" size="xs">Em Alta</Badge>
          )}
          {item.metadata?.isExclusive && (
            <Badge variant="primary" size="xs">Exclusivo</Badge>
          )}
        </div>

        {/* Rating */}
        <div className="absolute top-2 right-2">
          <Badge variant="default" size="xs" className="bg-black/60 backdrop-blur-sm">
            ⭐ {item.rating?.toFixed(1)}
          </Badge>
        </div>
      </div>

      <CardContent className="p-3">
        <h3 className="text-white font-medium line-clamp-2 text-sm mb-2">
          {item.title}
        </h3>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>{item.year}</span>
          <span>•</span>
          <span>{item.genre}</span>
          <span>•</span>
          <span>{formatDuration(item.duration)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// Função para obter label da categoria
function getCategoryLabel(key: string): string {
  const labels: Record<string, string> = {
    trending: 'Em Alta',
    newReleases: 'Lançamentos',
    awardWinners: 'Premiados',
    exclusive: 'Exclusivos',
    popular: 'Populares',
  };
  
  return labels[key] || key;
}
