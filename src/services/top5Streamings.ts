import { StreamingPlatform, Top5Content, MissingContent, PLATFORM_NAMES } from '@/types/top5';
import { supabase } from '@/integrations/supabase/client';

// Simulação de dados reais dos Top 10 de cada streaming (em produção, seriam APIs)
const MOCK_STREAMING_DATA: Record<StreamingPlatform, any[]> = {
  netflix: [
    { id: 'netflix-1', title: 'Stranger Things', type: 'series', year: '2022', rating: '8.7', poster: '/placeholder.svg', backdrop: '/placeholder.svg', description: 'Mistério sobrenatural nos anos 80', genres: ['Sci-Fi', 'Horror', 'Drama'] },
    { id: 'netflix-2', title: 'The Witcher', type: 'series', year: '2023', rating: '8.0', poster: '/placeholder.svg', backdrop: '/placeholder.svg', description: 'Caçador de monstros em um mundo de fantasia', genres: ['Fantasy', 'Action'] },
    { id: 'netflix-3', title: 'Wednesday', type: 'series', year: '2022', rating: '8.1', poster: '/placeholder.svg', backdrop: '/placeholder.svg', description: 'A filha da Família Addams na escola Nevermore', genres: ['Comedy', 'Horror', 'Mystery'] },
  ],
  disneyplus: [
    { id: 'disney-1', title: 'The Mandalorian', type: 'series', year: '2023', rating: '8.7', poster: '/placeholder.svg', backdrop: '/placeholder.svg', description: 'Caçador de recompensas no universo Star Wars', genres: ['Sci-Fi', 'Action', 'Adventure'] },
    { id: 'disney-2', title: 'Loki', type: 'series', year: '2023', rating: '8.2', poster: '/placeholder.svg', backdrop: '/placeholder.svg', description: 'O deus da travessura em uma nova aventura', genres: ['Sci-Fi', 'Action', 'Fantasy'] },
  ],
  globoplay: [
    { id: 'globo-1', title: 'Aruanas', type: 'series', year: '2023', rating: '8.2', poster: '/placeholder.svg', backdrop: '/placeholder.svg', description: 'Investigação ambiental e jornalismo investigativo', genres: ['Drama', 'Thriller'] },
    { id: 'globo-2', title: 'Sob Pressão', type: 'series', year: '2024', rating: '8.5', poster: '/placeholder.svg', backdrop: '/placeholder.svg', description: 'Drama médico de alta pressão em um hospital do Rio', genres: ['Drama', 'Medical'] },
  ],
  hbomax: [
    { id: 'hbo-1', title: 'The Last of Us', type: 'series', year: '2023', rating: '8.8', poster: '/placeholder.svg', backdrop: '/placeholder.svg', description: 'Adaptação do jogo em mundo pós-apocalíptico', genres: ['Drama', 'Horror', 'Action'] },
    { id: 'hbo-2', title: 'House of the Dragon', type: 'series', year: '2024', rating: '8.4', poster: '/placeholder.svg', backdrop: '/placeholder.svg', description: 'Prequela de Game of Thrones sobre a Casa Targaryen', genres: ['Fantasy', 'Drama', 'Action'] },
  ],
  primevideo: [
    { id: 'prime-1', title: 'The Boys', type: 'series', year: '2024', rating: '8.7', poster: '/placeholder.svg', backdrop: '/placeholder.svg', description: 'Super-heróis corruptos e os que os combatem', genres: ['Action', 'Comedy', 'Sci-Fi'] },
    { id: 'prime-2', title: 'Rings of Power', type: 'series', year: '2024', rating: '7.3', poster: '/placeholder.svg', backdrop: '/placeholder.svg', description: 'A segunda era da Terra Média no universo Tolkien', genres: ['Fantasy', 'Adventure', 'Drama'] },
  ],
};

class Top5StreamingsService {
  private lastUpdate: string | null = null;
  private cache: Top5Content[] | null = null;
  private missingCache: MissingContent[] | null = null;

  private isNovelaTitle(title: string): boolean {
    return /novela|telenovela/i.test(title);
  }

  private getPlaceholderPoster(title: string): string {
    return '/placeholder.svg';
  }

  private mapDbItemToTop5Content(
    item: any,
    type: 'movie' | 'series',
    platform: StreamingPlatform,
    platformRank: number,
    globalRank: number
  ): Top5Content {
    return {
      id: item.id?.toString() || `${platform}-${platformRank}`,
      title: item.titulo || item.title || 'Conteúdo Top 5',
      poster: item.poster || this.getPlaceholderPoster(item.titulo || item.title || 'Em Breve'),
      backdrop: item.backdrop || item.backdrop_path || undefined,
      type,
      year: item.year?.toString() || item.ano?.toString() || '2024',
      rating: item.rating?.toString() || item.nota?.toString() || 'N/A',
      platform,
      platformRank,
      globalRank,
      description: item.description || item.sinopse || item.overview || undefined,
      genres: item.genres || item.categorias || [],
      duration: item.duration || item.duracao,
      existsInDatabase: true,
      lastUpdated: new Date().toISOString(),
    };
  }

  // Buscar top 10 de cada streaming (simulação - em produção seriam chamadas API)
  async fetchStreamingTops(): Promise<Record<StreamingPlatform, any[]>> {
    // Em produção, aqui teria chamadas reais:
    // const netflix = await fetch('https://api.netflix.com/top10').then(r => r.json());
    // const disney = await fetch('https://api.disneyplus.com/top10').then(r => r.json());
    // etc...

    // Por enquanto, retornar mock com delay simulando network
    await new Promise(resolve => setTimeout(resolve, 500));
    return MOCK_STREAMING_DATA;
  }

