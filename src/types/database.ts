// Tipos completos para as tabelas do Supabase - Alinhados com estrutura real

export interface Cinema {
  id: number;
  titulo: string;
  poster: string | null;
  banner: string | null;
  year: string | null;
  rating: string | null;
  category: string | null;
  tmdb_id: string | null;
  trailer: string | null;
  url: string | null;
  type: string | null;
  description: string | null;
  created_at: string | null;
}

export interface Series {
  id_n: number;
  tmdb_id: string | null;
  titulo: string;
  descricao: string | null;
  ano: string | null;
  capa: string | null;
  banner: string | null;
  trailer: string | null;
  genero: string | null;
}

export interface Temporada {
  // Identificação (conforme tabela real)
  id_n: number;
  serie_id: number;
  
  // Informações básicas
  numero_temporada: number;
  titulo?: string;
  capa?: string;
  banner?: string;
  
  // Campos opcionais para compatibilidade
  id?: string;
  serie_id_string?: string;
  numero?: number;
  descricao?: string;
  poster?: string;
  ano?: string;
}

export interface Episodio {
  // Identificação (conforme tabela real)
  id_n: number;
  temporada_id: number;
  
  // Informações básicas
  numero_episodio: number;
  titulo: string;
  descricao?: string;
  duracao?: string;
  
  // Mídia
  arquivo?: string;
  imagem_185?: string;
  imagem_342?: string;
  imagem_500?: string;
  banner?: string;
  trailer?: string;
  
  // Campos opcionais para compatibilidade
  id?: string;
  temporada_id_string?: string;
  serie_id?: string;
  numero?: number;
  numero_temporada?: number;
  thumbnail?: string;
  capa?: string;
  duracao_minutos?: number;
}

// Tipo para relacionamentos
export interface SerieCompleta extends Series {
  temporadas?: Temporada[];
  episodios?: Episodio[];
}

// Tipo para temporada com episódios
export interface TemporadaCompleta extends Temporada {
  episodios?: Episodio[];
}
