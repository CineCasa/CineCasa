import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from "@/components/ui/input";
import { MOVIE_CATEGORIES } from '@/data/movieCategories';
import { Film, Search, Sparkles, Clapperboard, Sword, Rocket, Baby, TrendingUp, Smile, Theater, Heart, Ghost, Skull, Music, FileText, Crosshair, Globe, Church, Users, Briefcase, Star, Tv } from 'lucide-react';

interface CategoryCount {
  id: string;
  name: string;
  count: number;
}

const categoryIcons: Record<string, React.ReactNode> = {
  'lancamento-2026': <Sparkles className="w-6 h-6" />,
  'lancamento-2025': <Sparkles className="w-6 h-6" />,
  'acao': <Sword className="w-6 h-6" />,
  'aventura': <Rocket className="w-6 h-6" />,
  'infantil': <Baby className="w-6 h-6" />,
  'financas': <TrendingUp className="w-6 h-6" />,
  'anime': <Tv className="w-6 h-6" />,
  'animacao': <Smile className="w-6 h-6" />,
  'comedia': <Smile className="w-6 h-6" />,
  'drama': <Theater className="w-6 h-6" />,
  'dorama': <Heart className="w-6 h-6" />,
  'classicos': <Film className="w-6 h-6" />,
  'negritude': <Users className="w-6 h-6" />,
  'crime': <Briefcase className="w-6 h-6" />,
  'policial': <Crosshair className="w-6 h-6" />,
  'familia': <Users className="w-6 h-6" />,
  'musical': <Music className="w-6 h-6" />,
  'documentario': <FileText className="w-6 h-6" />,
  'faroeste': <Crosshair className="w-6 h-6" />,
  'ficcao': <Rocket className="w-6 h-6" />,
  'nacional': <Globe className="w-6 h-6" />,
  'religioso': <Church className="w-6 h-6" />,
  'romance': <Heart className="w-6 h-6" />,
  'terror': <Ghost className="w-6 h-6" />,
  'suspense': <Skull className="w-6 h-6" />,
  'adulto': <Star className="w-6 h-6" />,
};

const categoryColors: Record<string, string> = {
  'lancamento-2026': 'from-yellow-500 to-orange-500',
  'lancamento-2025': 'from-green-500 to-teal-500',
  'acao': 'from-red-500 to-orange-500',
  'aventura': 'from-blue-500 to-cyan-500',
  'infantil': 'from-pink-400 to-purple-400',
  'financas': 'from-green-600 to-emerald-600',
  'anime': 'from-purple-500 to-pink-500',
  'animacao': 'from-yellow-400 to-orange-400',
  'comedia': 'from-yellow-300 to-orange-300',
  'drama': 'from-gray-400 to-gray-600',
  'dorama': 'from-pink-500 to-rose-500',
  'classicos': 'from-amber-500 to-yellow-600',
  'negritude': 'from-purple-600 to-indigo-600',
  'crime': 'from-red-600 to-red-800',
  'policial': 'from-blue-600 to-blue-800',
  'familia': 'from-green-400 to-teal-400',
  'musical': 'from-purple-400 to-pink-400',
  'documentario': 'from-gray-500 to-gray-700',
  'faroeste': 'from-orange-600 to-red-600',
  'ficcao': 'from-indigo-500 to-purple-500',
  'nacional': 'from-green-500 to-yellow-500',
  'religioso': 'from-blue-400 to-indigo-400',
  'romance': 'from-pink-400 to-rose-400',
  'terror': 'from-gray-700 to-black',
  'suspense': 'from-slate-600 to-slate-800',
  'adulto': 'from-red-500 to-pink-500',
};

