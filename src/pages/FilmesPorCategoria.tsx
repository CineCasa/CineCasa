import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import PremiumNavbar from '@/components/PremiumNavbar';
import CategoryFilms from '@/components/CategoryFilms';
import useCinemaCategories from '@/hooks/useCinemaCategories';
import PremiumHeroBanner from '@/components/PremiumHeroBanner';
import { 
  Film, 
  Grid, 
  ChevronRight, 
  Play, 
  Star, 
  Clock,
  Filter,
  Search,
  TrendingUp,
  Heart,
  Eye
} from 'lucide-react';

const FilmesPorCategoria: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);
  
  const { 
    categories, 
    loading, 
    error, 
    extractAndOrganizeCategories,
    getGenreIcon,
    getGenreColor,
    normalizeGenre
  } = useCinemaCategories();

  useEffect(() => {
    extractAndOrganizeCategories();
  }, [extractAndOrganizeCategories]);

  const handleCategoryClick = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setShowAll(false);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setShowAll(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Implementar busca global
      console.log('Buscando:', searchTerm);
    }
  };

  const getCategoryCount = (categoryName: string): number => {
    const category = categories[categoryName];
    return category ? category.length : 0;
  };

  const getTotalFilms = (): number => {
    return Object.values(categories).reduce((total, categoryList) => {
      return total + (Array.isArray(categoryList) ? categoryList.length : 0);
    }, 0);
  };

  const getPopularCategories = () => {
    const sortedCategories = Object.entries(categories)
      .map(([name, categoryList]) => ({
        name,
        count: Array.isArray(categoryList) ? categoryList.length : 0,
        icon: getGenreIcon(name),
        color: getGenreColor(name)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    return sortedCategories;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <PremiumNavbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Film className="animate-spin mx-auto mb-4 text-red-500" size={48} />
            <span className="text-white text-xl">Carregando categorias...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <PremiumNavbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-white text-2xl mb-2">Erro ao carregar categorias</h2>
            <p className="text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => extractAndOrganizeCategories()}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (selectedCategory) {
    return (
      <div className="min-h-screen bg-black">
        <PremiumNavbar />
        
        {/* Header com voltar */}
        <div className="bg-gray-900 border-b border-gray-800 px-4 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <button
              onClick={handleBackToCategories}
              className="flex items-center gap-2 text-white hover:text-red-500 transition-colors"
            >
              <ChevronRight className="rotate-180" size={20} />
              <span className="section-title-sm lg:section-title-md">
                Voltar para Categorias
              </span>
            </button>
            
            <div className="flex items-center gap-3">
              <span className="text-gray-400">
                {getCategoryCount(selectedCategory)} filmes
              </span>
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center">
                <span className="text-white text-sm">
                  {getGenreIcon(selectedCategory)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo da categoria */}
        <CategoryFilms 
          category={selectedCategory}
          contentType="movies"
        />
      </div>
    );
  }

  return (
    <div className="streaming-container min-h-screen bg-black">
      <PremiumNavbar />
      
      {/* Banner Principal com trailers aleatórios */}
      <PremiumHeroBanner
        contentType="movies"
      />
      
      {/* Hero Section */}
      <div className="relative h-64 bg-gradient-to-b from-red-900/20 to-black overflow-hidden">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 h-full flex flex-col items-center justify-center px-4">
          <h1 className="hero-title-md lg:hero-title-lg text-white mb-4 text-center">
            🎬 Categorias de Filmes
          </h1>
          <p className="body-md lg:body-lg text-gray-300 text-center mb-6 max-w-2xl">
            Explore nossa coleção completa de filmes organizados por gênero
          </p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="w-full max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar filmes..."
                className="w-full pl-10 pr-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-red-500 focus:outline-none transition-colors"
              />
            </div>
          </form>
        </div>
        
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="grid grid-cols-12 h-full">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="border-r border-gray-800"></div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500 mb-1">
                {Object.keys(categories).length}
              </div>
              <div className="text-gray-400 text-sm">Categorias</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500 mb-1">
                {getTotalFilms()}
              </div>
              <div className="text-gray-400 text-sm">Filmes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500 mb-1">
                {getPopularCategories()[0]?.count || 0}
              </div>
              <div className="text-gray-400 text-sm">Mais Popular</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-500 mb-1">
                {Math.round(getTotalFilms() / Object.keys(categories).length)}
              </div>
              <div className="text-gray-400 text-sm">Média por Categoria</div>
            </div>
          </div>
        </div>
      </div>

      {/* Popular Categories */}
      <div className="px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title-md lg:section-title-lg text-white">
              <TrendingUp className="inline mr-2" size={24} />
              Categorias Populares
            </h2>
            <button
              onClick={() => setShowAll(!showAll)}
              className="flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors"
            >
              <Filter size={20} />
              <span className="text-sm font-medium">
                {showAll ? 'Mostrar Populares' : 'Mostrar Todas'}
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {(showAll ? Object.entries(categories) : getPopularCategories().map(cat => [cat.name, []])).map(([categoryName, categoryData]) => {
              const count = getCategoryCount(categoryName);
              const icon = getGenreIcon(categoryName);
              const color = getGenreColor(categoryName);
              
              return (
                <motion.div
                  key={categoryName}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: Math.random() * 0.3 }}
                  onClick={() => handleCategoryClick(categoryName)}
                  className="group cursor-pointer"
                >
                  <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 hover:border-red-500 transition-all duration-300 hover:scale-105">
                    {/* Icon and Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center text-2xl">
                        {icon}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">{count}</div>
                        <div className="text-xs text-gray-400">filmes</div>
                      </div>
                    </div>
                    
                    {/* Category Name */}
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-red-400 transition-colors">
                      {categoryName}
                    </h3>
                    
                    {/* Preview Films */}
                    {Array.isArray(categoryData) && categoryData.length > 0 && (
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Eye size={14} />
                        <span>Explorar filmes</span>
                        <ChevronRight size={14} className="ml-auto group-hover:translate-x-1 transition-transform" />
                      </div>
                    )}
                    
                    {/* Hover Effect */}
                    <div className="absolute inset-0 bg-red-500/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* No Categories Message */}
          {Object.keys(categories).length === 0 && (
            <div className="text-center py-12">
              <Film className="mx-auto mb-4 text-gray-600" size={48} />
              <h3 className="text-xl font-semibold text-white mb-2">
                Nenhuma categoria encontrada
              </h3>
              <p className="text-gray-400 mb-6">
                Não há filmes categorizados no momento.
              </p>
              <button
                onClick={() => extractAndOrganizeCategories()}
                className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Filter size={20} />
                Recarregar Categorias
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilmesPorCategoria;
