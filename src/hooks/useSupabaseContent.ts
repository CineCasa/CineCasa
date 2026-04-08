import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ContentItem, Category, movieCategories } from "@/data/content";
import { tmdbImageUrl, fetchTmdbDetails } from "@/services/tmdb";
import { useAuth } from "@/components/AuthProvider";

export const useSupabaseContent = () => {
  const { plan } = useAuth();
  
  // Forçar atualização sempre em localhost
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  return useQuery({
    queryKey: ["supabase-content", plan],
    queryFn: async () => {
      // 1. Fetch Supabase Data Recursively to bypass the 1000 rows limit
      const fetchAllRecords = async (table: "cinema" | "filmes_kids" | "series" | "series_kids" | "tv_ao_vivo") => {
        let allData: any[] = [];
        let from = 0;
        const limit = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data, error } = await supabase
            .from(table)
            .select("*")
            .range(from, from + limit - 1);
          
          if (error) {
            console.error(`Error fetching from ${table}:`, error);
            break;
          }
          
          if (data && data.length > 0) {
            allData = [...allData, ...data];
            from += limit;
            hasMore = data.length === limit;
          } else {
            hasMore = false;
          }
        }
        return allData;
      };

      const [
        cinema,
        filmesKids,
        series,
        seriesKids,
        tvAoVivo
      ] = await Promise.all([
        fetchAllRecords("cinema"),
        fetchAllRecords("filmes_kids"),
        fetchAllRecords("series"),
        fetchAllRecords("series_kids"),
        fetchAllRecords("tv_ao_vivo")
      ]);

      const splitGenres = (genreStr: string | null) => {
        if (!genreStr) return [];
        return genreStr.split(",").map(g => g.trim()).filter(g => g.length > 0);
      };

      const mapCinema = (item: any): ContentItem => {
        const genres = splitGenres(item.category || item.genero);
        const category = item.category || item.genero || "Ação"; // Categoria principal
        
        return {
          id: `cinema-${item.id}`,
          tmdbId: item.tmdb_id,
          title: item.titulo,
          image: item.poster ? tmdbImageUrl(item.poster, "w500") : "",
          backdrop: item.poster ? tmdbImageUrl(item.poster, "original") : "",
          year: parseInt(item.year || "0"),
          rating: item.rating || "N/A",
          duration: "",
          genre: genres.length > 0 ? genres : ["Filme"],
          category: category, // Usar categoria do Supabase
          description: item.description || "",
          type: (item.type as any) || "movie",
          trailer: item.trailer,
          url: item.url
        };
      };

      const mapFilmesKids = (item: any): ContentItem => {
        const genres = splitGenres(item.genero || item.category);
        const category = item.category || item.genero || "Animação"; // Categoria principal
        
        return {
          id: `kids-movie-${item.id}`,
          tmdbId: item.tmdb_id,
          title: item.titulo,
          image: item.poster ? tmdbImageUrl(item.poster, "w500") : "",
          backdrop: item.poster ? tmdbImageUrl(item.poster, "original") : "",
          year: parseInt(item.year || "0"),
          rating: item.rating || "L",
          duration: "",
          genre: genres.length > 0 ? genres : ["Infantil"],
          category: category, // Usar categoria do Supabase
          description: item.description || "",
          type: "movie",
          url: item.url,
          trailer: item.trailer
        };
      };

      const mapSeries = (item: any): ContentItem => {
        const genres = splitGenres(item.genero || item.category);
        const category = item.category || item.genero || "Drama"; // Categoria principal
        
        return {
          id: `series-${item.id}`,
          tmdbId: item.tmdb_id,
          title: item.titulo,
          image: item.poster ? tmdbImageUrl(item.poster, "w500") : "",
          backdrop: item.poster ? tmdbImageUrl(item.poster, "original") : "",
          year: parseInt(item.year || "0"),
          rating: item.rating || "N/A",
          duration: "",
          genre: genres.length > 0 ? genres : ["Série"],
          category: category, // Usar categoria do Supabase
          description: item.description || "",
          type: "series",
          trailer: item.trailer,
          identificadorArchive: item.identificador_archive
        };
      };

      const mapSeriesKids = (item: any): ContentItem => {
        const genres = splitGenres(item.genero || item.category);
        const category = item.category || item.genero || "Animação"; // Categoria principal
        
        return {
          id: `kids-series-${item.id}`,
          tmdbId: item.tmdb_id,
          title: item.titulo,
          image: item.poster ? tmdbImageUrl(item.poster, "w500") : "",
          backdrop: item.poster ? tmdbImageUrl(item.poster, "original") : "",
          year: parseInt(item.year || "0"),
          rating: item.rating || "L",
          duration: "",
          genre: genres.length > 0 ? genres : ["Infantil"],
          category: category, // Usar categoria do Supabase
          description: item.description || "",
          type: "series",
          identificadorArchive: item.identificador_archive,
          trailer: item.trailer
        };
      };

      const mapTv = (item: any): ContentItem => ({
        id: `tv-${item.id}`,
        title: item.nome,
        image: item.logo || "",
        year: new Date().getFullYear(),
        rating: "L",
        duration: "AO VIVO",
        genre: item.grupo ? [item.grupo] : ["TV"],
        category: "TV ao Vivo", // Categoria fixa
        description: "Canal de TV ao Vivo",
        type: "movie",
        trailer: item.url
      });

      // Fetch TMDB data in chunks for all tables
      const cinemaWithData: ContentItem[] = [];
      if (cinema && cinema.length > 0) {
        for (let i = 0; i < cinema.length; i += 50) {
          const chunkResults = await Promise.all(cinema.slice(i, i + 50).map(async (item: any) => {
            const base = mapCinema(item);
            if (!item.tmdb_id) return base;
            const data = await fetchTmdbDetails(item.tmdb_id, "movie");
            if (!data) return base;
            return {
              ...base,
              image: data.poster_path ? tmdbImageUrl(data.poster_path, "w500") : base.image,
              backdrop: data.backdrop_path ? tmdbImageUrl(data.backdrop_path, "original") : base.backdrop,
              year: parseInt(data.release_date?.split("-")[0] || item.year || "0"),
              rating: data.vote_average?.toFixed(1) || item.rating || "N/A",
              genre: data.genres?.map((g: any) => g.name) || base.genre
            };
          }));
          cinemaWithData.push(...chunkResults);
        }
      }

      const seriesWithData: ContentItem[] = [];
      if (series && series.length > 0) {
        for (let i = 0; i < series.length; i += 40) {
          const chunkResults = await Promise.all(series.slice(i, i + 40).map(async (s: any) => {
            if (!s.tmdb_id) return mapSeries(s);
            const data = await fetchTmdbDetails(s.tmdb_id, "tv");
            if (!data) return mapSeries(s);
            return {
              ...mapSeries(s),
              image: data.poster_path ? tmdbImageUrl(data.poster_path, "w500") : tmdbImageUrl(s.poster, "w500"),
              backdrop: data.backdrop_path ? tmdbImageUrl(data.backdrop_path, "original") : tmdbImageUrl(s.poster, "original"),
              year: parseInt(data.first_air_date?.split("-")[0] || "0"),
              rating: data.vote_average?.toFixed(1) || "N/A",
              genre: data.genres?.map((g: any) => g.name) || splitGenres(s.genero || s.category)
            };
          }));
          seriesWithData.push(...chunkResults);
        }
      }

      const kidsMoviesWithData: ContentItem[] = [];
      if (filmesKids && filmesKids.length > 0) {
        for (let i = 0; i < filmesKids.length; i += 50) {
          const chunkResults = await Promise.all(filmesKids.slice(i, i + 50).map(async (item: any) => {
            const base = mapFilmesKids(item);
            if (!item.tmdb_id) return base;
            const data = await fetchTmdbDetails(item.tmdb_id, "movie");
            if (!data) return base;
            return {
              ...base,
              image: data.poster_path ? tmdbImageUrl(data.poster_path, "w500") : base.image,
              backdrop: data.backdrop_path ? tmdbImageUrl(data.backdrop_path, "original") : base.backdrop,
              year: parseInt(data.release_date?.split("-")[0] || item.year || "0"),
              rating: data.vote_average?.toFixed(1) || item.rating || "L",
              genre: data.genres?.map((g: any) => g.name) || base.genre
            };
          }));
          kidsMoviesWithData.push(...chunkResults);
        }
      }

      const kidsSeriesWithData: ContentItem[] = [];
      if (seriesKids && seriesKids.length > 0) {
        for (let i = 0; i < seriesKids.length; i += 50) {
          const chunkResults = await Promise.all(seriesKids.slice(i, i + 50).map(async (item: any) => {
            const base = mapSeriesKids(item);
            if (!item.tmdb_id) return base;
            const data = await fetchTmdbDetails(item.tmdb_id, "tv");
            if (!data) return base;
            return {
              ...base,
              image: data.poster_path ? tmdbImageUrl(data.poster_path, "w500") : base.image,
              backdrop: data.backdrop_path ? tmdbImageUrl(data.backdrop_path, "original") : base.backdrop,
              year: parseInt(data.first_air_date?.split("-")[0] || item.year || "0"),
              rating: data.vote_average?.toFixed(1) || item.rating || "L",
              genre: data.genres?.map((g: any) => g.name) || base.genre
            };
          }));
          kidsSeriesWithData.push(...chunkResults);
        }
      }

      // 2. Planning logic
      if (plan === "none") return [];

      let finalCinema = cinemaWithData;
      let finalSeries = seriesWithData;
      let finalKidsMovies = kidsMoviesWithData;
      let finalKidsSeries = kidsSeriesWithData;
      let finalTv = tvAoVivo;

      if (plan === "basic") {
        finalCinema = cinemaWithData.filter(c => c.year < 2025);
        finalSeries = seriesWithData.filter(s => s.year <= 2023);
        finalKidsMovies = kidsMoviesWithData;
        finalKidsSeries = kidsSeriesWithData;
        finalTv = [];
      }

      // 3. Criar categorias EXATAS conforme movieCategories
      const categories: Category[] = [];

      // Função para alocar itens às categorias mestras
      const allocateItemsToCategories = (items: ContentItem[], prefix: string) => {
        const grouped: Record<string, ContentItem[]> = {};
        
        // Inicializar todas as categorias
        movieCategories.forEach(cat => {
          grouped[cat] = [];
        });

        items.forEach(item => {
          const itemCategories = [item.category, ...item.genre];
          let allocated = false;

          // Verificar lançamentos primeiro (prioridade máxima)
          if (item.year === 2026 && grouped["Lançamento 2026"]) {
            grouped["Lançamento 2026"].push(item);
            allocated = true;
          } else if (item.year === 2025 && grouped["Lançamento 2025"]) {
            grouped["Lançamento 2025"].push(item);
            allocated = true;
          }

          // Se não foi alocado como lançamento, procurar categoria exata
          if (!allocated) {
            for (const catName of movieCategories) {
              if (catName.startsWith("Lançamento")) continue;
              
              // Verificar se a categoria do item corresponde exatamente
              if (itemCategories.includes(catName)) {
                grouped[catName].push(item);
                allocated = true;
                break;
              }
            }
          }

          // Fallback para Ação se não encontrar categoria
          if (!allocated && grouped["Ação"]) {
            grouped["Ação"].push(item);
          }
        });

        // Retornar categorias com itens, mantendo ordem original
        return movieCategories
          .map(title => ({
            id: `${prefix}-${title.toLowerCase().replace(/\s+/g, "-")}`,
            title,
            items: grouped[title].sort((a, b) => a.title.localeCompare(b.title))
          }))
          .filter(cat => cat.items.length > 0);
      };

      // Adicionar categorias de cinema
      if (finalCinema.length > 0) {
        categories.push(...allocateItemsToCategories(finalCinema, "cinema"));
      }

      // Adicionar categorias de séries
      if (finalSeries.length > 0) {
        categories.push(...allocateItemsToCategories(finalSeries, "series"));
      }

      // Categorias infantis (mantém estrutura atual)
      if (finalKidsMovies.length > 0) {
        const uniqueKidsMap = new Map();
        finalKidsMovies.forEach(c => {
           const key = c.title.toLowerCase().trim();
           if (!uniqueKidsMap.has(key)) uniqueKidsMap.set(key, c);
        });
        categories.push({ id: "kids-movies", title: "Filmes Infantis", items: Array.from(uniqueKidsMap.values()) });
      }

      if (finalKidsSeries.length > 0) {
        const uniqueSeriesKidsMap = new Map();
        finalKidsSeries.forEach(c => {
           const key = c.title.toLowerCase().trim();
           if (!uniqueSeriesKidsMap.has(key)) uniqueSeriesKidsMap.set(key, c);
        });
        categories.push({ id: "kids-series", title: "Séries Infantis", items: Array.from(uniqueSeriesKidsMap.values()) });
      }

      if (finalTv && finalTv.length > 0) {
        categories.push({ id: "tv-live", title: "TV ao Vivo", items: finalTv.map(mapTv) });
      }

      return categories;
    },
    // Forçar atualização sempre em localhost, cache normal em produção
    staleTime: isLocalhost ? 0 : 10 * 60 * 1000, // 0 em localhost, 10 minutos em produção
    refetchOnWindowFocus: false,
    refetchOnMount: isLocalhost ? 'always' : false
  });
};
