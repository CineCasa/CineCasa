import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Film, Monitor, Baby, Users } from "lucide-react";

interface ContentCount {
  movies: number;
  series: number;
  kidsMovies: number;
  kidsSeries: number;
  total: number;
}

const ContentCounter = () => {
  const [counts, setCounts] = useState<ContentCount>({
    movies: 0,
    series: 0,
    kidsMovies: 0,
    kidsSeries: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContentCounts = async () => {
      try {
        // Função recursiva para contar todos os registros
        const countAllRecords = async (table: string) => {
          let totalCount = 0;
          let from = 0;
          const limit = 1000;
          let hasMore = true;

          while (hasMore) {
            const { data, error, count } = await supabase
              .from(table as any)
              .select("*", { count: "exact", head: true })
              .range(from, from + limit - 1);

            if (error) throw error;
            
            if (count !== null) {
              totalCount = count;
              hasMore = false;
            } else {
              from += limit;
              if (data && data.length < limit) {
                hasMore = false;
                totalCount += data.length;
              }
            }
          }
          
          return totalCount;
        };

        // Contar registros de cada tabela
        const [moviesCount, seriesCount, kidsMoviesCount, kidsSeriesCount] = await Promise.all([
          countAllRecords("cinema"),
          countAllRecords("series"),
          countAllRecords("filmes_kids"),
          countAllRecords("series_kids")
        ]);

        const total = moviesCount + seriesCount + kidsMoviesCount + kidsSeriesCount;

        setCounts({
          movies: moviesCount,
          series: seriesCount,
          kidsMovies: kidsMoviesCount,
          kidsSeries: kidsSeriesCount,
          total
        });

      } catch (error) {
        console.error("Erro ao contar conteúdo:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContentCounts();
  }, []);

  if (loading) {
    return (
      <div className="bg-[#1a1a1a] rounded-lg p-6 border border-white/10">
        <div className="animate-pulse">
          <div className="h-6 bg-white/10 rounded mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-white/10 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-6 border border-white/10">
      <div className="flex items-center gap-3 mb-6">
        <Users className="text-blue-500" size={24} />
        <h2 className="text-xl font-bold text-white">Conteúdo do Catálogo</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#2a2a2a] rounded-lg p-4 text-center">
          <Film className="text-red-500 mx-auto mb-2" size={24} />
          <div className="text-lg sm:text-xl md:text-2xl font-bold text-white">{counts.movies.toLocaleString()}</div>
          <div className="text-sm text-white/60">Filmes</div>
        </div>

        <div className="bg-[#2a2a2a] rounded-lg p-4 text-center">
          <Monitor className="text-blue-500 mx-auto mb-2" size={24} />
          <div className="text-lg sm:text-xl md:text-2xl font-bold text-white">{counts.series.toLocaleString()}</div>
          <div className="text-sm text-white/60">Séries</div>
        </div>

        <div className="bg-[#2a2a2a] rounded-lg p-4 text-center">
          <Baby className="text-green-500 mx-auto mb-2" size={24} />
          <div className="text-lg sm:text-xl md:text-2xl font-bold text-white">
            {(counts.kidsMovies + counts.kidsSeries).toLocaleString()}
          </div>
          <div className="text-sm text-white/60">Infantil</div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-4 text-center">
          <Users className="text-white mx-auto mb-2" size={24} />
          <div className="text-lg sm:text-xl md:text-2xl font-bold text-white">{counts.total.toLocaleString()}</div>
          <div className="text-sm text-white/90">Total</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-[#2a2a2a] rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-sm">Filmes Kids</span>
            <span className="text-white font-bold">{counts.kidsMovies.toLocaleString()}</span>
          </div>
        </div>
        <div className="bg-[#2a2a2a] rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-sm">Séries Kids</span>
            <span className="text-white font-bold">{counts.kidsSeries.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentCounter;
