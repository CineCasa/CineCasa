// CINECASA Cloudflare Worker
// Handles TMDB API proxy and user list management

const TMDB_API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiYjc3YjQwNDUwYzEyZTMwOGI1MjJiYzk4MGEzN2Y1ZSIsInN1YiI6IjYzNjA4MzI5MTA5ZGVjMDA3YzJiODQzZCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.zstR6WPo8T1vFiTTUy6X0un-paY6AljxTLU2IJN8t-o';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400'
};

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Route: GET /tmdb/details?tmdb=ID&type=movie|tv
      if (path === '/tmdb/details') {
        return await getTmdbDetails(url.searchParams);
      }

      // Route: GET /tmdb/collection?collection=ID
      if (path === '/tmdb/collection') {
        return await getTmdbCollection(url.searchParams);
      }

      // Route: GET /tmdb/recommendations?tmdb=ID&type=movie|tv
      if (path === '/tmdb/recommendations') {
        return await getTmdbRecommendations(url.searchParams);
      }

      // Route: POST /list/favorite
      if (path === '/list/favorite' && request.method === 'POST') {
        return await addToList(request, env, 'favorites');
      }

      // Route: POST /list/watchlater
      if (path === '/list/watchlater' && request.method === 'POST') {
        return await addToList(request, env, 'watchlater');
      }

      // Route: POST /list/like
      if (path === '/list/like' && request.method === 'POST') {
        return await addToList(request, env, 'likes');
      }

      // Route: POST /list/dislike
      if (path === '/list/dislike' && request.method === 'POST') {
        return await addToList(request, env, 'dislikes');
      }

      // Default: 404
      return jsonResponse({ error: 'Not found' }, 404);

    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse({ error: error.message }, 500);
    }
  }
};

