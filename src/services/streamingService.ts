import { supabase } from '@/integrations/supabase/client';

interface StreamingContent {
  id: string;
  title: string;
  type: 'movie' | 'series';
  streamingService: string;
  posterUrl: string;
  backdropUrl: string;
  description: string;
  year: number;
  rating: string;
  isAvailable: boolean;
  tmdbId?: string;
  category: string;
}

// Simulação de dados dos top streamings
const TOP_STREAMING_CONTENT = {
  netflix: [
    {
      title: "Stranger Things",
      type: "series" as const,
      posterUrl: "https://image.tmdb.org/t/p/w500/x2LSRK2Cpe7vQgUfVWJvwHiq0zV.jpg",
      description: "Quando um menino desaparece, seus amigos e a mãe descobrem um mistério envolvendo experimentos secretos.",
      year: 2022,
      rating: "8.7",
      category: "Ficção"
    },
    {
      title: "The Crown",
      type: "series" as const,
      posterUrl: "https://image.tmdb.org/t/p/w500/9BjRQlKgVvyFtMqnMhWdijZC9qK.jpg",
      description: "Série dramática sobre a vida da rainha Elizabeth II e da família real britânica.",
      year: 2022,
      rating: "8.6",
      category: "Drama"
    }
  ],
  hbo: [
    {
      title: "House of the Dragon",
      type: "series" as const,
      posterUrl: "https://image.tmdb.org/t/p/w500/78nJstlGQjwqK9ynJ7pq2gVlFQ.jpg",
      description: "A história da Casa Targaryen 200 anos antes dos eventos de Game of Thrones.",
      year: 2022,
      rating: "8.4",
      category: "Ação"
    }
  ],
  prime: [
    {
      title: "The Boys",
      type: "series" as const,
      posterUrl: "https://image.tmdb.org/t/p/w500/y9dSy6Cc0b1vR6FDsAe9qLlPzK.jpg",
      description: "Um grupo de vigilantes caça super-heróis corruptos que abusam de seus poderes.",
      year: 2022,
      rating: "8.7",
      category: "Ação"
    }
  ],
  disney: [
    {
      title: "The Mandalorian",
      type: "series" as const,
      posterUrl: "https://image.tmdb.org/t/p/w500/7WB5Ue2a5c6X8gXnbfuqX8qR6Q.jpg",
      description: "As aventuras de um mandaloriano solitário no outer rim da galáxia.",
      year: 2023,
      rating: "8.6",
      category: "Ficção"
    }
  ],
  apple: [
    {
      title: "Ted Lasso",
      type: "series" as const,
      posterUrl: "https://image.tmdb.org/t/p/w500/7WB5Ue2a5c6X8gXnbfuqX8qR6Q.jpg",
      description: "Um treinador de futebol americano vai para a Inglaterra para treinar um time de futebol.",
      year: 2023,
      rating: "8.8",
      category: "Comédia"
    }
  ]
};

export const streamingService = {
  // Buscar top 5 dos streamings
  async getTopStreamingContent(): Promise<StreamingContent[]> {
    const topContent: StreamingContent[] = [];
    
    // Para cada streaming, pegar o conteúdo top
    Object.entries(TOP_STREAMING_CONTENT).forEach(([service, content]) => {
      content.forEach((item, index) => {
        if (index === 0) { // Apenas o top 1 de cada streaming
          topContent.push({
            id: `${service}-${item.title.replace(/\s+/g, '-').toLowerCase()}`,
            title: item.title,
            type: item.type,
            streamingService: service.charAt(0).toUpperCase() + service.slice(1),
            posterUrl: item.posterUrl,
            backdropUrl: item.posterUrl,
            description: item.description,
            year: item.year,
            rating: item.rating,
            isAvailable: false, // Por padrão, não disponível no nosso catálogo
            category: item.category
          });
        }
      });
    });

    // Salvar no banco de dados se não existir
    await this.syncExternalContent(topContent);

    return topContent.slice(0, 5); // Retornar apenas 5
  },

  // Sincronizar conteúdo externo com o banco
  async syncExternalContent(content: StreamingContent[]) {
    try {
      for (const item of content) {
        await (supabase as any)
          .from('external_content')
          .upsert({
            title: item.title,
            type: item.type,
            streaming_service: item.streamingService,
            poster_url: item.posterUrl,
            backdrop_url: item.backdropUrl,
            description: item.description,
            year: item.year,
            rating: item.rating,
            is_available: item.isAvailable,
            category: item.category
          }, {
            onConflict: 'title,streaming_service'
          });
      }
    } catch (error) {
      console.error('Error syncing external content:', error);
    }
  },

  // Verificar se conteúdo existe no nosso catálogo
  async checkContentAvailability(title: string): Promise<boolean> {
    try {
      // Buscar em todas as tabelas principais
      const tables = ['cinema', 'series', 'filmes_kids', 'series_kids'];
      
      for (const table of tables) {
        const { data } = await (supabase as any)
          .from(table)
          .select('id')
          .ilike('titulo', title + '%')
          .limit(1);
        
        if (data && data.length > 0) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking content availability:', error);
      return false;
    }
  },

  // Marcar conteúdo como disponível quando adicionado ao catálogo
  async markAsAvailable(title: string, tmdbId?: string) {
    try {
      await (supabase as any)
        .from('external_content')
        .update({ 
          is_available: true,
          tmdb_id: tmdbId
        })
        .ilike('title', title + '%');
    } catch (error) {
      console.error('Error marking content as available:', error);
    }
  }
};
