import thumb1 from "@/assets/thumb-1.jpg";
import thumb2 from "@/assets/thumb-2.jpg";
import thumb3 from "@/assets/thumb-3.jpg";
import thumb4 from "@/assets/thumb-4.jpg";
import thumb5 from "@/assets/thumb-5.jpg";
import thumb6 from "@/assets/thumb-6.jpg";
import thumb7 from "@/assets/thumb-7.jpg";
import thumb8 from "@/assets/thumb-8.jpg";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";

export interface ContentItem {
  id: string;
  title: string;
  image: string;
  year: number;
  rating: string;
  duration: string;
  genre: string[];
  description: string;
  type: "movie" | "series";
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

export const heroItems: HeroItem[] = [
  {
    id: "h1",
    title: "Cidade Sombria",
    image: hero1,
    description: "Em um futuro distópico, um herói solitário enfrenta as forças das trevas para salvar a humanidade da destruição total.",
    genre: "Ação • Ficção Científica",
    year: 2025,
    rating: "16+",
  },
  {
    id: "h2",
    title: "Sombras na Chuva",
    image: hero2,
    description: "Uma detetive brilhante investiga uma série de crimes misteriosos em uma cidade envolta em segredos e conspirações.",
    genre: "Suspense • Drama",
    year: 2024,
    rating: "14+",
  },
  {
    id: "h3",
    title: "O Último Dragão",
    image: hero3,
    description: "Uma aventura épica de fantasia onde o destino de um reino depende de um improvável herói e seu elo com o último dragão.",
    genre: "Fantasia • Aventura",
    year: 2025,
    rating: "12+",
  },
];

const allContent: ContentItem[] = [
  { id: "1", title: "Agente Secreto", image: thumb1, year: 2024, rating: "16+", duration: "2h 15min", genre: ["Ação", "Thriller"], description: "Um espião enfrenta sua missão mais perigosa.", type: "movie" },
  { id: "2", title: "Amor em Paris", image: thumb2, year: 2024, rating: "12+", duration: "1h 52min", genre: ["Romance", "Comédia"], description: "Dois estranhos se encontram na cidade luz.", type: "movie" },
  { id: "3", title: "Floresta Obscura", image: thumb3, year: 2023, rating: "18+", duration: "1h 48min", genre: ["Terror", "Suspense"], description: "Algo sinistro habita a floresta antiga.", type: "movie" },
  { id: "4", title: "Aventura em Família", image: thumb4, year: 2025, rating: "L", duration: "1h 35min", genre: ["Animação", "Família"], description: "Uma jornada inesquecível para toda a família.", type: "movie" },
  { id: "5", title: "Além das Estrelas", image: thumb5, year: 2024, rating: "14+", duration: "2h 30min", genre: ["Ficção Científica", "Drama"], description: "A última missão da humanidade no espaço.", type: "movie" },
  { id: "6", title: "Frente de Batalha", image: thumb6, year: 2023, rating: "16+", duration: "2h 20min", genre: ["Guerra", "Drama"], description: "A história real de heróis esquecidos.", type: "movie" },
  { id: "7", title: "Guardião Noturno", image: thumb7, year: 2025, rating: "14+", duration: "2h 05min", genre: ["Ação", "Super-herói"], description: "A cidade precisa de um novo protetor.", type: "movie" },
  { id: "8", title: "O Caso Perdido", image: thumb8, year: 2024, rating: "12+", duration: "1h 55min", genre: ["Mistério", "Drama"], description: "Um detetive volta a um caso que mudou sua vida.", type: "movie" },
];

export interface Category {
  id: string;
  title: string;
  items: ContentItem[];
}

export const categories: Category[] = [
  { id: "trending", title: "Em Alta", items: [allContent[0], allContent[4], allContent[6], allContent[2], allContent[1], allContent[7], allContent[3], allContent[5]] },
  { id: "action", title: "Ação e Aventura", items: [allContent[0], allContent[6], allContent[5], allContent[4], allContent[2], allContent[7], allContent[1], allContent[3]] },
  { id: "recommended", title: "Recomendados para Você", items: [allContent[7], allContent[1], allContent[3], allContent[5], allContent[0], allContent[4], allContent[6], allContent[2]] },
  { id: "scifi", title: "Ficção Científica e Fantasia", items: [allContent[4], allContent[2], allContent[6], allContent[0], allContent[7], allContent[3], allContent[5], allContent[1]] },
  { id: "family", title: "Para Toda a Família", items: [allContent[3], allContent[1], allContent[7], allContent[4], allContent[6], allContent[0], allContent[5], allContent[2]] },
  { id: "drama", title: "Drama", items: [allContent[5], allContent[7], allContent[1], allContent[4], allContent[2], allContent[0], allContent[3], allContent[6]] },
];

export const navCategories = [
  "Início",
  "Filmes",
  "Séries",
  "Originais",
  "Infantil",
  "Listas",
];
