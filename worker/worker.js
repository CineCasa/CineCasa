export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const SUPABASE_URL = env.SUPABASE_URL;
    const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
    const TMDB_KEY = env.TMDB_KEY;

    async function supabase(path, method = "GET", body = null) {
      const options = {
        method,
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json"
        }
      };
      if (body) options.body = JSON.stringify(body);
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, options);
      return res;
    }

    async function tmdb(path) {
      const res = await fetch(
        `https://api.themoviedb.org/3/${path}?api_key=${TMDB_KEY}&language=pt-BR`
      );
      return res.json();
    }

    // GET /catalog
    if (url.pathname === "/catalog") {
      const res = await supabase("cinema?select=*&order=created_at.desc");
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // GET /movie?tmdb=ID
    if (url.pathname === "/movie") {
      const tmdbId = url.searchParams.get("tmdb");
      const res = await supabase(`cinema?tmdb_id=eq.${tmdbId}&select=*`);
      const data = await res.json();
      return new Response(JSON.stringify(data[0] || {}), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // GET /tmdb/details?tmdb=ID
    if (url.pathname === "/tmdb/details") {
      const tmdbId = url.searchParams.get("tmdb");
      const details = await tmdb(`movie/${tmdbId}`);
      const credits = await tmdb(`movie/${tmdbId}/credits`);
      const cast = (credits.cast || []).slice(0, 15).map(a => ({
        name: a.name,
        photo: a.profile_path
          ? `https://image.tmdb.org/t/p/w300${a.profile_path}`
          : "https://via.placeholder.com/300x450?text=No+Image"
      }));
      const payload = {
        title: details.title || "",
        overview: details.overview || "",
        year: details.release_date ? details.release_date.split("-")[0] : "",
        vote: details.vote_average || "",
        genres: (details.genres || []).map(g => g.name),
        poster: details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : "",
        backdrop: details.backdrop_path ? `https://image.tmdb.org/t/p/original${details.backdrop_path}` : "",
        cast
      };
      return new Response(JSON.stringify(payload), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // POST /list/favorite
    if (url.pathname === "/list/favorite" && request.method === "POST") {
      const body = await request.json();
      await supabase("user_lists", "POST", {
        user_id: "guest",
        tmdb_id: body.tmdb_id,
        type: "favorite"
      });
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // POST /list/watchlater
    if (url.pathname === "/list/watchlater" && request.method === "POST") {
      const body = await request.json();
      await supabase("user_lists", "POST", {
        user_id: "guest",
        tmdb_id: body.tmdb_id,
        type: "watchlater"
      });
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // =========================
    // NOVAS ROTAS DE BANNERS
    // =========================

    // GET /banners/filmes - retorna filmes com backdrop válido
    if (url.pathname === "/banners/filmes") {
      const res = await supabase("cinema?select=tmdb_id,title:titulo,description:overview,year,rating,genre,backdrop,country&backdrop=not.is.null&backdrop=neq.");
      const data = await res.json();
      
      // Formatar resposta
      const banners = data.map(item => ({
        tmdb_id: item.tmdb_id,
        titulo: item.title,
        description: item.description,
        year: item.year,
        rating: item.rating,
        genre: item.genre,
        backdrop: item.backdrop,
        country: item.country
      })).filter(item => item.backdrop && item.backdrop.trim() !== "");

      return new Response(JSON.stringify(banners), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // GET /banners/series - retorna séries com banner válido
    if (url.pathname === "/banners/series") {
      const res = await supabase("series?select=tmdb_id,title:titulo,description:overview,year,rating,genre,banner,country&banner=not.is.null&banner=neq.");
      const data = await res.json();
      
      // Formatar resposta
      const banners = data.map(item => ({
        tmdb_id: item.tmdb_id,
        titulo: item.title,
        description: item.description,
        year: item.year,
        rating: item.rating,
        genre: item.genre,
        banner: item.banner,
        country: item.country
      })).filter(item => item.banner && item.banner.trim() !== "");

      return new Response(JSON.stringify(banners), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // GET /banners/home - mistura cinema(backdrop) + series(banner)
    if (url.pathname === "/banners/home") {
      // Buscar filmes com backdrop
      const moviesRes = await supabase("cinema?select=tmdb_id,title:titulo,description:overview,year,rating,genre,backdrop,country&backdrop=not.is.null&backdrop=neq.");
      const moviesData = await moviesRes.json();
      
      // Buscar séries com banner
      const seriesRes = await supabase("series?select=tmdb_id,title:titulo,description:overview,year,rating,genre,banner,country&banner=not.is.null&banner=neq.");
      const seriesData = await seriesRes.json();

      // Formatar filmes (usando backdrop)
      const movieBanners = moviesData.map(item => ({
        tmdb_id: item.tmdb_id,
        titulo: item.title,
        description: item.description,
        year: item.year,
        rating: item.rating,
        genre: item.genre,
        backdrop: item.backdrop,
        country: item.country
      })).filter(item => item.backdrop && item.backdrop.trim() !== "");

      // Formatar séries (usando banner como backdrop)
      const seriesBanners = seriesData.map(item => ({
        tmdb_id: item.tmdb_id,
        titulo: item.title,
        description: item.description,
        year: item.year,
        rating: item.rating,
        genre: item.genre,
        backdrop: item.banner, // Usar banner como backdrop
        country: item.country
      })).filter(item => item.backdrop && item.backdrop.trim() !== "");

      // Misturar tudo
      const allBanners = [...movieBanners, ...seriesBanners];

      return new Response(JSON.stringify(allBanners), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response("Not found", { status: 404, headers: corsHeaders });
  }
};
