import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, RefreshCw, Clock, Film, Tv, Play, Lock, TrendingUp, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRecentContent } from '@/hooks/useRecentContent';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ContentItem {
  id: string;
  title: string;
  type: 'movie' | 'series';
  poster?: string;
  year?: string;
  rating?: string;
  category?: string;
  genero?: string;
  created_at: string;
}

export default function PublicNotifications() {
  const { content, isLoading, refresh, lastUpdated } = useRecentContent(24);
  const { session } = useAuth();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Estados para conteúdo popular e destaque
  const [popularContent, setPopularContent] = useState<ContentItem[]>([]);
  const [featuredContent, setFeaturedContent] = useState<ContentItem[]>([]);
  const [loadingPopular, setLoadingPopular] = useState(true);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  const isLoggedIn = !!session;
  const categories = [...new Set(content.map(i => i.category || i.genero || 'Geral').filter(Boolean))];

  const filteredContent = selectedCategory 
    ? content.filter(i => (i.category || i.genero) === selectedCategory)
    : content;

  // Constante para timestamp de 24 horas atrás
  const vinteQuatroHorasAtras = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Buscar conteúdo popular (melhor avaliado) - apenas últimas 24h
  useEffect(() => {
    const fetchPopularContent = async () => {
      try {
        setLoadingPopular(true);
        
        // Buscar filmes melhor avaliados das últimas 24h
        const { data: movies } = await supabase
          .from('cinema')
          .select('id, titulo, capa, year, rating, category, genero, created_at')
          .gte('created_at', vinteQuatroHorasAtras)
          .not('rating', 'is', null)
          .order('rating', { ascending: false })
          .limit(10);

        // Buscar séries melhor avaliadas das últimas 24h
        const { data: series } = await supabase
          .from('series')
          .select('id_n, titulo, capa, ano, genero, created_at')
          .gte('created_at', vinteQuatroHorasAtras)
          .not('rating', 'is', null)
          .order('rating', { ascending: false })
          .limit(10);

        const formattedMovies: ContentItem[] = (movies || []).map((item: any) => ({
          id: item.id.toString(),
          title: item.titulo,
          type: 'movie' as const,
          poster: item.capa,
          year: item.year,
          rating: item.rating,
          category: item.category,
          genero: item.genero,
          created_at: item.created_at,
        }));

        const formattedSeries: ContentItem[] = (series || []).map((item: any) => ({
          id: item.id_n?.toString(),
          title: item.titulo,
          type: 'series' as const,
          poster: item.capa,
          year: item.ano,
          category: undefined,
          genero: item.genero,
          created_at: item.created_at,
        }));

        setPopularContent([...formattedMovies, ...formattedSeries].slice(0, 12));
      } catch (err) {
        console.error('Erro ao buscar conteúdo popular:', err);
      } finally {
        setLoadingPopular(false);
      }
    };

    fetchPopularContent();
  }, []);

  // Buscar filmes em destaque (mais recentes com poster) - apenas últimas 24h
  useEffect(() => {
    const fetchFeaturedContent = async () => {
      try {
        setLoadingFeatured(true);
        
        const { data: movies } = await supabase
          .from('cinema')
          .select('id, titulo, capa, year, rating, category, genero, created_at')
          .gte('created_at', vinteQuatroHorasAtras)
          .not('capa', 'is', null)
          .order('created_at', { ascending: false })
          .limit(8);

        const formattedMovies: ContentItem[] = (movies || []).map((item: any) => ({
          id: item.id.toString(),
          title: item.titulo,
          type: 'movie' as const,
          poster: item.capa,
          year: item.year,
          rating: item.rating,
          category: item.category,
          genero: item.genero,
          created_at: item.created_at,
        }));

        setFeaturedContent(formattedMovies);
      } catch (err) {
        console.error('Erro ao buscar filmes em destaque:', err);
      } finally {
        setLoadingFeatured(false);
      }
    };

    fetchFeaturedContent();
  }, []);

  const handlePlay = (item: any) => {
    if (!isLoggedIn) {
      toast.error('Faça login para assistir');
      return;
    }
    navigate(item.type === 'movie' ? `/details/cinema/${item.id}` : `/details/series/${item.id}`);
  };

  const formatTime = (d: string) => {
    const h = Math.floor((Date.now() - new Date(d).getTime()) / (1000 * 60 * 60));
    return h < 1 ? 'Agora' : h < 24 ? `Há ${h}h` : `Há ${Math.floor(h/24)}d`;
  };

  // Componente de Card reutilizável
  const ContentCard = ({ item, showBadge = true }: { item: ContentItem; showBadge?: boolean }) => (
    <motion.div 
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className="group cursor-pointer flex-shrink-0 w-[140px] sm:w-[160px]"
      onClick={() => handlePlay(item)}
    >
      <div className="aspect-[2/3] rounded-xl overflow-hidden bg-gray-800 relative transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(0,229,255,0.5)]">
        {item.poster ? (
          <img src={item.poster} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {item.type === 'movie' ? <Film className="w-12 h-12 text-gray-500" /> : <Tv className="w-12 h-12 text-gray-500" />}
          </div>
        )}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button className={`w-12 h-12 rounded-full flex items-center justify-center ${isLoggedIn ? 'bg-[#00E5FF]' : 'bg-gray-500'}`}>
            {isLoggedIn ? <Play className="w-5 h-5 ml-0.5 text-black" fill="black" /> : <Lock className="w-5 h-5" />}
          </button>
        </div>
        {showBadge && (
          <div className="absolute top-2 right-2 bg-[#00E5FF]/20 backdrop-blur-sm border border-[#00E5FF]/30 px-2 py-1 rounded-lg text-xs text-[#00E5FF] font-medium">
            {item.type === 'movie' ? 'Filme' : 'Série'}
          </div>
        )}
        {item.rating && (
          <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg text-xs flex items-center gap-1 border border-white/10">
            <Star className="w-3 h-3 text-yellow-400" fill="currentColor" /> {item.rating}
          </div>
        )}
      </div>
      <h3 className="mt-2 text-sm font-medium line-clamp-2 group-hover:text-[#00E5FF] transition-colors">{item.title}</h3>
      {item.year && <p className="text-gray-400 text-xs mt-0.5">{item.year}</p>}
    </motion.div>
  );

  // Componente de Seção com Scroll Horizontal
  const ContentSection = ({ 
    title, 
    icon: Icon, 
    content, 
    isLoading 
  }: { 
    title: string; 
    icon: any; 
    content: ContentItem[]; 
    isLoading: boolean;
  }) => {
    const scrollRef = React.useRef<HTMLDivElement>(null);
    
    const scroll = (direction: 'left' | 'right') => {
      if (scrollRef.current) {
        const scrollAmount = direction === 'left' ? -400 : 400;
        scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    };

    if (isLoading) {
      return (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Icon className="w-5 h-5 text-[#00E5FF]" />
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-[140px] sm:w-[160px] flex-shrink-0">
                <div className="aspect-[2/3] rounded-xl bg-gray-800 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (content.length === 0) return null;

    return (
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-[#00E5FF]" />
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => scroll('left')}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={() => scroll('right')}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div 
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {content.map((item) => (
            <ContentCard key={`${title}-${item.id}`} item={item} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white pt-[94px]">
      <div className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-blue-400" />
              <h1 className="text-xl font-bold">Novidades</h1>
              <span className="bg-blue-500 text-xs px-2 py-1 rounded-full">24h</span>
            </div>
            <button onClick={refresh} disabled={isLoading} className="p-2 rounded-lg hover:bg-gray-800">
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          {categories.length > 0 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              <button onClick={() => setSelectedCategory(null)} className={`px-3 py-1.5 rounded-full text-sm ${!selectedCategory ? 'bg-blue-600' : 'bg-gray-800'}`}>
                Todas ({content.length})
              </button>
              {categories.map(c => (
                <button key={c} onClick={() => setSelectedCategory(c)} className={`px-3 py-1.5 rounded-full text-sm ${selectedCategory === c ? 'bg-blue-600' : 'bg-gray-800'}`}>
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {!isLoggedIn && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-blue-400" />
              <p className="text-blue-200 text-sm">Faça login para assistir. Visualização pública disponível.</p>
            </div>
          </div>
        )}

        {/* Seção: Lançamentos Populares */}
        <ContentSection 
          title="Lançamentos Populares" 
          icon={TrendingUp} 
          content={popularContent} 
          isLoading={loadingPopular} 
        />

        {/* Seção: Filmes em Destaque */}
        <ContentSection 
          title="Filmes em Destaque" 
          icon={Star} 
          content={featuredContent} 
          isLoading={loadingFeatured} 
        />

        {/* Seção: Adicionados Recentemente */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-[#00E5FF]" />
            <h2 className="text-lg font-semibold">Adicionados Recentemente</h2>
            <span className="text-xs text-gray-400">({filteredContent.length} itens)</span>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="flex flex-col items-center gap-3">
                <RefreshCw className="w-8 h-8 animate-spin text-[#00E5FF]" />
                <p className="text-gray-400 text-sm">Carregando novidades...</p>
              </div>
            </div>
          ) : filteredContent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-8 max-w-md text-center shadow-2xl">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#00E5FF]/20 to-[#00E5FF]/5 flex items-center justify-center border border-[#00E5FF]/30">
                  <Bell className="w-8 h-8 text-[#00E5FF]" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Nenhum lançamento nas últimas 24h. Volte logo!</h3>
                <p className="text-gray-400 text-sm">Estamos sempre atualizando o catálogo com novidades.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-2 gap-4">
              {filteredContent.slice(0, 12).map(item => (
                <motion.div 
                  key={item.id} 
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="group cursor-pointer"
                  onClick={() => handlePlay(item)}
                >
                  <div className="aspect-[2/3] rounded-xl overflow-hidden bg-gray-800 relative transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(0,229,255,0.5)]">
                    {item.poster ? (
                      <img src={item.poster} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {item.type === 'movie' ? <Film className="w-12 h-12 text-gray-500" /> : <Tv className="w-12 h-12 text-gray-500" />}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button className={`w-12 h-12 rounded-full flex items-center justify-center ${isLoggedIn ? 'bg-[#00E5FF]' : 'bg-gray-500'}`}>
                        {isLoggedIn ? <Play className="w-5 h-5 ml-0.5 text-black" fill="black" /> : <Lock className="w-5 h-5" />}
                      </button>
                    </div>
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg text-xs flex items-center gap-1 border border-white/10">
                      <Clock className="w-3 h-3 text-[#00E5FF]" /> {formatTime(item.created_at)}
                    </div>
                    <div className="absolute top-2 right-2 bg-[#00E5FF]/20 backdrop-blur-sm border border-[#00E5FF]/30 px-2 py-1 rounded-lg text-xs text-[#00E5FF] font-medium">
                      {item.type === 'movie' ? 'Filme' : 'Série'}
                    </div>
                  </div>
                  <h3 className="mt-2 text-sm font-medium line-clamp-2 group-hover:text-[#00E5FF] transition-colors">{item.title}</h3>
                  {item.year && <p className="text-gray-400 text-xs mt-0.5">{item.year}</p>}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import * as React from 'react';
