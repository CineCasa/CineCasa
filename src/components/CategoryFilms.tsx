import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import PremiumCard from './PremiumCard';
import getSupabaseClient from '../lib/supabase';

interface CategoryFilmsProps {
  category: string;
  contentType: 'movies' | 'series';
}

interface FilmItem {
  id: number;
  titulo?: string;
  title?: string;
  poster?: string;
  backdrop?: string;
  category?: string;
  ano?: number;
  nota?: number;
  type?: string;
  year?: string;
  rating?: string;
}

const CategoryFilms: React.FC<CategoryFilmsProps> = ({ category, contentType }) => {
  const [films, setFilms] = useState<FilmItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const supabase = getSupabaseClient();

  const fetchFilms = async (pageNum: number = 0, reset: boolean = false) => {
    try {
      setLoading(true);
      const table = contentType === 'movies' ? 'cinema' : 'series';
      
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .ilike('genero', `%${category}%`)
        .order('ano', { ascending: false })
        .range(pageNum * 20, (pageNum + 1) * 20 - 1);

      if (error) {
        const { data: fallbackData } = await supabase
          .from(table)
          .select('*')
          .order('ano', { ascending: false })
          .range(pageNum * 20, (pageNum + 1) * 20 - 1);
          
        const mapped = (fallbackData || []).map((item: any) => ({
          id: item.id_n || item.id || Math.random(),
          title: item.titulo || item.title || 'Sem título',
          poster: item.capa || item.poster,
          year: item.ano?.toString(),
          rating: item.rating?.toString(),
        }));
        
        setFilms(prev => reset ? mapped : [...prev, ...mapped]);
      } else {
        const mapped = (data || []).map((item: any) => ({
          id: item.id_n || item.id || Math.random(),
          title: item.titulo || item.title || 'Sem título',
          poster: item.capa || item.poster,
          year: item.ano?.toString(),
          rating: item.rating?.toString(),
        }));
        
        setFilms(prev => reset ? mapped : [...prev, ...mapped]);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Erro:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilms(0, true);
  }, [category, contentType]);

  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container || loading) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = container;
    if (scrollLeft / (scrollWidth - clientWidth) > 0.8) {
      setPage(p => p + 1);
      fetchFilms(page + 1);
    }
  };

  const handleClick = (film: FilmItem) => {
    const path = contentType === 'movies' ? 'cinema' : 'series-details';
    navigate(`/${path === 'cinema' ? 'details/cinema' : 'series-details'}/${film.id}`);
  };

  // Título
  const titleText = typeof category === 'string' ? category : 'Categoria';

  return (
    <div className="w-full mb-8">
      {/* TÍTULO - FORA e ACIMA de tudo */}
      <h2 className="text-xl lg:text-2xl font-bold text-white px-4 lg:px-6 pt-4 pb-3">
        {titleText}
      </h2>

      {/* MOBILE: Scroll horizontal */}
      <div 
        ref={scrollRef}
        className="lg:hidden overflow-x-auto scrollbar-hide"
        onScroll={handleScroll}
        style={{ overflowY: 'hidden' }}
      >
        <div className="flex gap-4 px-4 pb-4">
          {films.map((film, i) => (
            <motion.div
              key={`m-${film.id}-${i}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-shrink-0 w-32 sm:w-40"
            >
              <PremiumCard
                id={film.id.toString()}
                title={film.title ?? ''}
                poster={film.poster ?? ''}
                type={contentType === 'movies' ? 'movie' : 'series'}
                year={film.year ?? ''}
                rating={film.rating ?? ''}
                onClick={() => handleClick(film)}
              />
            </motion.div>
          ))}
          {loading && [1,2,3,4].map(i => (
            <div key={`lm-${i}`} className="flex-shrink-0 w-32 sm:w-40">
              <div className="bg-gray-800 rounded-lg h-44 animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* DESKTOP: Grid */}
      <div className="hidden lg:block px-4">
        <div className="flex flex-wrap gap-4">
          {films.map((film, i) => (
            <motion.div
              key={`d-${film.id}-${i}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-[calc(20%-12.8px)]"
            >
              <PremiumCard
                id={film.id.toString()}
                title={film.title ?? ''}
                poster={film.poster ?? ''}
                type={contentType === 'movies' ? 'movie' : 'series'}
                year={film.year ?? ''}
                rating={film.rating ?? ''}
                onClick={() => handleClick(film)}
              />
            </motion.div>
          ))}
          {loading && [1,2,3,4,5].map(i => (
            <div key={`ld-${i}`} className="w-[calc(20%-12.8px)]">
              <div className="bg-gray-800 rounded-lg h-60 animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {!loading && films.length === 0 && (
        <div className="text-center text-white/60 py-8 px-4">
          <p>Nenhum {contentType === 'movies' ? 'filme' : 'série'} encontrado</p>
        </div>
      )}
    </div>
  );
};

export default CategoryFilms;
