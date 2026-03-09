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
  year: number;
  rating: string;
}

export interface Category {
  id: string;
  title: string;
  items: ContentItem[];
}

export const navCategories = [
  "Início",
  "Filmes",
  "Séries",
  "Originais",
  "Infantil",
  "Listas",
];
