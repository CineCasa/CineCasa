import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, Clock, X, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { useAdvancedSearch } from '@/hooks/useAdvancedSearch';
import { cn } from '@/lib/utils';

interface AdvancedSearchProps {
  userId?: string;
  onResultSelect?: (result: any) => void;
  onSearch?: (query: string) => void;
  className?: string;
  placeholder?: string;
  showFilters?: boolean;
  autoFocus?: boolean;
}

export function AdvancedSearch({
  userId,
  onResultSelect,
  onSearch,
  className,
  placeholder = 'Buscar filmes, séries, atores...',
  showFilters = true,
  autoFocus = false,
}: AdvancedSearchProps) {
  const {
    searchQuery,
    searchResults,
    suggestions,
    searchHistory,
    filters,
    isLoading,
    suggestionsLoading,
    showSuggestions,
    hasResults,
    isEmpty,
    hasQuery,
    handleSearch,
    handleSuggestionClick,
    updateFilters,
    clearFilters,
    clearHistory,
    setShowSuggestions,
  } = useAdvancedSearch({
    userId,
    enableSuggestions: true,
    enableSemanticSearch: true,
    enableHistory: true,
    maxSuggestions: 10,
    maxResults: 50,
  });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [focusedSuggestion, setFocusedSuggestion] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Navegação com teclado nas sugestões
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showSuggestions || suggestions.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedSuggestion(prev => (prev + 1) % suggestions.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedSuggestion(prev => prev <= 0 ? suggestions.length - 1 : prev - 1);
          break;
        case 'Enter':
          e.preventDefault();
          if (focusedSuggestion >= 0 && suggestions[focusedSuggestion]) {
            handleSuggestionClick(suggestions[focusedSuggestion]);
          } else {
            handleSearch(searchQuery);
          }
          break;
        case 'Escape':
          setShowSuggestions(false);
          setFocusedSuggestion(-1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showSuggestions, suggestions, focusedSuggestion, handleSuggestionClick, handleSearch, searchQuery]);

  // Click outside para fechar sugestões
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setFocusedSuggestion(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Componente de sugestões
  const SuggestionsDropdown = () => {
    if (!showSuggestions || suggestions.length === 0) return null;

    return (
      <div
        ref={suggestionsRef}
        className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-800 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto"
      >
        {/* Histórico */}
        {searchHistory.length > 0 && (
          <div className="p-2 border-b border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-400">Buscas recentes</span>
              <Button
                variant="ghost"
                size="xs"
                onClick={clearHistory}
                className="text-gray-500 hover:text-gray-400"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
            <div className="space-y-1">
              {searchHistory.slice(0, 5).map((term, index) => (
                <div
                  key={`history_${index}`}
                  className={cn(
                    'flex items-center gap-2 p-2 rounded cursor-pointer transition-colors',
                    'hover:bg-gray-800',
                    focusedSuggestion === index ? 'bg-gray-800' : ''
                  )}
                  onClick={() => handleSuggestionClick({
                    id: `history_${index}`,
                    text: term,
                    type: 'keyword',
                    category: 'history',
                  })}
                >
                  <Clock className="w-3 h-3 text-gray-500" />
                  <span className="text-sm text-gray-300">{term}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sugestões atuais */}
        <div className="p-2">
          <div className="space-y-1">
            {suggestions.map((suggestion, index) => {
              const historyOffset = searchHistory.length > 0 ? 5 : 0;
              const actualIndex = historyOffset + index;
              
              return (
                <div
                  key={suggestion.id}
                  className={cn(
                    'flex items-center gap-2 p-2 rounded cursor-pointer transition-colors',
                    'hover:bg-gray-800',
                    focusedSuggestion === actualIndex ? 'bg-gray-800' : ''
                  )}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <SuggestionIcon type={suggestion.type} />
                  <div className="flex-1">
                    <div className="text-sm text-gray-300">{suggestion.text}</div>
                    {suggestion.category && (
                      <div className="text-xs text-gray-500">{suggestion.category}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Componente de filtros avançados
  const AdvancedFiltersPanel = () => (
    <Card variant="outlined" className="p-4 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-medium">Filtros Avançados</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-gray-400 hover:text-gray-300"
        >
          Limpar Filtros
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Tipo de conteúdo */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Tipo de Conteúdo
          </label>
          <select
            value={filters.contentType}
            onChange={(e) => updateFilters({ contentType: e.target.value as any })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
          >
            <option value="all">Todos</option>
            <option value="movie">Filmes</option>
            <option value="series">Séries</option>
          </select>
        </div>

        {/* Faixa de anos */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Ano
          </label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="De"
              value={filters.yearRange[0]}
              onChange={(e) => updateFilters({ 
                yearRange: [parseInt(e.target.value) || 1900, filters.yearRange[1]] 
              })}
              className="flex-1"
            />
            <Input
              type="number"
              placeholder="Até"
              value={filters.yearRange[1]}
              onChange={(e) => updateFilters({ 
                yearRange: [filters.yearRange[0], parseInt(e.target.value) || new Date().getFullYear()] 
              })}
              className="flex-1"
            />
          </div>
        </div>

        {/* Faixa de rating */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Avaliação
          </label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={filters.ratingRange[0]}
              onChange={(e) => updateFilters({ 
                ratingRange: [parseFloat(e.target.value) || 0, filters.ratingRange[1]] 
              })}
              className="flex-1"
              min="0"
              max="10"
              step="0.1"
            />
            <Input
              type="number"
              placeholder="Max"
              value={filters.ratingRange[1]}
              onChange={(e) => updateFilters({ 
                ratingRange: [filters.ratingRange[0], parseFloat(e.target.value) || 10] 
              })}
              className="flex-1"
              min="0"
              max="10"
              step="0.1"
            />
          </div>
        </div>

        {/* Duração */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Duração
          </label>
          <select
            value={filters.durationRange}
            onChange={(e) => updateFilters({ durationRange: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
          >
            <option value="all">Todas</option>
            <option value="< 1h">Menos de 1h</option>
            <option value="1-2h">1-2h</option>
            <option value="2-3h">2-3h</option>
            <option value="> 3h">Mais de 3h</option>
          </select>
        </div>

        {/* País */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            País
          </label>
          <select
            value={filters.country}
            onChange={(e) => updateFilters({ country: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
          >
            <option value="all">Todos</option>
            <option value="brasil">Brasil</option>
            <option value="eua">EUA</option>
            <option value="reino-unido">Reino Unido</option>
            <option value="frança">França</option>
            <option value="japão">Japão</option>
          </select>
        </div>

        {/* Idioma */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Idioma
          </label>
          <select
            value={filters.language}
            onChange={(e) => updateFilters({ language: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
          >
            <option value="all">Todos</option>
            <option value="portugues">Português</option>
            <option value="ingles">Inglês</option>
            <option value="espanhol">Espanhol</option>
            <option value="frances">Francês</option>
            <option value="japones">Japonês</option>
          </select>
        </div>
      </div>

      {/* Ordenação */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Ordenar por
        </label>
        <div className="flex gap-2">
          <select
            value={filters.sortBy}
            onChange={(e) => updateFilters({ sortBy: e.target.value as any })}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
          >
            <option value="relevance">Relevância</option>
            <option value="rating">Avaliação</option>
            <option value="year">Ano</option>
            <option value="popularity">Popularidade</option>
          </select>
          <select
            value={filters.sortOrder}
            onChange={(e) => updateFilters({ sortOrder: e.target.value as any })}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
          >
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </div>
      </div>
    </Card>
  );

  // Componente de resultado
  const SearchResultItem = ({ result }: { result: any }) => (
    <Card
      variant="default"
      size="md"
      interactive
      onClick={() => onResultSelect?.(result)}
      className="flex gap-4"
    >
      <img
        src={result.coverImage || '/placeholder-movie.jpg'}
        alt={result.title}
        className="w-20 h-16 object-cover rounded-lg"
        loading="lazy"
      />
      <CardContent className="flex-1">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-white font-medium line-clamp-1 flex-1">
            {highlightText(result.title, filters.query)}
          </h3>
          <div className="flex items-center gap-2 ml-4">
            <Badge variant="default" size="xs">
              ⭐ {result.rating?.toFixed(1)}
            </Badge>
            {result.matchType === 'exact' && (
              <Badge variant="success" size="xs">Exato</Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span>{result.year}</span>
          <span>•</span>
          <span>{result.genre}</span>
          <span>•</span>
          <span>{formatDuration(result.duration)}</span>
        </div>
        {result.description && (
          <p className="text-gray-300 text-sm line-clamp-2 mt-2">
            {highlightText(result.description, filters.query)}
          </p>
        )}
      </CardContent>
    </Card>
  );

  // Função para destacar texto
  const highlightText = (text: string, query: string): string => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-500/30 text-yellow-300 px-1 rounded">$1</mark>');
  };

  // Função para formatar duração
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  // Componente de ícone de sugestão
  const SuggestionIcon = ({ type }: { type: string }) => {
    switch (type) {
      case 'title':
        return <Search className="w-4 h-4 text-blue-400" />;
      case 'genre':
        return <div className="w-4 h-4 bg-green-400 rounded-full" />;
      case 'actor':
        return <div className="w-4 h-4 bg-purple-400 rounded-full" />;
      case 'director':
        return <div className="w-4 h-4 bg-orange-400 rounded-full" />;
      case 'keyword':
        return <div className="w-4 h-4 bg-yellow-400 rounded-full" />;
      default:
        return <Search className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Barra de busca */}
      <div className="relative">
        <Input
          ref={searchInputRef}
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          autoFocus={autoFocus}
          leftIcon={<Search className="w-5 h-5" />}
          rightIcon={
            showFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="p-1 text-gray-400 hover:text-gray-300"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </Button>
            )
          }
          className="bg-gray-900 border-gray-700 pr-20"
        />
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Clear button */}
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSearch('')}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </Button>
        )}

        {/* Sugestões */}
        <SuggestionsDropdown />
      </div>

      {/* Filtros avançados */}
      {showFilters && showAdvancedFilters && (
        <AdvancedFiltersPanel />
      )}

      {/* Resultados da busca */}
      {hasQuery && (
        <div className="space-y-4">
          {/* Header dos resultados */}
          <div className="flex items-center justify-between">
            <h3 className="text-white font-medium">
              {hasResults 
                ? `${searchResults.length} resultados para "${filters.query}"`
                : `Nenhum resultado para "${filters.query}"`
              }
            </h3>
            {hasResults && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>Ordenar por:</span>
                <select
                  value={filters.sortBy}
                  onChange={(e) => updateFilters({ sortBy: e.target.value as any })}
                  className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm"
                >
                  <option value="relevance">Relevância</option>
                  <option value="rating">Avaliação</option>
                  <option value="year">Ano</option>
                  <option value="popularity">Popularidade</option>
                </select>
              </div>
            )}
          </div>

          {/* Lista de resultados */}
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
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
          ) : hasResults ? (
            <div className="space-y-4">
              {searchResults.map((result) => (
                <SearchResultItem key={result.id} result={result} />
              ))}
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
              <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-400 mb-2">
                Nenhum resultado encontrado
              </h3>
              <p className="text-gray-500 text-sm mb-4">
                Tente usar termos diferentes ou verificar a ortografia.
              </p>
              <div className="space-y-2 text-left max-w-md mx-auto">
                <p className="text-sm text-gray-400">
                  <strong>Dicas:</strong>
                </p>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Use termos mais genéricos</li>
                  <li>• Verifique a ortografia</li>
                  <li>• Tente sinônimos ou termos relacionados</li>
                  <li>• Use os filtros avançados para refinar</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Estatísticas da busca */}
      {hasResults && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h4 className="text-white font-medium mb-3">Estatísticas da Busca</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Resultados exatos:</span>
              <div className="text-white font-medium">
                {searchResults.filter(r => r.matchType === 'exact').length}
              </div>
            </div>
            <div>
              <span className="text-gray-400">Resultados parciais:</span>
              <div className="text-white font-medium">
                {searchResults.filter(r => r.matchType === 'partial').length}
              </div>
            </div>
            <div>
              <span className="text-gray-400">Score médio:</span>
              <div className="text-white font-medium">
                {searchResults.reduce((sum, r) => sum + r.matchScore, 0) / searchResults.length || 0}%
              </div>
            </div>
            <div>
              <span className="text-gray-400">Tempo de busca:</span>
              <div className="text-white font-medium">
                {isLoading ? 'Buscando...' : '< 1s'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
