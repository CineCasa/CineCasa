// Sistema inteligente de detecção de duplicidade de capas
// Usa múltiplas estratégias para evitar repetição de imagens na home

export interface CoverItem {
  id: string;
  tmdbId: string;
  title: string;
  poster: string;
}

// Cache global de capas usadas na sessão
const usedPosters = new Set<string>();
const usedTmdbIds = new Set<string>();

/**
 * Extrai um identificador único da URL da imagem
 * Útil para detectar a mesma imagem com URLs diferentes
 */
export function extractPosterId(posterUrl: string): string | null {
  if (!posterUrl) return null;
  
  // Extrair o nome do arquivo da URL (ex: poster-12345.jpg)
  const match = posterUrl.match(/\/([^/]+\.(?:jpg|jpeg|png|webp)(?:\?.*)?)$/i);
  if (match) {
    // Remover query params
    return match[1].split('?')[0];
  }
  
  // Tentar extrair ID do TMDB da URL
  const tmdbMatch = posterUrl.match(/\/([a-zA-Z0-9]+)\.jpg/);
  if (tmdbMatch) {
    return tmdbMatch[1];
  }
  
  return posterUrl; // Fallback para URL completa
}

/**
 * Calcula similaridade entre dois títulos (0-1)
 */
export function calculateTitleSimilarity(title1: string, title2: string): number {
  if (!title1 || !title2) return 0;
  
  const normalize = (s: string) => 
    s.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9]/g, ' ')
      .trim();
  
  const t1 = normalize(title1);
  const t2 = normalize(title2);
  
  // Se são iguais
  if (t1 === t2) return 1;
  
  // Se um contém o outro
  if (t1.includes(t2) || t2.includes(t1)) return 0.9;
  
  // Calcular palavras em comum
  const words1 = new Set(t1.split(/\s+/).filter(w => w.length > 2));
  const words2 = new Set(t2.split(/\s+/).filter(w => w.length > 2));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  if (union.size === 0) return 0;
  
  return intersection.size / union.size;
}

/**
 * Verifica se uma capa já foi usada
 */
export function isPosterUsed(item: CoverItem): boolean {
  // Verificar por TMDB ID (mais confiável)
  if (item.tmdbId && usedTmdbIds.has(item.tmdbId)) {
    return true;
  }
  
  // Verificar por ID da imagem
  const posterId = extractPosterId(item.poster);
  if (posterId && usedPosters.has(posterId)) {
    return true;
  }
  
  // Verificar por título similar
  for (const usedId of usedTmdbIds) {
    // Se títulos são muito similares, considerar duplicado
    // Note: isso é uma simplificação - na prática precisaríamos
    // guardar os títulos usados também
  }
  
  return false;
}

/**
 * Marca uma capa como usada
 */
export function markPosterAsUsed(item: CoverItem): void {
  if (item.tmdbId) {
    usedTmdbIds.add(item.tmdbId);
  }
  
  const posterId = extractPosterId(item.poster);
  if (posterId) {
    usedPosters.add(posterId);
  }
}

/**
 * Filtra items removendo duplicados de capas
 */
export function filterDuplicatePosters<T extends CoverItem>(
  items: T[],
  maxItems: number = 5
): T[] {
  const unique: T[] = [];
  
  for (const item of items) {
    if (!isPosterUsed(item)) {
      markPosterAsUsed(item);
      unique.push(item);
      
      if (unique.length >= maxItems) {
        break;
      }
    } else {
      console.log('[CoverDedup] Capa duplicada ignorada:', item.title);
    }
  }
  
  return unique;
}

/**
 * Limpa o cache de capas usadas (para reinicialização)
 */
export function clearUsedPosters(): void {
  usedPosters.clear();
  usedTmdbIds.clear();
  console.log('[CoverDedup] Cache de capas limpo');
}

/**
 * Detecta capas similares entre múltiplas listas
 * Retorna apenas os items únicos de cada lista
 */
export function deduplicateAcrossSections<T extends CoverItem>(
  sections: Record<string, T[]>,
  maxPerSection: number = 5
): Record<string, T[]> {
  clearUsedPosters();
  
  const result: Record<string, T[]> = {};
  
  for (const [sectionName, items] of Object.entries(sections)) {
    console.log(`[CoverDedup] Processando seção ${sectionName}:`, items.length, 'items');
    result[sectionName] = filterDuplicatePosters(items, maxPerSection);
    console.log(`[CoverDedup] Seção ${sectionName} após filtro:`, result[sectionName].length, 'items');
  }
  
  return result;
}

/**
 * Verifica se duas URLs de imagem são a mesma capa
 */
export function arePostersSimilar(url1: string, url2: string): boolean {
  const id1 = extractPosterId(url1);
  const id2 = extractPosterId(url2);
  
  if (!id1 || !id2) return false;
  
  return id1 === id2;
}