const FilmesCategorias = () => {
  const navigate = useNavigate();
  const [categoryCounts, setCategoryCounts] = useState<CategoryCount[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [totalMovies, setTotalMovies] = useState(0);

  useEffect(() => {
    fetchCategoryCounts();
  }, []);

  const fetchCategoryCounts = async () => {
    try {
      setIsLoading(true);
      
      const { data: moviesData, error } = await supabase
        .from('cinema')
        .select('category, year');

      if (error) {
        console.error('Erro ao buscar filmes:', error);
        return;
      }

      const allMovies = moviesData || [];
      setTotalMovies(allMovies.length);

      // Contar filmes por categoria
      const counts: Record<string, number> = {};
      
      MOVIE_CATEGORIES.forEach(cat => {
        counts[cat.id] = 0;
      });

      allMovies.forEach((movie: any) => {
        // Contar por categoria
        if (movie.category) {
          const categories = movie.category.split(/[,|;/]/).map((c: string) => c.trim()).filter(Boolean);
          categories.forEach((cat: string) => {
            const categoryId = MOVIE_CATEGORIES.find(c => c.name === cat)?.id;
            if (categoryId) {
              counts[categoryId] = (counts[categoryId] || 0) + 1;
            }
          });
        }

        // Contar lançamentos por ano
        if (movie.year === '2026' || movie.year?.includes('2026')) {
          counts['lancamento-2026'] = (counts['lancamento-2026'] || 0) + 1;
        }
        if (movie.year === '2025' || movie.year?.includes('2025')) {
          counts['lancamento-2025'] = (counts['lancamento-2025'] || 0) + 1;
        }
      });

      const categoryCountList: CategoryCount[] = MOVIE_CATEGORIES.map(cat => ({
        id: cat.id,
        name: cat.name,
        count: counts[cat.id] || 0,
      }));

      // Ordenar por contagem (mais populares primeiro)
      categoryCountList.sort((a, b) => b.count - a.count);

      setCategoryCounts(categoryCountList);
    } catch (error) {
      console.error('Erro ao buscar contagens:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/filmes/${categoryId}`);
  };

  const filteredCategories = categoryCounts.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    totalCategories: categoryCounts.length,
    totalMovies: totalMovies,
    mostPopular: categoryCounts[0]?.name || 'N/A',
    mostPopularCount: categoryCounts[0]?.count || 0,
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="pt-24 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Clapperboard className="w-10 h-10 text-[#00A8E1]" />
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              Categorias de Filmes
            </h1>
          </div>
          <p className="text-gray-400 text-lg mb-8">
            Explore nossos filmes organizados por gênero
          </p>

          {/* Search Bar */}
          <div className="relative max-w-md mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar categorias..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#00A8E1] transition-colors"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
              <p className="text-3xl font-bold text-[#00A8E1]">{stats.totalCategories}</p>
              <p className="text-gray-400 text-sm">Categorias</p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
              <p className="text-3xl font-bold text-green-500">{stats.totalMovies}</p>
              <p className="text-gray-400 text-sm">Filmes</p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
              <p className="text-3xl font-bold text-purple-500">{stats.mostPopularCount}</p>
              <p className="text-gray-400 text-sm">Mais Popular</p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
              <p className="text-3xl font-bold text-orange-500">
                {Math.round(stats.totalMovies / (stats.totalCategories || 1))}
              </p>
              <p className="text-gray-400 text-sm">Média por Categoria</p>
            </div>
          </div>

          {/* Categories Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="bg-gray-800/50 rounded-lg p-6 h-32 animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* Categorias Populares */}
              {!searchQuery && (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-green-500" />
                    Categorias Populares
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {categoryCounts.slice(0, 6).map((category) => (
                      <button
                        key={category.id}
                        onClick={() => handleCategoryClick(category.id)}
                        className="group relative bg-gray-900/80 rounded-lg p-6 border border-gray-800 hover:border-[#00A8E1] transition-all duration-300 text-left overflow-hidden"
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${categoryColors[category.id]} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                        <div className="relative z-10">
                          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${categoryColors[category.id]} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                            {categoryIcons[category.id] || <Film className="w-6 h-6" />}
                          </div>
                          <h3 className="text-white font-semibold text-lg mb-1 group-hover:text-[#00A8E1] transition-colors">
                            {category.name}
                          </h3>
                          <p className="text-gray-400 text-sm">
                            {category.count} {category.count === 1 ? 'filme' : 'filmes'}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Todas as Categorias */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">
                  {searchQuery ? 'Resultados da Busca' : 'Todas as Categorias'}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryClick(category.id)}
                      className="group relative bg-gray-900/50 rounded-lg p-5 border border-gray-800 hover:border-gray-600 transition-all duration-200 text-left"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${categoryColors[category.id]} flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-200`}>
                          {categoryIcons[category.id] || <Film className="w-5 h-5" />}
                        </div>
                        <span className="text-2xl font-bold text-gray-600 group-hover:text-[#00A8E1] transition-colors">
                          {category.count}
                        </span>
                      </div>
                      <h3 className="text-white font-medium text-base group-hover:text-[#00A8E1] transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-gray-500 text-xs mt-1">
                        {category.count === 1 ? 'filme' : 'filmes'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {filteredCategories.length === 0 && (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">Nenhuma categoria encontrada</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilmesCategorias;