// Get TMDB details with extended fields
async function getTmdbDetails(params) {
  const tmdbId = params.get('tmdb');
  const type = params.get('type') || 'movie';
  
  if (!tmdbId) {
    return jsonResponse({ error: 'Missing tmdb ID' }, 400);
  }

  const endpoint = type === 'tv' ? `/tv/${tmdbId}` : `/movie/${tmdbId}`;
  const append = 'credits,videos,release_dates,content_ratings,belongs_to_collection,keywords';
  
  const response = await fetch(`${TMDB_BASE_URL}${endpoint}?append_to_response=${append}&language=pt-BR`, {
    headers: {
      'Authorization': `Bearer ${TMDB_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    return jsonResponse({ error: 'TMDB API error' }, response.status);
  }

  const data = await response.json();

  // Extract directors and writers
  const crew = data.credits?.crew || [];
  const directors = crew.filter(p => p.job === 'Director').map(p => p.name);
  const writers = crew.filter(p => p.job === 'Screenplay' || p.job === 'Writer').map(p => p.name);

  // Get age rating
  let ageRating = 'L';
  if (type === 'movie' && data.release_dates) {
    const brRelease = data.release_dates.results?.find(r => r.iso_3166_1 === 'BR');
    if (brRelease?.release_dates?.[0]) {
      ageRating = brRelease.release_dates[0].certification || 'L';
    }
  } else if (type === 'tv' && data.content_ratings) {
    const brRating = data.content_ratings.results?.find(r => r.iso_3166_1 === 'BR');
    if (brRating) ageRating = brRating.rating || 'L';
  }

  // Get trailer
  const trailer = data.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');

  // Format response with all required fields
  const formatted = {
    id: data.id,
    title: data.title || data.name,
    original_title: data.original_title || data.original_name,
    overview: data.overview,
    tagline: data.tagline,
    poster_path: data.poster_path,
    backdrop_path: data.backdrop_path,
    vote_average: data.vote_average,
    vote_count: data.vote_count,
    popularity: data.popularity,
    runtime: data.runtime || (data.episode_run_time?.[0]),
    release_date: data.release_date || data.first_air_date,
    status: data.status,
    age_rating: ageRating,
    genres: data.genres?.map(g => ({ id: g.id, name: g.name })),
    production_countries: data.production_countries?.map(c => ({
      iso_3166_1: c.iso_3166_1,
      name: c.name
    })),
    spoken_languages: data.spoken_languages?.map(l => ({
      iso_639_1: l.iso_639_1,
      name: l.name,
      english_name: l.english_name
    })),
    production_companies: data.production_companies?.map(p => ({
      id: p.id,
      name: p.name,
      logo_path: p.logo_path
    })),
    directors: directors,
    writers: writers,
    cast: data.credits?.cast?.slice(0, 15).map(a => ({
      id: a.id,
      name: a.name,
      character: a.character,
      profile_path: a.profile_path,
      order: a.order
    })),
    crew: crew.filter(p => ['Director', 'Screenplay', 'Writer', 'Producer'].includes(p.job)).map(c => ({
      id: c.id,
      name: c.name,
      job: c.job,
      department: c.department
    })),
    belongs_to_collection: data.belongs_to_collection ? {
      id: data.belongs_to_collection.id,
      name: data.belongs_to_collection.name,
      poster_path: data.belongs_to_collection.poster_path,
      backdrop_path: data.belongs_to_collection.backdrop_path
    } : null,
    trailer: trailer ? {
      key: trailer.key,
      name: trailer.name,
      site: trailer.site,
      type: trailer.type
    } : null,
    budget: data.budget,
    revenue: data.revenue,
    homepage: data.homepage,
    imdb_id: data.imdb_id,
    keywords: data.keywords?.keywords?.map(k => k.name) || data.keywords?.results?.map(k => k.name) || [],
    number_of_seasons: data.number_of_seasons,
    number_of_episodes: data.number_of_episodes,
    type: type
  };

  return jsonResponse(formatted);
}

// Get collection details
async function getTmdbCollection(params) {
  const collectionId = params.get('collection');
  
  if (!collectionId) {
    return jsonResponse({ error: 'Missing collection ID' }, 400);
  }

  const response = await fetch(`${TMDB_BASE_URL}/collection/${collectionId}?language=pt-BR`, {
    headers: {
      'Authorization': `Bearer ${TMDB_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    return jsonResponse({ error: 'TMDB API error' }, response.status);
  }

  const data = await response.json();

  return jsonResponse({
    id: data.id,
    name: data.name,
    overview: data.overview,
    poster_path: data.poster_path,
    backdrop_path: data.backdrop_path,
    parts: data.parts?.map(p => ({
      id: p.id,
      title: p.title || p.name,
      poster_path: p.poster_path,
      backdrop_path: p.backdrop_path,
      release_date: p.release_date || p.first_air_date,
      vote_average: p.vote_average
    }))
  });
}

// Get recommendations
async function getTmdbRecommendations(params) {
  const tmdbId = params.get('tmdb');
  const type = params.get('type') || 'movie';
  
  if (!tmdbId) {
    return jsonResponse({ error: 'Missing tmdb ID' }, 400);
  }

  const endpoint = type === 'tv' ? `/tv/${tmdbId}/recommendations` : `/movie/${tmdbId}/recommendations`;
  
  const response = await fetch(`${TMDB_BASE_URL}${endpoint}?language=pt-BR&page=1`, {
    headers: {
      'Authorization': `Bearer ${TMDB_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    return jsonResponse({ error: 'TMDB API error' }, response.status);
  }

  const data = await response.json();

  return jsonResponse({
    page: data.page,
    total_pages: data.total_pages,
    total_results: data.total_results,
    results: data.results?.slice(0, 6).map(r => ({
      id: r.id,
      title: r.title || r.name,
      poster_path: r.poster_path,
      backdrop_path: r.backdrop_path,
      overview: r.overview,
      release_date: r.release_date || r.first_air_date,
      vote_average: r.vote_average,
      type: r.title ? 'movie' : 'tv'
    })) || []
  });
}

// Add item to user list (favorites, watchlater, likes, dislikes)
async function addToList(request, env, listType) {
  try {
    const body = await request.json();
    const { tmdb_id } = body;
    
    if (!tmdb_id) {
      return jsonResponse({ error: 'Missing tmdb_id' }, 400);
    }

    // Get user ID from request (you may want to implement auth)
    const userId = request.headers.get('X-User-ID') || 'anonymous';
    
    // Store in KV
    const key = `${userId}:${listType}:${tmdb_id}`;
    const value = {
      tmdb_id: parseInt(tmdb_id),
      type: body.type || 'movie',
      added_at: new Date().toISOString()
    };

    await env.CINECASA_KV.put(key, JSON.stringify(value));

    return jsonResponse({
      success: true,
      message: `Added to ${listType}`,
      tmdb_id: tmdb_id,
      list: listType
    });

  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}

// Helper: JSON response with CORS
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });
}
