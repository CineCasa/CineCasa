import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Search as SearchIcon, Film, PlaySquare, Star, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchResult {
  id: string;
  title: string;
  poster: string;
  type: 'movie' | 'series';
  year?: string;
  rating?: string;
  genre?: string;
  description?: string;
}

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";
  
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(query);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Busca em tempo real no Supabase
  const performSearch = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const searchLower = searchTerm.toLowerCase();
      
      // Buscar em filmes (cinema) - busca parcial em título, descrição e gênero
      const { data: moviesData, error: moviesError } = await supabase
        .from('cinema')
        .select('id, titulo, poster, year, rating, category, description')
        .or(`titulo.ilike.%${searchLower}%,description.ilike.%${searchLower}%,category.ilike.%${searchLower}%`)
        .limit(20);

      if (moviesError) {
        console.error('Erro ao buscar filmes:', moviesError);
      }

      // Buscar em séries - busca parcial em título e gênero (description não existe na tabela)
      const { data: seriesData, error: seriesError } = await supabase
        .from('series')
        .select('id_n, titulo, capa, banner, ano, rating, genero, sinopse')
        .or(`titulo.ilike.%${searchLower}%,sinopse.ilike.%${searchLower}%,genero.ilike.%${searchLower}%`)
        .limit(20);

      if (seriesError) {
        console.error('Erro ao buscar séries:', seriesError);
      }

      const allResults: SearchResult[] = [
        ...(moviesData || []).map(item => ({
          id: item.id.toString(),
          title: item.titulo || 'Sem título',
          poster: item.poster || '/placeholder-movie.jpg',
          type: 'movie' as const,
          year: item.year?.toString(),
          rating: item.rating?.toString(),
          genre: item.category,
          description: item.description
        })),
        ...(seriesData || []).map(item => ({
          id: item.id_n?.toString() || '',
          title: item.titulo || 'Sem título',
          poster: item.capa || item.banner || '/placeholder-series.jpg',
          type: 'series' as const,
          year: item.ano?.toString(),
          rating: item.rating?.toString(),
          genre: item.genero,
          description: item.sinopse
        }))
      ];

      // Ordenar por relevância (títulos que começam com a busca primeiro)
      const sortedResults = allResults.sort((a, b) => {
        const aStartsWith = a.title.toLowerCase().startsWith(searchLower);
        const bStartsWith = b.title.toLowerCase().startsWith(searchLower);
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        return a.title.localeCompare(b.title);
      });

      setResults(sortedResults);
    } catch (error) {
      console.error('Erro na busca:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce para busca em tempo real
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery, performSearch]);

  // Atualizar URL quando digitar
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setSearchParams(value ? { q: value } : {});
  };

  // Limpar busca
  const clearSearch = () => {
    setSearchQuery('');
    setResults([]);
    setSearchParams({});
  };

  // Navegar para detalhes
  const handleResultClick = (result: SearchResult) => {
    const path = result.type === 'movie' 
      ? `/details/cinema/${result.id}` 
      : `/details/series/${result.id}`;
    navigate(path);
  };

  return (
    <main className="min-h-screen bg-black text-white pt-[70px] px-4 md:px-8 lg:px-12 pb-20">
      {/* Campo de busca fixo no topo */}
      <div className="sticky top-[70px] z-30 bg-black/95 backdrop-blur-md py-6 border-b border-white/10">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <Input
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              placeholder="Buscar filmes, séries, gêneros..."
              className="w-full pl-12 pr-12 py-6 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-500 focus:ring-cyan-500/20 text-lg"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            )}
          </div>
          
          {/* Contador de resultados */}
          {!isLoading && searchQuery && (
            <p className="mt-3 text-sm text-gray-400">
              {results.length} {results.length === 1 ? 'resultado' : 'resultados'} para "{searchQuery}"
            </p>
          )}
        </div>
      </div>

      {/* Área de resultados */}
      <div className="max-w-7xl mx-auto mt-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-gray-400">Buscando...</p>
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
            {results.map((result, idx) => (
              <motion.div
                key={`${result.type}-${result.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.03, 0.5) }}
                className="group cursor-pointer"
                onClick={() => handleResultClick(result)}
              >
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-gray-800 border border-white/10 transition-all duration-300 group-hover:scale-105 group-hover:border-cyan-500/50 group-hover:shadow-[0_0_20px_rgba(0,229,255,0.3)]">
                  <img
                    src={result.poster}
                    alt={result.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-movie.jpg';
                    }}
                  />
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Info overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <div className="flex items-center gap-2 mb-1">
                      {result.type === 'movie' ? (
                        <Film size={14} className="text-cyan-400" />
                      ) : (
                        <PlaySquare size={14} className="text-cyan-400" />
                      )}
                      <span className="text-xs text-cyan-400 uppercase">
                        {result.type === 'movie' ? 'Filme' : 'Série'}
                      </span>
                    </div>
                    <h3 className="text-white font-semibold text-sm line-clamp-2">{result.title}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-300">
                      {result.year && <span>{result.year}</span>}
                      {result.rating && (
                        <span className="flex items-center gap-1">
                          <Star size={10} className="text-yellow-500 fill-current" />
                          {result.rating}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Título abaixo do card */}
                <h3 className="mt-2 text-sm text-white line-clamp-1 group-hover:text-cyan-400 transition-colors">
                  {result.title}
                </h3>
              </motion.div>
            ))}
          </div>
        ) : searchQuery.trim() !== "" ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-white/5 p-6 rounded-full mb-4">
              <SearchIcon size={48} className="text-gray-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Nenhum resultado encontrado</h2>
            <p className="text-gray-400 max-w-md">
              Não encontramos nada para "{searchQuery}". Tente buscar por outros termos, gêneros ou verifique a ortografia.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-white/5 p-6 rounded-full mb-4">
              <SearchIcon size={48} className="text-gray-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Comece sua busca</h2>
            <p className="text-gray-400 max-w-md">
              Digite o nome de um filme, série, gênero ou qualquer termo para encontrar conteúdo.
            </p>
          </div>
        )}
      </div>
    </main>
  );
};

export default Search;
