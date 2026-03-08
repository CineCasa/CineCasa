import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ContentItem, Category } from "@/data/content";
import { tmdbImageUrl, fetchTmdbDetails } from "@/services/tmdb";

export const useSupabaseContent = () => {
  return useQuery({
    queryKey: ["supabase-content"],
    queryFn: async () => {
      const [
        { data: cinema },
        { data: filmesKids },
        { data: series },
        { data: seriesKids },
        { data: tvAoVivo }
      ] = await Promise.all([
        supabase.from("cinema").select("*"),
        supabase.from("filmes_kids").select("*"),
        supabase.from("series").select("*"),
        supabase.from("series_kids").select("*"),
        supabase.from("tv_ao_vivo").select("*")
      ]);

      const mapCinema = (item: any): ContentItem => ({
        id: `cinema-${item.id}`,
        tmdbId: item.tmdb_id,
        title: item.titulo,
        image: item.poster ? tmdbImageUrl(item.poster, "w500") : "",
        backdrop: item.poster ? tmdbImageUrl(item.poster, "original") : "",
        year: parseInt(item.year || "0"),
        rating: item.rating || "N/A",
        duration: "",
        genre: item.category ? [item.category] : [],
        description: item.description || "",
        type: (item.type as any) || "movie",
        trailer: item.trailer
      });

      const mapFilmesKids = (item: any): ContentItem => ({
        id: `kids-movie-${item.id}`,
        title: item.titulo,
        image: item.poster ? tmdbImageUrl(item.poster, "w500") : "",
        backdrop: item.poster ? tmdbImageUrl(item.poster, "original") : "",
        year: parseInt(item.year || "0"),
        rating: item.rating || "L",
        duration: "",
        genre: item.genero ? [item.genero] : ["Infantil"],
        description: item.description || "",
        type: "movie"
      });

      const mapSeries = (item: any): ContentItem => ({
        id: `series-${item.id}`,
        tmdbId: item.tmdb_id,
        title: item.titulo,
        image: item.poster ? tmdbImageUrl(item.poster, "w500") : "",
        backdrop: item.poster ? tmdbImageUrl(item.poster, "original") : "",
        year: parseInt(item.year || "0"),
        rating: item.rating || "N/A",
        duration: "",
        genre: item.genero ? [item.genero] : ["Série"],
        description: item.description || "",
        type: "series",
        trailer: item.trailer
      });

      const mapSeriesKids = (item: any): ContentItem => ({
        id: `kids-series-${item.id}`,
        title: item.titulo,
        image: item.poster ? tmdbImageUrl(item.poster, "w500") : "",
        backdrop: item.poster ? tmdbImageUrl(item.poster, "original") : "",
        year: parseInt(item.year || "0"),
        rating: item.rating || "L",
        duration: "",
        genre: item.genero ? [item.genero] : ["Infantil"],
        description: item.description || "",
        type: "series"
      });

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

      const CINEMA_MASTER_CATEGORIES = [
        "Filmes recomendados para você", 
        "Adicionados recentemente", 
        "Ação imperdível", 
        "Comédias para rir alto", 
        "Drama e emoção", 
        "Suspense e Terror",
        "Romance de tirar o fôlego",
        "Documentários e Histórias Reais",
        "Aventura em família",
        "Filmes Nacionais"
      ];

      const SERIES_MASTER_CATEGORIES = [
        "Séries que achamos que você vai curtir",
        "Séries dramáticas de sucesso",
        "Sci-Fi e Fantasia aclamadas",
        "Investigação e Mistério",
        "Comédias de TV populares",
        "Animações que você precisa ver",
        "Reality Shows em alta"
      ];

      const categories: Category[] = [];

      // Helper to group items by multiple categories
      const groupItems = (items: any[], type: "cinema" | "series") => {
        const masterList = type === "cinema" ? CINEMA_MASTER_CATEGORIES : SERIES_MASTER_CATEGORIES;
        const grouped: Record<string, ContentItem[]> = {};
        
        masterList.forEach(catName => {
          grouped[catName] = [];
        });

        items.forEach(item => {
          const itemYear = item.year?.toString() || "0";
          const rawCats = (item.category || item.genero || "");
          const itemCats = rawCats.split(",").map((s: string) => s.trim());
          
          let allocated = false;

          // 1. Check for launches first (Priority)
          if (itemYear === "2026" || itemYear === "2025") {
             if (type === "cinema" && grouped["Adicionados recentemente"]) {
                grouped["Adicionados recentemente"].push(mapCinema(item));
                allocated = true;
             }
          }

          // 2. Main Categorization Logic mapping to Prime Video specific strings
          if (!allocated) {
            if (type === "cinema") {
               for (const c of itemCats) {
                 const catLower = c.toLowerCase();
                 if ((catLower.includes("ação") || catLower.includes("policial")) && grouped["Ação imperdível"]) {
                    grouped["Ação imperdível"].push(mapCinema(item)); allocated = true; break;
                 }
                 if (catLower.includes("comédia") && grouped["Comédias para rir alto"]) {
                    grouped["Comédias para rir alto"].push(mapCinema(item)); allocated = true; break;
                 }
                 if ((catLower.includes("terror") || catLower.includes("suspense")) && grouped["Suspense e Terror"]) {
                    grouped["Suspense e Terror"].push(mapCinema(item)); allocated = true; break;
                 }
                 if ((catLower.includes("drama") || catLower.includes("dorama")) && grouped["Drama e emoção"]) {
                    grouped["Drama e emoção"].push(mapCinema(item)); allocated = true; break;
                 }
                 if (catLower.includes("romance") && grouped["Romance de tirar o fôlego"]) {
                    grouped["Romance de tirar o fôlego"].push(mapCinema(item)); allocated = true; break;
                 }
                 if (catLower.includes("documentário") && grouped["Documentários e Histórias Reais"]) {
                    grouped["Documentários e Histórias Reais"].push(mapCinema(item)); allocated = true; break;
                 }
                 if (catLower.includes("família") || catLower.includes("aventura")) {
                    grouped["Aventura em família"].push(mapCinema(item)); allocated = true; break;
                 }
               }
            } else {
               // FOR SERIES (exclusive)
               for (const c of itemCats) {
                 const catLower = c.toLowerCase();
                 if ((catLower.includes("drama") || catLower.includes("soap")) && grouped["Séries dramáticas de sucesso"]) {
                    grouped["Séries dramáticas de sucesso"].push(mapSeries(item)); allocated = true; break;
                 }
                 if ((catLower.includes("sci-fi") || catLower.includes("fantasia") || catLower.includes("ficção")) && grouped["Sci-Fi e Fantasia aclamadas"]) {
                    grouped["Sci-Fi e Fantasia aclamadas"].push(mapSeries(item)); allocated = true; break;
                 }
                 if ((catLower.includes("crime") || catLower.includes("mistério") || catLower.includes("policial")) && grouped["Investigação e Mistério"]) {
                    grouped["Investigação e Mistério"].push(mapSeries(item)); allocated = true; break;
                 }
                 if (catLower.includes("comédia") && grouped["Comédias de TV populares"]) {
                    grouped["Comédias de TV populares"].push(mapSeries(item)); allocated = true; break;
                 }
                 if (catLower.includes("animação") && grouped["Animações que você precisa ver"]) {
                    grouped["Animações que você precisa ver"].push(mapSeries(item)); allocated = true; break;
                 }
                 if (catLower.includes("reality") && grouped["Reality Shows em alta"]) {
                    grouped["Reality Shows em alta"].push(mapSeries(item)); allocated = true; break;
                 }
               }
            }
          }

          // 3. Fallback for items that didn't match
          if (!allocated) {
             const fallbackCat = type === "cinema" ? "Filmes recomendados para você" : "Séries que achamos que você vai curtir";
             if (grouped[fallbackCat]) {
               grouped[fallbackCat].push(type === "cinema" ? mapCinema(item) : mapSeries(item));
             }
          }
        });

        return masterList
          .map(title => ({
            id: `${type}-${title.toLowerCase().replace(/\s+/g, "-")}`,
            title,
            items: grouped[title]
          }))
          .filter(cat => cat.items.length > 0);
      };

      if (cinema) {
        categories.push(...groupItems(cinema, "cinema"));
      }

      // Fetch real TMDB data for series because the table is missing it
      const seriesWithData = series ? await Promise.all(
        // Remove limitations, load everything
        series.map(async (s: any) => {
          if (!s.tmdb_id) return mapSeries(s);
          const data = await fetchTmdbDetails(s.tmdb_id, "tv");
          if (!data) return mapSeries(s);
          
          return {
            ...mapSeries(s),
            image: tmdbImageUrl(data.poster_path, "w500"),
            backdrop: tmdbImageUrl(data.backdrop_path, "original"),
            year: parseInt(data.first_air_date?.split("-")[0] || "0"),
            rating: data.vote_average?.toFixed(1) || "N/A",
            // Strictly get official TMDB genres
            genre: data.genres?.map((g: any) => g.name) || ["Série"],
            description: data.overview || ""
          };
        })
      ) : [];

      if (seriesWithData.length > 0) {
        // Group series exactly by their primary TMDB genre (Zero repeats)
        const groupedSeries: Record<string, ContentItem[]> = {};

        seriesWithData.forEach(s => {
          // Get the primary official TMDB genre, or fallback to 'Série'
          const primaryGenre = s.genre && s.genre.length > 0 ? s.genre[0] : "Série";
          
          if (!groupedSeries[primaryGenre]) {
            groupedSeries[primaryGenre] = [];
          }
          groupedSeries[primaryGenre].push(s);
        });

        // Insert categories alphabetically sorted, and series alphabetically sorted inside them
        Object.keys(groupedSeries).sort().forEach(genre => {
          const sortedItems = groupedSeries[genre].sort((a, b) => a.title.localeCompare(b.title));
          
          categories.push({
            id: `series-${genre.toLowerCase().replace(/\s+/g, "-")}`,
            title: genre,
            items: sortedItems
          });
        });
      }

      if (filmesKids && filmesKids.length > 0) {
        categories.push({
          id: "kids-movies",
          title: "Filmes Infantis",
          items: filmesKids.map(mapFilmesKids)
        });
      }

      if (seriesKids && seriesKids.length > 0) {
        categories.push({
          id: "kids-series",
          title: "Séries Infantis",
          items: seriesKids.map(mapSeriesKids)
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
