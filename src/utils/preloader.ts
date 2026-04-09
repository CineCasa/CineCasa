interface PreloadItem {
  url: string;
  type: 'video' | 'image' | 'audio';
  priority: 'high' | 'medium' | 'low';
}

class PreloadManager {
  private preloadedItems = new Set<string>();
  private preloadQueue: PreloadItem[] = [];
  private isProcessing = false;

  // Adicionar item à fila de preload
  add(item: PreloadItem): void {
    if (this.preloadedItems.has(item.url)) return;

    this.preloadQueue.push(item);
    this.processQueue();
  }

  // Processar fila de preload
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.preloadQueue.length === 0) return;

    this.isProcessing = true;

    // Ordenar por prioridade
    this.preloadQueue.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    while (this.preloadQueue.length > 0) {
      const item = this.preloadQueue.shift()!;
      await this.preloadItem(item);
    }

    this.isProcessing = false;
  }

  // Preload individual
  private async preloadItem(item: PreloadItem): Promise<void> {
    try {
      switch (item.type) {
        case 'video':
          await this.preloadVideo(item.url);
          break;
        case 'image':
          await this.preloadImage(item.url);
          break;
        case 'audio':
          await this.preloadAudio(item.url);
          break;
      }

      this.preloadedItems.add(item.url);
      console.log(`✅ Preloaded: ${item.type} - ${item.url}`);
    } catch (error) {
      console.error(`❌ Failed to preload: ${item.url}`, error);
    }
  }

  // Preload de vídeo
  private preloadVideo(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'auto';
      video.muted = true;
      
      video.onloadeddata = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      
      video.onerror = () => reject(new Error(`Failed to preload video: ${url}`));
      
      video.src = url;
    });
  }

  // Preload de imagem
  private preloadImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      
      img.onerror = () => reject(new Error(`Failed to preload image: ${url}`));
      
      img.src = url;
    });
  }

  // Preload de áudio
  private preloadAudio(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      
      audio.oncanplaythrough = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      
      audio.onerror = () => reject(new Error(`Failed to preload audio: ${url}`));
      
      audio.src = url;
    });
  }

  // Preload múltiplos trailers
  preloadTrailers(trailers: string[]): void {
    trailers.forEach((trailer, index) => {
      this.add({
        url: trailer,
        type: 'video',
        priority: index < 3 ? 'high' : 'medium', // Primeiros 3 trailers com alta prioridade
      });
    });
  }

  // Preload de imagens de hero banner
  preloadHeroImages(images: string[]): void {
    images.forEach((image, index) => {
      this.add({
        url: image,
        type: 'image',
        priority: index === 0 ? 'high' : 'medium',
      });
    });
  }

  // Limpar cache de preload
  clearCache(): void {
    this.preloadedItems.clear();
    this.preloadQueue = [];
  }

  // Estatísticas
  getStats(): { preloaded: number; queued: number } {
    return {
      preloaded: this.preloadedItems.size,
      queued: this.preloadQueue.length,
    };
  }
}

export const preloader = new PreloadManager();

// Hook para preload inteligente
export function usePreloader() {
  const preloadHeroContent = (heroItems: any[]) => {
    // Preload imagens dos primeiros 3 hero items
    const heroImages = heroItems.slice(0, 3).map(item => item.coverImage || item.backdropPath);
    preloader.preloadHeroImages(heroImages);

    // Preload trailers dos primeiros 2 hero items
    const heroTrailers = heroItems.slice(0, 2).map(item => item.trailerUrl).filter(Boolean);
    preloader.preloadTrailers(heroTrailers);
  };

  const preloadCategoryContent = (items: any[]) => {
    // Preload imagens dos primeiros 6 itens de cada categoria
    const images = items.slice(0, 6).map(item => item.coverImage || item.posterPath);
    images.forEach(image => {
      preloader.add({
        url: image,
        type: 'image',
        priority: 'medium',
      });
    });
  };

  return {
    preloadHeroContent,
    preloadCategoryContent,
    clearCache: preloader.clearCache.bind(preloader),
    getStats: preloader.getStats.bind(preloader),
  };
}
