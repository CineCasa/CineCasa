import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Film, Tv, Clock, RefreshCw, Play, Star, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';

interface ContentItem {
  id: string;
  title: string;
  type: 'movie' | 'series';
  poster?: string;
  year?: string;
  category?: string;
  genero?: string;
  created_at: string;
  tmdb_id?: number;
  rating?: string;
  description?: string;
}

export const NotificationsPage: React.FC = () => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { session } = useAuth();
  const navigate = useNavigate();
  
  const isLoggedIn = !!session;

  // Buscar conteúdo das últimas 24h
  const fetchRecentContent = useCallback(async () => {
    try {
      setIsLoading(true);
      const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      console.log(`[NotificationsPage] Buscando conteúdo desde: ${cutoffDate}`);

      // Buscar filmes das últimas 24h
      const { data: movies, error: moviesError } = await supabase
        .from('cinema')
        .select('id, titulo, poster, year, category, genero, created_at, tmdb_id, rating, description')
        .gte('created_at', cutoffDate)
        .order('created_at', { ascending: false });

      if (moviesError) {
        console.error('[NotificationsPage] Erro ao buscar filmes:', moviesError);
      }

      // Buscar séries (sem filtro de data pois pode não ter created_at)
      const { data: series, error: seriesError } = await supabase
        .from('series')
        .select('id_n, titulo, ano, genero, tmdb_id, descricao')
        .limit(20);

      if (seriesError) {
        console.error('[NotificationsPage] Erro ao buscar séries:', seriesError);
      }

      // Formatar filmes
      const formattedMovies: ContentItem[] = (movies || []).map((item: any) => ({
        id: item.id.toString(),
        title: item.titulo,
        type: 'movie' as const,
        poster: item.poster,
        year: item.year,
        category: item.category,
        genero: item.genero,
        created_at: item.created_at,
        tmdb_id: item.tmdb_id,
        rating: item.rating,
        description: item.description,
      }));

      // Formatar séries
      const formattedSeries: ContentItem[] = (series || []).map((item: any) => ({
        id: item.id_n?.toString() || item.id?.toString(),
        title: item.titulo,
        type: 'series' as const,
        poster: undefined,
        year: item.ano,
        category: undefined,
        genero: item.genero,
        created_at: new Date().toISOString(),
        tmdb_id: item.tmdb_id,
        rating: undefined,
        description: item.descricao,
      }));

      const allContent = [...formattedMovies, ...formattedSeries];
      
      console.log(`[NotificationsPage] Total encontrado: ${allContent.length}`);
      
      setContent(allContent);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('[NotificationsPage] Erro:', err);
      toast.error('Erro ao carregar conteúdo recente');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Polling para atualização automática
  useEffect(() => {
    fetchRecentContent();

    // Atualizar a cada 2 minutos
    const interval = setInterval(() => {
      fetchRecentContent();
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchRecentContent]);

  // Extrair categorias únicas
  const categories = [...new Set(content.map(item => item.category || item.genero || 'Geral').filter(Boolean))];

  // Filtrar conteúdo por categoria
  const filteredContent = selectedCategory 
    ? content.filter(item => (item.category || item.genero) === selectedCategory)
    : content;

  // Agrupar por categoria
  const contentByCategory = filteredContent.reduce((acc, item) => {
    const cat = item.category || item.genero || 'Geral';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, ContentItem[]>);

  const handlePlay = (item: ContentItem) => {
    if (!isLoggedIn) {
      toast.error('Faça login para assistir', {
        description: 'Você precisa estar logado para acessar o conteúdo.',
        action: {
          label: 'Entrar',
          onClick: () => navigate('/'),
        },
      });
      return;
    }

    const path = item.type === 'movie' 
      ? `/details/cinema/${item.id}` 
      : `/details/series/${item.id}`;
    navigate(path);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Agora há pouco';
    if (diffInHours === 1) return 'Há 1 hora';
    if (diffInHours < 24) return `Há ${diffInHours} horas`;
    return `Há ${Math.floor(diffInHours / 24)} dias`;
  };

  return (
    <div className="min-h-screen bg-black text-white pt-14 sm:pt-[70px] md:pt-[94px]">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
              <h1 className="text-lg sm:text-xl font-bold">Novidades</h1>
              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full hidden sm:inline">
                Últimas 24h
              </span>
            </div>
            <div className="flex items-center gap-3">
              {lastUpdated && (
                <span className="text-gray-400 text-sm hidden md:inline">
                  Atualizado: {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              <button
                onClick={fetchRecentContent}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-800 transition-colors"
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Filtro de categorias */}
          {categories.length > 0 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                  !selectedCategory 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Todas ({content.length})
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                    selectedCategory === cat 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {cat} ({contentByCategory[cat]?.length || 0})
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        {!isLoggedIn && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-full">
                <Bell className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-blue-200 font-medium">Modo Visualização</p>
                <p className="text-blue-200/70 text-sm">
                  Faça login para assistir ao conteúdo. Você pode visualizar todas as novidades sem estar logado.
                </p>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8 sm:py-12">
            <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-blue-400" />
            <span className="ml-2 text-sm sm:text-base text-gray-400">Carregando novidades...</span>
          </div>
        ) : filteredContent.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <Bell className="w-10 h-10 sm:w-12 sm:h-12 text-gray-600 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-400 mb-2">
              Nenhuma novidade nas últimas 24h
            </h3>
            <p className="text-sm text-gray-500 px-4">
              Volte mais tarde para ver os novos conteúdos adicionados.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(contentByCategory).map(([category, items]) => (
              <div key={category}>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  {items[0]?.type === 'movie' ? (
                    <Film className="w-5 h-5 text-blue-400" />
                  ) : (
                    <Tv className="w-5 h-5 text-purple-400" />
                  )}
                  {category}
                  <span className="text-sm text-gray-400 font-normal">({items.length})</span>
                </h2>
                
                {/* Grid responsivo de conteúdos */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                  {items.map((item) => (
                    <div 
                      key={item.id} 
                      className="group relative cursor-pointer"
                      onClick={() => handlePlay(item)}
                    >
                      {/* Card com poster */}
                      <div className="aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 relative shadow-lg">
                        {item.poster ? (
                          <img 
                            src={item.poster} 
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-700">
                            {item.type === 'movie' ? (
                              <Film className="w-12 h-12 text-gray-500" />
                            ) : (
                              <Tv className="w-12 h-12 text-gray-500" />
                            )}
                          </div>
                        )}
                        
                        {/* Overlay no hover */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                          <button className={`w-12 h-12 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform ${
                            isLoggedIn ? 'bg-blue-500' : 'bg-gray-500'
                          }`}>
                            {isLoggedIn ? (
                              <Play className="w-5 h-5 ml-0.5" fill="white" />
                            ) : (
                              <span className="text-xs">Login</span>
                            )}
                          </button>
                        </div>

                        {/* Badge de tempo */}
                        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-xs text-white flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(item.created_at)}
                        </div>

                        {/* Badge de tipo */}
                        <div className="absolute top-2 right-2 bg-blue-500/90 backdrop-blur-sm px-2 py-1 rounded text-xs text-white font-medium">
                          {item.type === 'movie' ? 'Filme' : 'Série'}
                        </div>

                        {/* Badge de rating */}
                        {item.rating && (
                          <div className="absolute bottom-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                            <Star className="w-3 h-3" fill="currentColor" />
                            {item.rating}
                          </div>
                        )}
                      </div>

                      {/* Informações abaixo do poster */}
                      <div className="mt-2">
                        <h3 className="text-white text-sm font-medium line-clamp-2 group-hover:text-blue-400 transition-colors">
                          {item.title}
                        </h3>
                        {item.year && (
                          <p className="text-gray-400 text-xs flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3" />
                            {item.year}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