  // Verificar se conteúdo existe no banco local (busca em múltiplas tabelas) - EXCLUI NOVELAS
  async checkContentInDatabase(platform: StreamingPlatform, title: string): Promise<{ exists: boolean; content?: any }> {
    try {
      console.log(`🔍 [Top5] Buscando: "${title}" na plataforma ${platform}`);
      
      // Buscar na tabela cinema (filmes) - excluindo novelas
      const { data: cinemaData, error: cinemaError } = await supabase
        .from('cinema')
        .select('*')
        .ilike('titulo', title + '%')
        .not('category', 'ilike', 'novela%')
        .not('category', 'ilike', 'telenovela%')
        .not('titulo', 'ilike', 'novela%')
        .not('titulo', 'ilike', 'telenovela%')
        .not('category', 'ilike', 'novela%')
        .limit(1);

      if (!cinemaError && cinemaData && cinemaData.length > 0) {
        return { exists: true, content: { ...cinemaData[0], type: 'movie' } };
      }

      // Buscar na tabela series - excluindo novelas
      const { data: seriesData, error: seriesError } = await supabase
        .from('series')
        .select('*')
        .ilike('titulo', title + '%')
        .not('genero', 'ilike', 'novela%')
        .not('genero', 'ilike', 'Novela%')
        .not('titulo', 'ilike', 'novela%')
        .not('titulo', 'ilike', 'telenovela%')
        .not('genero', 'ilike', 'novela%')
        .limit(1);

      if (!seriesError && seriesData && seriesData.length > 0) {
        return { exists: true, content: { ...seriesData[0], type: 'series' } };
      }

      return { exists: false };
    } catch (error) {
      console.error('Error checking database:', error);
      return { exists: false };
    }
  }

  // Buscar conteúdo completo do banco por ID
  async fetchContentFromDatabase(contentId: string, type: 'movie' | 'series'): Promise<any | null> {
    try {
      const table = type === 'movie' ? 'cinema' : 'series';
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', parseInt(contentId))
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching content:', error);
      return null;
    }
  }

  // Compilar lista inteligente: busca 5 melhores avaliados do banco - EXCLUI NOVELAS
  async compileTop5List(): Promise<{ top5: Top5Content[]; missing: MissingContent[] }> {
    const top5: Top5Content[] = [];
    const missing: MissingContent[] = [];
    const platformOrder: StreamingPlatform[] = ['netflix', 'disneyplus', 'globoplay', 'hbomax', 'primevideo'];

    try {
      const streamingTops = await this.fetchStreamingTops();

      for (const platform of platformOrder) {
        const platformItems = streamingTops[platform] || [];
        const candidateItems = platformItems.filter(item =>
          !this.isNovelaTitle(item.title) &&
          !this.isNovelaTitle(item.description || '')
        );
        let selectedItem: Top5Content | null = null;

        for (let index = 0; index < candidateItems.length; index++) {
          const item = candidateItems[index];
          const { exists, content } = await this.checkContentInDatabase(platform, item.title);

          const platformRank = item.platformRank || index + 1;
          const globalRank = top5.length + 1;

          if (exists && content) {
            selectedItem = this.mapDbItemToTop5Content(content, content.type, platform, platformRank, globalRank);
            break;
          }

          if (!selectedItem) {
            selectedItem = {
              id: item.id?.toString() || `${platform}-${index + 1}`,
              title: item.title,
              poster: item.poster || this.getPlaceholderPoster(item.title),
              backdrop: item.backdrop,
              type: item.type === 'series' ? 'series' : 'movie',
              year: item.year?.toString() || '2024',
              rating: item.rating?.toString() || 'Em breve',
              platform,
              platformRank,
              globalRank,
              description: item.description,
              genres: item.genres || [],
              existsInDatabase: false,
              lastUpdated: new Date().toISOString(),
            };
          }

          if (selectedItem.existsInDatabase) break;
        }

        if (!selectedItem) {
          const placeholderTitle = `${PLATFORM_NAMES[platform]} - Em breve`;
          selectedItem = {
            id: `${platform}-missing`,
            title: placeholderTitle,
            poster: this.getPlaceholderPoster(placeholderTitle),
            type: 'movie',
            year: '2024',
            rating: 'Em breve',
            platform,
            platformRank: 1,
            globalRank: top5.length + 1,
            description: 'Conteúdo ainda não disponível no banco.',
            genres: [],
            existsInDatabase: false,
            lastUpdated: new Date().toISOString(),
          };
        }

        top5.push(selectedItem);

        if (!selectedItem.existsInDatabase) {
          missing.push({
            id: selectedItem.id,
            title: selectedItem.title,
            poster: selectedItem.poster,
            platform: selectedItem.platform,
            platformRank: selectedItem.platformRank,
            type: selectedItem.type,
            requestedAt: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error('Error compiling top 5:', error);
    }

    this.cache = top5;
    this.missingCache = missing;
    this.lastUpdate = new Date().toISOString();

    return { top5, missing };
  }

  // Obter cache atual
  getCache(): Top5Content[] | null {
    return this.cache;
  }

  getMissingCache(): MissingContent[] | null {
    return this.missingCache;
  }

  getLastUpdate(): string | null {
    return this.lastUpdate;
  }

  // Verificar se precisa atualizar (ex: a cada 15 minutos)
  needsUpdate(): boolean {
    if (!this.lastUpdate) return true;
    const lastUpdateTime = new Date(this.lastUpdate).getTime();
    const now = new Date().getTime();
    const minutesDiff = (now - lastUpdateTime) / (1000 * 60);
    return minutesDiff >= 15; // Atualizar a cada 15 minutos
  }
}

export const top5Service = new Top5StreamingsService();
export default Top5StreamingsService;
