import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { tmdbImageUrl } from '@/services/tmdb';
import { Film, ChevronLeft, ChevronRight, Play, Search } from 'lucide-react';
import HeroBanner from '@/components/HeroBanner';

// Componente para imagem com animação de loading
const ImageWithLoading: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  return (
    <div className="relative w-full h-full">
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-700 animate-pulse flex items-center justify-center z-10">
          <div className="w-8 h-8 border-2 border-gray-500 border-t-[#00d9ff] rounded-full animate-spin"></div>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
      />
    </div>
  );
};

interface Filme {
  id: string;
  titulo: string;
  poster: string;
  banner?: string;
  year?: string;
  rating?: string;
  category?: string;
  genre?: string;
  description?: string;
}

// Ordem EXATA das categorias conforme solicitado
const CATEGORIAS_ORDEM = [
  'Lançamento 2026',
  'Lançamento 2025',
  'Ação',
  'Aventura',
  'Infantil',
  'Finanças',
  'Anime',
  'Animação',
  'Comédia',
  'Drama',
  'Dorama',
  'Clássicos',
  'Negritude',
  'Crime',
  'Policial',
  'Família',
  'Musical',
  'Documentário',
  'Faroeste',
  'Ficção',
  'Nacional',
  'Religioso',
  'Romance',
  'Terror',
  'Suspense',
  'Adulto'
];

