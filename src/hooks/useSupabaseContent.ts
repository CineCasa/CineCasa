import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ContentItem, Category } from "@/data/content";
import { tmdbImageUrl, fetchTmdbDetails } from "@/services/tmdb";

export const useSupabaseContent = () => {
  return useQuery({
    queryKey: ["supabase-content"],
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
          description: item.description || "",
          type: (item.type as any) || "movie",
          trailer: item.trailer,
          url: item.url
        };
      };

      const mapFilmesKids = (item: any): ContentItem => {
        const genres = splitGenres(item.genero || item.category);
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
          description: item.description || "",
          type: "movie",
          url: item.url,
          trailer: item.trailer
        };
      };

      const mapSeries = (item: any): ContentItem => {
        const genres = splitGenres(item.genero || item.category);
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
          description: item.description || "",
          type: "series",
          trailer: item.trailer,
          identificadorArchive: item.identificador_archive
        };
      };

      const mapSeriesKids = (item: any): ContentItem => {
        const genres = splitGenres(item.genero || item.category);
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
        description: "Canal de TV ao Vivo",
        type: "movie",
        trailer: item.url
      });

      const MASTER_CATEGORIES = [
        "Lançamento 2026", "Lançamento 2025", "Ação", "Aventura", "Anime", "Animação", 
        "Comédia", "Drama", "Dorama", "Clássicos", "Negritude", "Crime", "Policial", 
        "Família", "Musical", "Documentário", "Faroeste", "Ficção", "Nacional", 
        "Religioso", "Romance", "Terror", "Suspense", "Adulto"
      ];

      const categories: Category[] = [];

      const allocateItemsToMasterCategories = (items: ContentItem[], prefix: string, fallback: string) => {
        const grouped: Record<string, ContentItem[]> = {};
        MASTER_CATEGORIES.forEach(cat => {
          grouped[cat] = [];
        });

        items.forEach(item => {
          const itemYear = item.year?.toString() || "0";
          const itemCats = item.genre.map(g => g.toLowerCase());
          let allocated = false;

          // 1. Check for launches first
          if (itemYear === "2026" && grouped["Lançamento 2026"]) {
             grouped["Lançamento 2026"].push(item); allocated = true;
          } else if (itemYear === "2025" && grouped["Lançamento 2025"]) {
             grouped["Lançamento 2025"].push(item); allocated = true;
          }

          // 2. Map to master categories
          if (!allocated) {
             for (const catName of MASTER_CATEGORIES) {
                if (catName.startsWith("Lançamento")) continue;
                
                const catNameLower = catName.toLowerCase();
                // Special mapping logic for complex TMDB Portuguese/English genres to ensure they hit your strict categories
                const hasMatch = itemCats.some(g => {
                  if (g === catNameLower || g.includes(catNameLower)) return true;
                  if (catNameLower === "ação" && g.includes("action")) return true;
                  if (catNameLower === "aventura" && g.includes("adventure")) return true;
                  if (catNameLower === "ficção" && (g.includes("sci") || g.includes("fantasy") || g.includes("fantasia"))) return true;
                  if (catNameLower === "policial" && (g.includes("police") || g.includes("investiga") || g.includes("mistério") || g.includes("mystery"))) return true;
                  if (catNameLower === "terror" && g.includes("horror")) return true;
                  if (catNameLower === "comédia" && g.includes("comedy")) return true;
                  if (catNameLower === "família" && g.includes("family")) return true;
                  if (catNameLower === "documentário" && g.includes("documentary")) return true;
                  if (catNameLower === "faroeste" && g.includes("western")) return true;
                  if (catNameLower === "romance" && g.includes("romântico")) return true;
                  if (catNameLower === "adulto" && g.includes("aduto")) return true;
                  return false;
                });
                
                if (hasMatch && grouped[catName]) {
                   grouped[catName].push(item);
                   allocated = true;
                   // Removed break to allow multiple categories
                }
             }
          }

          // 3. Fallback
          if (!allocated && grouped[fallback]) {
             grouped[fallback].push(item);
          } else if (!allocated && grouped["Ação"]) {
             grouped["Ação"].push(item);
          }
        });

        return MASTER_CATEGORIES
          .map(title => ({
            id: `${prefix}-${title.toLowerCase().replace(/\s+/g, "-")}`,
            title,
            items: grouped[title].sort((a, b) => a.title.localeCompare(b.title))
          }))
          .filter(cat => cat.items.length > 0);
      };

      let cinemaWithData: ContentItem[] = [];
      if (cinema && cinema.length > 0) {
        const chunkSize = 50;
        for (let i = 0; i < cinema.length; i += chunkSize) {
          const chunk = cinema.slice(i, i + chunkSize);
          const chunkResults = await Promise.all(
            chunk.map(async (item: any) => {
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
            })
          );
          cinemaWithData.push(...chunkResults);
          if (cinema.length > 500) await new Promise(r => setTimeout(r, 100));
        }
      }

      if (cinemaWithData.length > 0) {
        const uniqueCinemaMap = new Map();
        cinemaWithData.forEach(c => {
           const key = c.title.toLowerCase().trim();
           if (!uniqueCinemaMap.has(key)) {
             uniqueCinemaMap.set(key, c);
           }
        });
        categories.push(...allocateItemsToMasterCategories(Array.from(uniqueCinemaMap.values()), "cinema", "Ação"));
      }

      // Fetch TMDB data for SERIES safely in batches. Covers are wrong/blank without this!
      let seriesWithData: ContentItem[] = [];
      if (series && series.length > 0) {
        const chunkSize = 40; // Max parallel requests per batch (safe for TMDB 50 req/s limit)
        for (let i = 0; i < series.length; i += chunkSize) {
          const chunk = series.slice(i, i + chunkSize);
          const chunkResults = await Promise.all(
            chunk.map(async (s: any) => {
              if (!s.tmdb_id) return mapSeries(s);
              const data = await fetchTmdbDetails(s.tmdb_id, "tv");
              if (!data) return mapSeries(s);
              
              const genres = data.genres?.map((g: any) => g.name) || splitGenres(s.genero || s.category);
              
              return {
                ...mapSeries(s),
                image: data.poster_path ? tmdbImageUrl(data.poster_path, "w500") : tmdbImageUrl(s.poster, "w500"),
                backdrop: data.backdrop_path ? tmdbImageUrl(data.backdrop_path, "original") : tmdbImageUrl(s.poster, "original"),
                year: parseInt(data.first_air_date?.split("-")[0] || "0"),
                rating: data.vote_average?.toFixed(1) || "N/A",
                genre: genres
              };
            })
          );
          seriesWithData.push(...chunkResults);
          // Small delay for rate limits when loading 5000+ series
          if (series.length > 200) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }
      }

      if (seriesWithData.length > 0) {
         const uniqueSeriesMap = new Map();
         seriesWithData.forEach(s => {
           const key = s.title.toLowerCase().trim();
           if (!uniqueSeriesMap.has(key)) {
             uniqueSeriesMap.set(key, s);
           }
         });
         categories.push(...allocateItemsToMasterCategories(Array.from(uniqueSeriesMap.values()), "series", "Drama"));
      }

      let kidsMoviesWithData: ContentItem[] = [];
      if (filmesKids && filmesKids.length > 0) {
        const chunkSize = 50;
        for (let i = 0; i < filmesKids.length; i += chunkSize) {
          const chunk = filmesKids.slice(i, i + chunkSize);
          const chunkResults = await Promise.all(
            chunk.map(async (item: any) => {
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
            })
          );
          kidsMoviesWithData.push(...chunkResults);
        }
      }

      if (kidsMoviesWithData.length > 0) {
        const uniqueKidsMap = new Map();
        kidsMoviesWithData.forEach(c => {
           const key = c.title.toLowerCase().trim();
           if (!uniqueKidsMap.has(key)) uniqueKidsMap.set(key, c);
        });
        categories.push({
          id: "kids-movies",
          title: "Filmes Infantis",
          items: Array.from(uniqueKidsMap.values())
        });
      }

      let kidsSeriesWithData: ContentItem[] = [];
      if (seriesKids && seriesKids.length > 0) {
        const chunkSize = 50;
        for (let i = 0; i < seriesKids.length; i += chunkSize) {
          const chunk = seriesKids.slice(i, i + chunkSize);
          const chunkResults = await Promise.all(
            chunk.map(async (item: any) => {
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
            })
          );
          kidsSeriesWithData.push(...chunkResults);
        }
      }

      if (kidsSeriesWithData.length > 0) {
        const uniqueSeriesKidsMap = new Map();
        kidsSeriesWithData.forEach(c => {
           const key = c.title.toLowerCase().trim();
           if (!uniqueSeriesKidsMap.has(key)) uniqueSeriesKidsMap.set(key, c);
        });
        categories.push({
          id: "kids-series",
          title: "Séries Infantis",
          items: Array.from(uniqueSeriesKidsMap.values())
        });
      }

      if (tvAoVivo && tvAoVivo.length > 0) {
        categories.push({
          id: "tv-live",
          title: "TV ao Vivo",
          items: tvAoVivo.map(mapTv)
        });
      }

      return categories;
    }
  });
};
