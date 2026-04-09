import React from 'react';
import { ContinueWatchingRow } from '@/components/ContinueWatchingRow';
import { RecommendationRow } from '@/components/RecommendationRow';
import { ContentDiscovery } from '@/components/ContentDiscovery';
import { AdvancedSearch } from '@/components/AdvancedSearch';
import { useWatchProgress } from '@/hooks/useWatchProgress';
import { useContinueWatching } from '@/hooks/useContinueWatching';
import { useRecommendations } from '@/hooks/useRecommendations';
import { cn } from '@/lib/utils';

interface ContentIntelligenceProps {
  userId?: string;
  onItemSelect?: (item: any) => void;
  onSearch?: (query: string) => void;
  className?: string;
  showSections?: {
    continueWatching?: boolean;
    recommendations?: boolean;
    discovery?: boolean;
    search?: boolean;
  };
}

export function ContentIntelligence({
  userId,
  onItemSelect,
  onSearch,
  className,
  showSections = {
    continueWatching: true,
    recommendations: true,
    discovery: true,
    search: true,
  },
}: ContentIntelligenceProps) {
  const { progress, updateProgress, markAsCompleted } = useWatchProgress({ userId });
  const { stats: continueStats } = useContinueWatching({ userId });
  const { stats: recommendationStats } = useRecommendations({ userId });

  return (
    <div className={cn('space-y-8', className)}>
      {/* Continue Watching */}
      {showSections.continueWatching && userId && (
        <section>
          <ContinueWatchingRow
            userId={userId}
            limit={6}
            title="Continuar Assistindo"
            showClearAll={true}
            onItemSelect={onItemSelect}
          />
          
          {/* Estatísticas do continue watching */}
          {continueStats.total > 0 && (
            <div className="mt-4 bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">Suas Atividades</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Em andamento:</span>
                  <div className="text-white font-medium">{continueStats.total}</div>
                </div>
                <div>
                  <span className="text-gray-400">Filmes:</span>
                  <div className="text-white font-medium">{continueStats.movies}</div>
                </div>
                <div>
                  <span className="text-gray-400">Séries:</span>
                  <div className="text-white font-medium">{continueStats.series}</div>
                </div>
                <div>
                  <span className="text-gray-400">Progresso médio:</span>
                  <div className="text-white font-medium">{Math.round(continueStats.averageProgress)}%</div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Recommendations */}
      {showSections.recommendations && userId && (
        <section>
          <RecommendationRow
            userId={userId}
            limit={12}
            title="Recomendados para Você"
            categories={['personalized', 'similar', 'trending']}
            onItemSelect={onItemSelect}
            showMore={true}
          />
          
          {/* Estatísticas das recomendações */}
          {recommendationStats.total > 0 && (
            <div className="mt-4 bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">Suas Recomendações</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Total:</span>
                  <div className="text-white font-medium">{recommendationStats.total}</div>
                </div>
                <div>
                  <span className="text-gray-400">Personalizados:</span>
                  <div className="text-white font-medium">{recommendationStats.byCategory.personalized || 0}</div>
                </div>
                <div>
                  <span className="text-gray-400">Similares:</span>
                  <div className="text-white font-medium">{recommendationStats.byCategory.similar || 0}</div>
                </div>
                <div>
                  <span className="text-gray-400">Em alta:</span>
                  <div className="text-white font-medium">{recommendationStats.byCategory.trending || 0}</div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-800">
                <div className="text-sm text-gray-400">
                  <strong>Top gêneros recomendados:</strong>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {Object.entries(recommendationStats.topGenres)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([genre, count]) => (
                      <span
                        key={genre}
                        className="bg-primary/20 text-primary px-2 py-1 rounded text-xs"
                      >
                        {genre} ({count})
                      </span>
                    ))}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Advanced Search */}
      {showSections.search && (
        <section>
          <AdvancedSearch
            userId={userId}
            onResultSelect={onItemSelect}
            onSearch={onSearch}
            showFilters={true}
            autoFocus={false}
            placeholder="Buscar filmes, séries, atores, diretores..."
          />
        </section>
      )}

      {/* Content Discovery */}
      {showSections.discovery && (
        <section>
          <ContentDiscovery
            userId={userId}
            onItemSelect={onItemSelect}
          />
        </section>
      )}

      {/* Progress Sync Status */}
      {userId && (
        <section className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h4 className="text-white font-medium mb-3">Status de Sincronização</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-400">Progresso:</span>
              <span className="text-white font-medium">Ativo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-400">Cache:</span>
              <span className="text-white font-medium">Sincronizado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-400">Real-time:</span>
              <span className="text-white font-medium">Conectado</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            Seu progresso é salvo automaticamente e sincronizado entre dispositivos.
          </div>
        </section>
      )}
    </div>
  );
}

// Componente para dashboard de conteúdo
export function ContentDashboard({ userId }: { userId?: string }) {
  const handleItemSelect = (item: any) => {
    console.log('Item selecionado:', item);
    // Aqui você pode navegar para a página de detalhes
  };

  const handleSearch = (query: string) => {
    console.log('Busca:', query);
    // Aqui você pode navegar para a página de resultados
  };

  return (
    <div className="container mx-auto py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Descubra Conteúdo Incrível
        </h1>
        <p className="text-gray-400 text-lg">
          Filmes, séries e recomendações personalizadas baseadas no seu gosto
        </p>
      </header>

      <ContentIntelligence
        userId={userId}
        onItemSelect={handleItemSelect}
        onSearch={handleSearch}
        showSections={{
          continueWatching: true,
          recommendations: true,
          discovery: true,
          search: true,
        }}
      />
    </div>
  );
}

// Componente para página inicial personalizada
export function PersonalizedHome({ userId }: { userId?: string }) {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative h-96 bg-gradient-to-br from-primary to-purple-600 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center p-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Bem-vindo de volta!
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-2xl">
            Continue de onde parou ou descubra algo novo hoje
          </p>
          <AdvancedSearch
            userId={userId}
            autoFocus={true}
            placeholder="O que você quer assistir hoje?"
            showFilters={false}
            className="max-w-2xl mx-auto"
          />
        </div>
      </section>

      {/* Content Intelligence */}
      <ContentIntelligence
        userId={userId}
        showSections={{
          continueWatching: true,
          recommendations: true,
          discovery: false, // Skip discovery na home
          search: false, // Skip search na home (já está no hero)
        }}
      />
    </div>
  );
}

// Componente para página de exploração
export function ExplorePage({ userId }: { userId?: string }) {
  return (
    <div className="container mx-auto py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Explorar Catálogo
        </h1>
        <p className="text-gray-400 text-lg">
          Descubra novos filmes e séries com filtros avançados
        </p>
      </header>

      <ContentIntelligence
        userId={userId}
        showSections={{
          continueWatching: false, // Não mostrar continue watching na explore
          recommendations: true,
          discovery: true,
          search: true,
        }}
      />
    </div>
  );
}

// Componente para página de busca
export function SearchPage({ userId }: { userId?: string }) {
  return (
    <div className="container mx-auto py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Busca Avançada
        </h1>
        <p className="text-gray-400 text-lg">
          Encontre exatamente o que procura com busca inteligente
        </p>
      </header>

      <ContentIntelligence
        userId={userId}
        showSections={{
          continueWatching: false, // Não mostrar continue watching na busca
          recommendations: false, // Não mostrar recomendações na busca
          discovery: false, // Não mostrar discovery na busca
          search: true,
        }}
      />
    </div>
  );
}
