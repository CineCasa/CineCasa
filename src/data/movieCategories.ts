// Categorias de filmes do Menu Filmes
export const MOVIE_CATEGORIES = [
  { id: 'lancamento-2026', name: 'Lançamento 2026', slug: 'lancamento-2026' },
  { id: 'lancamento-2025', name: 'Lançamento 2025', slug: 'lancamento-2025' },
  { id: 'acao', name: 'Ação', slug: 'acao' },
  { id: 'aventura', name: 'Aventura', slug: 'aventura' },
  { id: 'infantil', name: 'Infantil', slug: 'infantil' },
  { id: 'financas', name: 'Finanças', slug: 'financas' },
  { id: 'anime', name: 'Anime', slug: 'anime' },
  { id: 'animacao', name: 'Animação', slug: 'animacao' },
  { id: 'comedia', name: 'Comédia', slug: 'comedia' },
  { id: 'drama', name: 'Drama', slug: 'drama' },
  { id: 'dorama', name: 'Dorama', slug: 'dorama' },
  { id: 'classicos', name: 'Clássicos', slug: 'classicos' },
  { id: 'negritude', name: 'Negritude', slug: 'negritude' },
  { id: 'crime', name: 'Crime', slug: 'crime' },
  { id: 'policial', name: 'Policial', slug: 'policial' },
  { id: 'familia', name: 'Família', slug: 'familia' },
  { id: 'musical', name: 'Musical', slug: 'musical' },
  { id: 'documentario', name: 'Documentário', slug: 'documentario' },
  { id: 'faroeste', name: 'Faroeste', slug: 'faroeste' },
  { id: 'ficcao', name: 'Ficção', slug: 'ficcao' },
  { id: 'nacional', name: 'Nacional', slug: 'nacional' },
  { id: 'religioso', name: 'Religioso', slug: 'religioso' },
  { id: 'romance', name: 'Romance', slug: 'romance' },
  { id: 'terror', name: 'Terror', slug: 'terror' },
  { id: 'suspense', name: 'Suspense', slug: 'suspense' },
  { id: 'adulto', name: 'Adulto', slug: 'adulto' },
] as const;

export type MovieCategory = typeof MOVIE_CATEGORIES[number];

// Mapeamento de categorias do banco para IDs
export const CATEGORY_MAPPING: Record<string, string> = {
  'Lançamento 2026': 'lancamento-2026',
  'Lançamento 2025': 'lancamento-2025',
  'Ação': 'acao',
  'Aventura': 'aventura',
  'Infantil': 'infantil',
  'Finanças': 'financas',
  'Anime': 'anime',
  'Animação': 'animacao',
  'Comédia': 'comedia',
  'Drama': 'drama',
  'Dorama': 'dorama',
  'Clássicos': 'classicos',
  'Negritude': 'negritude',
  'Crime': 'crime',
  'Policial': 'policial',
  'Família': 'familia',
  'Musical': 'musical',
  'Documentário': 'documentario',
  'Faroeste': 'faroeste',
  'Ficção': 'ficcao',
  'Nacional': 'nacional',
  'Religioso': 'religioso',
  'Romance': 'romance',
  'Terror': 'terror',
  'Suspense': 'suspense',
  'Adulto': 'adulto',
};

// Interface para filmes da tabela cinema
export interface CinemaMovie {
  id: number;
  titulo: string;
  description: string | null;
  poster: string | null;
  banner: string | null;
  year: string | null;
  rating: string | null;
  category: string | null;
  tmdb_id: string | null;
  trailer: string | null;
  url: string | null;
  type: string | null;
  created_at: string | null;
}
