// Tipos completos para as tabelas do Supabase - Alinhados com estrutura real

export interface Series {
  // Colunas principais (conforme tabela real)
  id_n: number;
  tmdb_id?: string;
  titulo: string;
  descricao?: string;
  ano?: string;
  capa?: string;
  banner?: string;
  trailer?: string;
  genero?: string;
  
  // Campos opcionais para compatibilidade
  id?: string;
  poster?: string;
  rating?: string;
  classificacao?: string;
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
