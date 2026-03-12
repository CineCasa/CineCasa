export interface ContentItem {
  id: string;
  tmdbId?: string;
  title: string;
  image: string;
  backdrop?: string;
  year: number;
  rating: string;
  duration: string;
  genre: string[];
  category: string; // Categoria principal do Supabase
  description: string;
  type: "movie" | "series";
  trailer?: string;
  url?: string;
  identificadorArchive?: string;
}

export interface HeroItem {
  id: string;
  title: string;
  image: string;
  description: string;
  genre: string;
  category: string; // Categoria principal do Supabase
  year: number;
  rating: string;
}

export interface Category {
  id: string;
  title: string;
  items: ContentItem[];
}

// Categorias oficiais do Supabase - NÃO MUDAR ORDEM
export const movieCategories = [
  "Lançamento 2026",
  "Lançamento 2025", 
  "Ação",
  "Aventura",
  "Anime",
  "Animação",
  "Comédia",
  "Drama",
  "Dorama",
  "Clássicos",
  "Negritude",
  "Crime",
  "Policial",
  "Família",
  "Musical",
  "Documentário",
  "Faroeste",
  "Ficção",
  "Nacional",
  "Religioso",
  "Romance",
  "Terror",
  "Suspense",
  "Adulto"
];

export const navCategories = [
  "Início",
  "Filmes",
  "Séries", 
  "Originais",
  "Infantil",
  "Listas",
];
