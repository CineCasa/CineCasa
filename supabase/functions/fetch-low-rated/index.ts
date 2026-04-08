import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TMDB_API_KEY = "b275ce8e1a6b3d5d879bb0907e4f56ad";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    console.log("[TMDB Low Rated] Buscando conteúdos com avaliações baixas...");

    // Buscar filmes com baixa avaliação do TMDB (página 1-5 para ter variedade)
    const lowRatedMovies: any[] = [];
    for (let page = 1; page <= 5; page++) {
      const res = await fetch(
        `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=pt-BR&sort_by=vote_average.asc&vote_count.gte=100&page=${page}`
      );
      if (res.ok) {
        const data = await res.json();
        lowRatedMovies.push(...(data.results || []));
      }
    }

    // Buscar séries com baixa avaliação do TMDB
    const lowRatedSeries: any[] = [];
    for (let page = 1; page <= 5; page++) {
      const res = await fetch(
        `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&language=pt-BR&sort_by=vote_average.asc&vote_count.gte=100&page=${page}`
      );
      if (res.ok) {
        const data = await res.json();
        lowRatedSeries.push(...(data.results || []));
      }
    }

    console.log(`[TMDB Low Rated] Filmes encontrados: ${lowRatedMovies.length}`);
    console.log(`[TMDB Low Rated] Séries encontradas: ${lowRatedSeries.length}`);

    // Verificar quais existem no banco de dados
    const moviesInDatabase: any[] = [];
    const seriesInDatabase: any[] = [];

    // Verificar filmes no banco
    for (const movie of lowRatedMovies.slice(0, 50)) {
      const { data: existing } = await supabase
        .from("cinema")
        .select("*")
        .or(`tmdb_id.eq.${movie.id},titulo.ilike.%${movie.title}%`)
        .limit(1);

      if (existing && existing.length > 0) {
        moviesInDatabase.push({
          tmdb_id: movie.id,
          title: movie.title,
          poster: movie.poster_path,
          rating: movie.vote_average,
          year: movie.release_date?.substring(0, 4),
          database_id: existing[0].id,
          database_title: existing[0].titulo,
          database_poster: existing[0].poster,
        });
      }
    }

    // Verificar séries no banco
    for (const serie of lowRatedSeries.slice(0, 50)) {
      const { data: existing } = await supabase
        .from("series")
        .select("*")
        .or(`tmdb_id.eq.${serie.id},titulo.ilike.%${serie.name}%`)
        .limit(1);

      if (existing && existing.length > 0) {
        seriesInDatabase.push({
          tmdb_id: serie.id,
          title: serie.name,
          poster: serie.poster_path,
          rating: serie.vote_average,
          year: serie.first_air_date?.substring(0, 4),
          database_id: existing[0].id,
          database_title: existing[0].titulo,
          database_poster: existing[0].poster,
        });
      }
    }

    console.log(`[TMDB Low Rated] Filmes no banco: ${moviesInDatabase.length}`);
    console.log(`[TMDB Low Rated] Séries no banco: ${seriesInDatabase.length}`);

    // Combinar e ordenar por avaliação (menor primeiro)
    const allLowRated = [...moviesInDatabase, ...seriesInDatabase]
      .sort((a, b) => a.rating - b.rating)
      .slice(0, 10); // Pegar os 10 piores

    // Salvar no cache
    const { error: upsertError } = await supabase
      .from("tmdb_low_rated_cache")
      .upsert({
        id: "poderia_ser_melhor",
        data: allLowRated,
        updated_at: new Date().toISOString(),
      });

    if (upsertError) {
      console.error("[TMDB Low Rated] Erro ao salvar cache:", upsertError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        movies_found: moviesInDatabase.length,
        series_found: seriesInDatabase.length,
        total_cached: allLowRated.length,
        data: allLowRated,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[TMDB Low Rated] Erro:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
