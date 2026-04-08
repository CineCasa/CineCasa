import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CinemaCategory {
  id: string;
  name: string;
  count?: number;
  description?: string;
  icon?: string;
  color?: string;
}

interface CategoryMap {
  [key: string]: CinemaCategory[];
}

const useCinemaCategories = () => {
  const [categories, setCategories] = useState<CategoryMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mapeamento de categorias para organização melhor
  const CATEGORY_MAPPING: CategoryMap = {
    'Ação': [
      { id: 'action', name: 'Ação', description: 'Filmes de ação e aventura', icon: '💥', color: 'red' },
      { id: 'adventure', name: 'Aventura', description: 'Filmes de aventura', icon: '🗺️', color: 'blue' },
      { id: 'comedy', name: 'Comédia', description: 'Filmes de comédia', icon: '😄', color: 'yellow' },
      { id: 'drama', name: 'Drama', description: 'Filmes de drama', icon: '🎭', color: 'purple' },
      { id: 'fantasy', name: 'Fantasia', description: 'Filmes de fantasia', icon: '🧙', color: 'pink' },
      { id: 'horror', name: 'Terror', description: 'Filmes de terror', icon: '👻', color: 'red' },
      { id: 'mystery', name: 'Mistério', description: 'Filmes de mistério', icon: '🔍', color: 'gray' },
      { id: 'romance', name: 'Romance', description: 'Filmes de romance', icon: '💕', color: 'pink' },
      { id: 'sci-fi', name: 'Ficção Científica', description: 'Filmes de ficção científica', icon: '🚀', color: 'cyan' },
      { id: 'thriller', name: 'Suspense', description: 'Filmes de suspense', icon: '😰', color: 'orange' },
      { id: 'war', name: 'Guerra', description: 'Filmes de guerra', icon: '⚔️', color: 'brown' },
      { id: 'western', name: 'Faroeste', description: 'Filmes de faroeste', icon: '🤠', color: 'amber' }
    ],
    'Animação': [
      { id: 'animation', name: 'Animação', description: 'Filmes de animação', icon: '🎨', color: 'green' },
      { id: 'family', name: 'Família', description: 'Filmes familiares', icon: '👨‍👩‍👧‍👦', color: 'blue' },
      { id: 'musical', name: 'Musical', description: 'Filmes musicais', icon: '🎵', color: 'purple' }
    ],
    'Documentário': [
      { id: 'documentary', name: 'Documentário', description: 'Documentários e filmes biográficos', icon: '📹', color: 'gray' },
      { id: 'biography', name: 'Biografia', description: 'Filmes biográficos', icon: '👤', color: 'indigo' },
      { id: 'history', name: 'História', description: 'Filmes históricos', icon: '📜', color: 'amber' }
    ],
    'Infantil': [
      { id: 'kids', name: 'Infantil', description: 'Filmes infantis', icon: '🧒', color: 'green' },
      { id: 'cartoon', name: 'Desenho', description: 'Desenhos animados', icon: '🎭', color: 'pink' },
      { id: 'educational', name: 'Educativo', description: 'Filmes educativos', icon: '📚', color: 'blue' }
    ],
    'Suspense': [
      { id: 'crime', name: 'Crime', description: 'Filmes de crime', icon: '🚓', color: 'red' },
      { id: 'psychological', name: 'Psicológico', description: 'Filmes psicológicos', icon: '🧠', color: 'purple' }
    ],
    'Terror': [
      { id: 'zombie', name: 'Zumbi', description: 'Filmes de zumbi', icon: '🧟', color: 'green' },
      { id: 'vampire', name: 'Vampiro', description: 'Filmes de vampiro', icon: '🧛', color: 'red' },
      { id: 'slasher', name: 'Slash', description: 'Filmes slash', icon: '🔪', color: 'gray' },
      { id: 'monster', name: 'Monstro', description: 'Filmes de monstro', icon: '👾', color: 'purple' }
    ],
    'Clássicos': [
      { id: 'classic', name: 'Clássicos', description: 'Filmes clássicos atemporais', icon: '🎬', color: 'amber' },
      { id: 'vintage', name: 'Retrô', description: 'Filmes retrô e antigos', icon: '📷', color: 'sepia' },
      { id: 'black-white', name: 'Preto & Branco', description: 'Filmes preto e branco', icon: '🎞', color: 'gray' }
    ],
    'Ficção Científica': [
      { id: 'space', name: 'Espaço', description: 'Filmes de ficção espacial', icon: '🌌', color: 'blue' },
      { id: 'alien', name: 'Alienígena', description: 'Filmes de alienígenas', icon: '👽', color: 'green' },
      { id: 'robot', name: 'Robô', description: 'Filmes de robôs', icon: '🤖', color: 'gray' },
      { id: 'dystopian', name: 'Distopia', description: 'Filmes distópicos', icon: '🏙', color: 'orange' },
      { id: 'time-travel', name: 'Viagem no Tempo', description: 'Filmes de viagem no tempo', icon: '⏰', color: 'cyan' }
    ],
    'Romance': [
      { id: 'love-story', name: 'Romance', description: 'Histórias de amor', icon: '💕', color: 'pink' },
      { id: 'chick-flick', name: 'Chick Flick', description: 'Filmes românticos leves', icon: '💑', color: 'purple' },
      { id: 'romantic-comedy', name: 'Comédia Romântica', description: 'Comédias românticas', icon: '😂', color: 'yellow' }
    ],
    'Comédia': [
      { id: 'parody', name: 'Paródia', description: 'Filmes de paródia', icon: '🎭', color: 'cyan' },
      { id: 'satire', name: 'Sátira', description: 'Filmes de sátira', icon: '😏', color: 'orange' },
      { id: 'stand-up', name: 'Stand-up', description: 'Filmes de stand-up', icon: '🎤', color: 'red' },
      { id: 'improvisation', name: 'Improviso', description: 'Filmes de improviso', icon: '🎭', color: 'blue' }
    ],
    'Aventura': [
      { id: 'superhero', name: 'Super-herói', description: 'Filmes de super-herói', icon: '🦸', color: 'blue' },
      { id: 'fantasy-adventure', name: 'Aventura Fantástica', description: 'Aventura com elementos fantásticos', icon: '🗡️', color: 'purple' },
      { id: 'pirate', name: 'Pirata', description: 'Filmes de piratas', icon: '🏴‍☠️', color: 'brown' },
      { id: 'treasure-hunt', name: 'Caça ao Tesouro', description: 'Filmes de caça ao tesouro', icon: '🗺️', color: 'yellow' }
    ],
    'Drama': [
      { id: 'melodrama', name: 'Melodrama', description: 'Filmes melodramáticos', icon: '🎭', color: 'pink' },
      { id: 'historical', name: 'Histórico', description: 'Filmes baseados em eventos históricos', icon: '📜', color: 'amber' },
      { id: 'courtroom', name: 'Tribunal', description: 'Filmes de tribunal e júri', icon: '⚖️', color: 'gray' },
      { id: 'legal', name: 'Jurídico', description: 'Filmes jurídicos', icon: '⚖️', color: 'blue' }
    ]
  };

  // Extrair categorias do banco e organizar
  const extractAndOrganizeCategories = useCallback(async () => {
    try {
      console.log('🎬 [CinemaCategories] Buscando e categorizando filmes...');
      
      const { data: films, error } = await supabase
        .from('cinema')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar filmes:', error);
        setError(error.message);
        return;
      }

      if (!films || films.length === 0) {
        console.log('⚠️ Nenhum filme encontrado');
        setCategories({});
        setLoading(false);
        return;
      }

      console.log(`📊 [CinemaCategories] ${films.length} filmes encontrados`);

      // Organizar filmes por gênero
      const organizedCategories: CategoryMap = {};
      
      for (const film of films) {
        const genres = (film as any).genero || (film as any).genre || 'Sem Categoria';
        const genreArray = Array.isArray(genres) ? genres : genres.split(',').map(g => g.trim());
        
        for (const genre of genreArray) {
          const normalizedGenre = normalizeGenre(genre);
          
          if (!organizedCategories[normalizedGenre]) {
            organizedCategories[normalizedGenre] = [];
          }
          
          organizedCategories[normalizedGenre].push({
            id: (film as any).id_n || (film as any).id || `film-${Math.random()}`,
            name: normalizedGenre,
            description: getGenreDescription(normalizedGenre),
            icon: getGenreIcon(normalizedGenre),
            color: getGenreColor(normalizedGenre)
          });
        }
      }

      // Adicionar categorias mapeadas
      for (const [mainCategory, subCategories] of Object.entries(CATEGORY_MAPPING)) {
        if (organizedCategories[mainCategory]) {
          // Já existe, adicionar as subcategorias
          organizedCategories[mainCategory].push(...subCategories);
        } else {
          organizedCategories[mainCategory] = subCategories;
        }
      }

      console.log('📋 [CinemaCategories] Categorias organizadas:', Object.keys(organizedCategories));
      setCategories(organizedCategories);
      setLoading(false);
      setError(null);
      
    } catch (error) {
      console.error('💥 Erro ao categorizar filmes:', error);
      setError(error.message);
      setLoading(false);
    }
  }, []);

  // Normalizar nome do gênero
  const normalizeGenre = (genre: string): string => {
    const genreLower = genre.toLowerCase().trim();
    
    // Mapeamento de normalização
    const normalizations: Record<string, string> = {
      'ação': 'Ação',
      'action': 'Ação',
      'aventura': 'Aventura',
      'adventure': 'Aventura',
      'comedia': 'Comédia',
      'comedy': 'Comédia',
      'drama': 'Drama',
      'fantasia': 'Fantasia',
      'fantasy': 'Fantasia',
      'ficção científica': 'Ficção Científica',
      'sci-fi': 'Ficção Científica',
      'terror': 'Terror',
      'horror': 'Terror',
      'suspense': 'Suspense',
      'thriller': 'Suspense',
      'romance': 'Romance',
      'animação': 'Animação',
      'animation': 'Animação',
      'infantil': 'Infantil',
      'kids': 'Infantil',
      'desenho': 'Desenho',
      'cartoon': 'Desenho',
      'documentário': 'Documentário',
      'documentary': 'Documentário',
      'biografia': 'Biografia',
      'biography': 'Biografia',
      'musical': 'Musical',
      'clássicos': 'Clássicos',
      'classic': 'Clássicos',
      'retro': 'Retrô',
      'vintage': 'Retrô'
    };

    return normalizations[genreLower] || genre;
  };

  // Obter descrição do gênero
  const getGenreDescription = (genre: string): string => {
    const descriptions: Record<string, string> = {
      'Ação': 'Filmes de ação e aventura',
      'Aventura': 'Filmes de aventura',
      'Comédia': 'Filmes de comédia',
      'Drama': 'Filmes de drama',
      'Fantasia': 'Filmes de fantasia',
      'Ficção Científica': 'Filmes de ficção científica',
      'Terror': 'Filmes de terror',
      'Suspense': 'Filmes de suspense',
      'Romance': 'Filmes de romance',
      'Animação': 'Filmes de animação',
      'Infantil': 'Filmes infantis',
      'Desenho': 'Desenhos animados',
      'Documentário': 'Documentários e filmes biográficos',
      'Clássicos': 'Filmes clássicos atemporais'
    };

    return descriptions[genre] || 'Filmes diversos';
  };

  // Obter ícone do gênero
  const getGenreIcon = (genre: string): string => {
    const icons: Record<string, string> = {
      'Ação': '💥',
      'Aventura': '🗺️',
      'Comédia': '😄',
      'Drama': '🎭',
      'Fantasia': '🧙',
      'Ficção Científica': '🚀',
      'Terror': '👻',
      'Suspense': '😰',
      'Romance': '💕',
      'Animação': '🎨',
      'Infantil': '🧒',
      'Desenho': '🎭',
      'Documentário': '📹',
      'Clássicos': '🎬'
    };

    return icons[genre] || '🎬';
  };

  // Obter cor do gênero
  const getGenreColor = (genre: string): string => {
    const colors: Record<string, string> = {
      'Ação': 'red',
      'Aventura': 'blue',
      'Comédia': 'yellow',
      'Drama': 'purple',
      'Fantasia': 'pink',
      'Ficção Científica': 'cyan',
      'Terror': 'red',
      'Suspense': 'orange',
      'Romance': 'pink',
      'Animação': 'green',
      'Infantil': 'green',
      'Desenho': 'pink',
      'Documentário': 'gray',
      'Clássicos': 'amber'
    };

    return colors[genre] || 'gray';
  };

  // Recategorizar filme
  const recategorizeFilm = (film: any): any => {
    const genres = (film as any).genero || (film as any).genre || 'Sem Categoria';
    const genreArray = Array.isArray(genres) ? genres : genres.split(',').map(g => g.trim());
    
    const normalizedGenres = genreArray.map(g => normalizeGenre(g));
    const primaryGenre = normalizedGenres[0] || 'Sem Categoria';
    
    return {
      ...film,
      primaryGenre,
      normalizedGenres,
      genreIcon: getGenreIcon(primaryGenre),
      genreColor: getGenreColor(primaryGenre)
    };
  };

  return {
    categories,
    loading,
    error,
    extractAndOrganizeCategories,
    normalizeGenre,
    getGenreDescription,
    getGenreIcon,
    getGenreColor,
    recategorizeFilm,
    CATEGORY_MAPPING
  };
};

export default useCinemaCategories;