const FilmesPorCategoria: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Record<string, Filme[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    fetchFilmes();
  }, []);

  const fetchFilmes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Debug: verificar configuração do Supabase
      console.log('[FilmesPorCategoria] Verificando Supabase...');
      console.log('[FilmesPorCategoria] VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? 'Definida' : 'FALTANDO');
      console.log('[FilmesPorCategoria] VITE_SUPABASE_PUBLISHABLE_KEY:', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? 'Definida' : 'FALTANDO');
      
      const { data, error: supabaseError } = await supabase
        .from('cinema')
        .select('*')
        .order('created_at', { ascending: false });
      
      console.log('[FilmesPorCategoria] Resposta:', { dataLength: data?.length, error: supabaseError });
      
      if (supabaseError) {
        console.error('[FilmesPorCategoria] Erro Supabase:', supabaseError);
        throw supabaseError;
      }
      
      // Agrupar por categoria
      const grouped: Record<string, Filme[]> = {};
      
      // Inicializar todas as categorias na ordem
      CATEGORIAS_ORDEM.forEach(cat => {
        grouped[cat] = [];
      });
      
      (data || []).forEach((filme: any) => {
        // Suportar múltiplas categorias: pode ser array ou string separada por vírgula
        let categoriasDoFilme: string[] = [];
        
        if (Array.isArray(filme.category)) {
          categoriasDoFilme = filme.category.map((c: string) => c?.trim()).filter(Boolean);
        } else if (typeof filme.category === 'string') {
          // Pode ser "Ação, Aventura" ou "Ação;Aventura" ou simplesmente "Ação"
          categoriasDoFilme = filme.category
            .split(/[,;]/)
            .map((c: string) => c?.trim())
            .filter(Boolean);
        }
        
        // Se não tiver categoria, coloca em "Outros"
        if (categoriasDoFilme.length === 0) {
          categoriasDoFilme = ['Outros'];
        }
        
        // Adicionar o filme em CADA categoria que ele pertence
        categoriasDoFilme.forEach((cat: string) => {
          // Só adicionar se a categoria está na lista definida
          if (CATEGORIAS_ORDEM.includes(cat)) {
            grouped[cat].push({
              id: filme.id?.toString() || '',
              titulo: filme.titulo || 'Sem título',
              poster: filme.poster || '',
              banner: filme.banner || '',
              year: filme.year || '',
              rating: filme.rating || 'N/A',
              category: cat,
              genre: filme.genre || '',
              description: filme.description || '',
            });
          }
        });
      });
      
      setCategories(grouped);
    } catch (err: any) {
      console.error('[FilmesPorCategoria] Erro completo:', err);
      console.error('[FilmesPorCategoria] Erro message:', err.message);
      console.error('[FilmesPorCategoria] Erro stack:', err.stack);
      
      // Identificar a origem do erro
      let errorMsg = err.message || 'Erro ao carregar filmes';
      if (errorMsg.includes('API key')) {
        errorMsg = 'Erro de autenticação com o banco de dados. Verifique as configurações do Supabase.';
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const scrollRow = (category: string, direction: 'left' | 'right') => {
    const row = rowRefs.current[category];
    if (row) {
      const scrollAmount = direction === 'left' ? -800 : 800;
      row.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleFilmeClick = (filme: Filme) => {
    navigate(`/details/movie/${filme.id}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Film className="animate-spin mx-auto mb-4 text-red-500" size={48} />
          <span className="text-white text-xl">Carregando filmes...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-white text-2xl mb-2">Erro ao carregar filmes</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => fetchFilmes()}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  // Filtrar apenas categorias que têm filmes
  const categoriasComFilmes = CATEGORIAS_ORDEM.filter(
    cat => categories[cat] && categories[cat].length > 0
  );

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Hero Banner - YouTube Style */}
      <HeroBanner pageType="movies" className="mt-16" />

      {/* Rows de Categorias */}
      <div className="pt-8 space-y-8">
        {categoriasComFilmes.map((categoryName, categoryIndex) => (
          <motion.div
            key={categoryName}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
            className="relative group"
            onMouseEnter={() => setHoveredRow(categoryName)}
            onMouseLeave={() => setHoveredRow(null)}
          >
            {/* Título da Categoria */}
            <div className="max-w-[1920px] mx-auto px-4 md:px-8 mb-3">
              <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                {categoryName}
                <span className="text-sm font-normal text-gray-500">
                  ({categories[categoryName].length})
                </span>
                <ChevronRight 
                  size={20} 
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500"
                />
              </h2>
            </div>

            {/* Container do Scroll Horizontal */}
            <div className="relative">
              {/* Botão Scroll Left */}
              <button
                onClick={() => scrollRow(categoryName, 'left')}
                className={`absolute left-0 top-0 bottom-0 z-20 w-16 bg-black/80 hover:bg-black/90 flex items-center justify-center transition-opacity duration-300 ${
                  hoveredRow === categoryName ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <ChevronLeft size={40} className="text-white" />
              </button>

              {/* Botão Scroll Right */}
              <button
                onClick={() => scrollRow(categoryName, 'right')}
                className={`absolute right-0 top-0 bottom-0 z-20 w-16 bg-black/80 hover:bg-black/90 flex items-center justify-center transition-opacity duration-300 ${
                  hoveredRow === categoryName ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <ChevronRight size={40} className="text-white" />
              </button>

              {/* Row de Filmes */}
              <div
                ref={(el) => { rowRefs.current[categoryName] = el; }}
                className="flex gap-4 overflow-x-auto scrollbar-hide px-4 md:px-8 pb-4 scroll-smooth"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {categories[categoryName].map((filme, index) => (
                  <motion.div
                    key={filme.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    onClick={() => handleFilmeClick(filme)}
                    className="flex-shrink-0 w-[calc(20%-0.8rem)] min-w-[160px] max-w-[220px] cursor-pointer group/card"
                  >
                    <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 shadow-lg transition-transform duration-300 group-hover/card:scale-105 group-hover/card:z-10">
                      {filme.poster ? (
                        <ImageWithLoading 
                          src={tmdbImageUrl(filme.poster, 'w500')}
                          alt={filme.titulo}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-700">
                          <Film className="w-12 h-12 text-gray-500" />
                        </div>
                      )}
                      
                      {/* Overlay no hover */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                            <Play size={20} className="text-white ml-0.5" fill="currentColor" />
                          </div>
                        </div>
                        <h3 className="text-white font-bold text-sm line-clamp-2">
                          {filme.titulo}
                        </h3>
                        {filme.year && (
                          <p className="text-gray-300 text-xs mt-1">{filme.year}</p>
                        )}
                      </div>

                      {/* Rating badge */}
                      {filme.rating && filme.rating !== 'N/A' && (
                        <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs font-bold px-1.5 py-0.5 rounded">
                          {filme.rating}
                        </div>
                      )}
                    </div>
                    
                    {/* Título abaixo do card */}
                    <p className="mt-2 text-sm text-gray-300 truncate group-hover/card:text-white transition-colors">
                      {filme.titulo}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}

        {/* Mensagem quando não há filmes */}
        {categoriasComFilmes.length === 0 && (
          <div className="text-center py-20">
            <Film className="mx-auto mb-4 text-gray-600" size={64} />
            <h3 className="text-2xl font-semibold text-white mb-2">
              Nenhum filme encontrado
            </h3>
            <p className="text-gray-400">
              Não há filmes disponíveis no momento.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilmesPorCategoria;
