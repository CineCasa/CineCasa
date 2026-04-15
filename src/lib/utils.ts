import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Filtra filmes que são coleções (box set, pack, trilogia, etc)
 * Retorna true se o filme NÃO for uma coleção
 */
export function isNotCollection(movie: any): boolean {
  const titulo = (movie.titulo || movie.title || '').toLowerCase();
  const isColecao = titulo.includes('coleção') || 
                    titulo.includes('colecao') || 
                    titulo.includes('collection') ||
                    titulo.includes('box set') ||
                    titulo.includes('pack') ||
                    titulo.includes('trilogia') ||
                    titulo.includes('saga') ||
                    titulo.includes('complete') ||
                    titulo.includes('completa');
  
  if (isColecao) {
    console.log('[Utils] Removendo coleção:', movie.titulo || movie.title);
  }
  return !isColecao;
}
