// ============================================
// AUTO-SCAN CATALOG - Edge Function
// CineCasa Command Center Intelligence
// Runs every 7 days via Supabase Cron
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============================================
// CONFIGURATION
// ============================================
const TMDB_API_KEY = Deno.env.get('TMDB_API_KEY') || '';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================
// TYPES
// ============================================
interface CatalogItem {
  id: string;
  tmdb_id?: string;
  title: string;
  type: 'movie' | 'series';
  total_seasons?: number;
  available_seasons?: number[];
  poster_url?: string;
}

interface TMDBSeason {
  season_number: number;
  episode_count: number;
  air_date?: string;
}

interface TMDBSeries {
  id: number;
  name: string;
  number_of_seasons: number;
  seasons: TMDBSeason[];
}

interface AlertData {
  alert_type: string;
  content_id: string;
  content_type: string;
  title: string;
  poster_url?: string;
  tmdb_id?: string;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// ============================================
// TMDB API CLIENT
// ============================================
class TMDBClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async get(endpoint: string, params: Record<string, string> = {}): Promise<any> {
    const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
    url.searchParams.append('api_key', this.apiKey);
    url.searchParams.append('language', 'pt-BR');
    
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  async getSeriesDetails(tmdbId: string): Promise<TMDBSeries> {
    return await this.get(`/tv/${tmdbId}`);
  }

  async getSeriesChanges(tmdbId: string, startDate: string, endDate: string): Promise<any> {
    return await this.get(`/tv/${tmdbId}/changes`, {
      start_date: startDate,
      end_date: endDate,
    });
  }

  async getMovieDetails(tmdbId: string): Promise<any> {
    return await this.get(`/movie/${tmdbId}`);
  }

  async searchMulti(query: string): Promise<any> {
    return await this.get('/search/multi', { query, include_adult: 'false' });
  }

  async getUpcomingMovies(): Promise<any> {
    return await this.get('/movie/upcoming');
  }

  async getAiringToday(): Promise<any> {
    return await this.get('/tv/airing_today');
  }
}

// ============================================
// CATALOG SCANNER
// ============================================
class CatalogScanner {
  private tmdb: TMDBClient;
  private supabase: any;

  constructor(tmdbApiKey: string, supabaseUrl: string, supabaseKey: string) {
    this.tmdb = new TMDBClient(tmdbApiKey);
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // Main scan function
  async scan(): Promise<{
    missingSeasons: number;
    newReleases: number;
    incompleteCollections: number;
    brokenLinks: number;
    totalAlerts: number;
  }> {
    const results = {
      missingSeasons: 0,
      newReleases: 0,
      incompleteCollections: 0,
      brokenLinks: 0,
      totalAlerts: 0,
    };

    // 1. Scan series for missing seasons
    const seriesMissingSeasons = await this.scanSeriesForMissingSeasons();
    results.missingSeasons = seriesMissingSeasons.length;

    // 2. Detect new releases
    const newReleases = await this.detectNewReleases();
    results.newReleases = newReleases.length;

    // 3. Check collections completeness
    const incompleteCollections = await this.checkCollectionsCompleteness();
    results.incompleteCollections = incompleteCollections.length;

    // 4. Log scan completion
    await this.logScanCompletion(results);

    results.totalAlerts = results.missingSeasons + results.newReleases + results.incompleteCollections;
    
    return results;
  }

  // Scan series for missing seasons
  async scanSeriesForMissingSeasons(): Promise<AlertData[]> {
    const alerts: AlertData[] = [];

    // Get all series with TMDB IDs
    const { data: series, error } = await this.supabase
      .from('series')
      .select('id, id_n, titulo, poster, tmdb_id, temporadas, temporadas_disponiveis')
      .not('tmdb_id', 'is', null);

    if (error || !series) {
      console.error('Error fetching series:', error);
      return alerts;
    }

    for (const serie of series) {
      try {
        if (!serie.tmdb_id) continue;

        // Get series details from TMDB
        const tmdbDetails = await this.tmdb.getSeriesDetails(serie.tmdb_id);
        
        const totalSeasons = tmdbDetails.number_of_seasons || 0;
        const availableSeasons = serie.temporadas_disponiveis || [1];
        
        // Check for missing seasons
        for (let seasonNum = 1; seasonNum <= totalSeasons; seasonNum++) {
          if (!availableSeasons.includes(seasonNum)) {
            const season = tmdbDetails.seasons?.find((s: TMDBSeason) => s.season_number === seasonNum);
            
            const alert: AlertData = {
              alert_type: 'missing_season',
              content_id: serie.id,
              content_type: 'series',
              title: serie.titulo,
              poster_url: serie.poster,
              tmdb_id: serie.tmdb_id,
              details: {
                missing_season: seasonNum,
                total_seasons: totalSeasons,
                available_seasons: availableSeasons,
                air_date: season?.air_date,
                estimated_release: this.estimateReleaseDate(season?.air_date),
              },
              severity: this.calculateSeverity(season?.air_date),
            };

            // Check if alert already exists
            const exists = await this.alertExists(serie.id, 'missing_season', seasonNum);
            
            if (!exists) {
              await this.createAlert(alert);
              alerts.push(alert);
            }
          }
        }
      } catch (err) {
        console.error(`Error scanning series ${serie.titulo}:`, err);
        
        // Create error alert
        await this.createAlert({
          alert_type: 'metadata_missing',
          content_id: serie.id,
          content_type: 'series',
          title: serie.titulo,
          poster_url: serie.poster,
          tmdb_id: serie.tmdb_id,
          details: { error: err.message },
          severity: 'medium',
        });
      }
    }

    return alerts;
  }

  // Detect new releases from TMDB
  async detectNewReleases(): Promise<AlertData[]> {
    const alerts: AlertData[] = [];

    try {
      // Get airing today and upcoming
      const [airingToday, upcomingMovies] = await Promise.all([
        this.tmdb.getAiringToday(),
        this.tmdb.getUpcomingMovies(),
      ]);

      // Check if any new seasons are for series we have
      for (const tvShow of airingToday.results || []) {
        const { data: existing } = await this.supabase
          .from('series')
          .select('id, titulo')
          .eq('tmdb_id', tvShow.id.toString())
          .single();

        if (existing) {
          const alert: AlertData = {
            alert_type: 'new_release',
            content_id: existing.id,
            content_type: 'series',
            title: existing.titulo || tvShow.name,
            poster_url: tvShow.poster_path ? `https://image.tmdb.org/t/p/w200${tvShow.poster_path}` : null,
            tmdb_id: tvShow.id.toString(),
            details: {
              air_date: tvShow.first_air_date,
              episode_count: tvShow.number_of_episodes,
              season_number: tvShow.number_of_seasons,
            },
            severity: 'low',
          };

          const exists = await this.alertExists(existing.id, 'new_release');
          
          if (!exists) {
            await this.createAlert(alert);
            alerts.push(alert);
          }
        }
      }
    } catch (err) {
      console.error('Error detecting new releases:', err);
    }

    return alerts;
  }

  // Check collections completeness
  async checkCollectionsCompleteness(): Promise<AlertData[]> {
    const alerts: AlertData[] = [];

    // Get all collections and their items
    const { data: collections, error } = await this.supabase
      .from('collections')
      .select('id, name, tmdb_collection_id, items:collection_items(*)')
      .not('tmdb_collection_id', 'is', null);

    if (error || !collections) {
      console.error('Error fetching collections:', error);
      return alerts;
    }

    for (const collection of collections) {
      try {
        if (!collection.tmdb_collection_id) continue;

        // Get collection details from TMDB
        const tmdbCollection = await this.tmdb.get(`/collection/${collection.tmdb_collection_id}`);
        
        const tmdbParts = tmdbCollection.parts || [];
        const catalogItems = collection.items || [];
        
        // Find missing items
        const missingItems = tmdbParts.filter((part: any) => {
          return !catalogItems.some((item: any) => 
            item.tmdb_id === part.id.toString()
          );
        });

        if (missingItems.length > 0) {
          const alert: AlertData = {
            alert_type: 'collection_incomplete',
            content_id: collection.id,
            content_type: 'collection',
            title: collection.name,
            tmdb_id: collection.tmdb_collection_id,
            details: {
              total_items: tmdbParts.length,
              available_items: catalogItems.length,
              missing_items: missingItems.map((m: any) => ({
                id: m.id,
                title: m.title || m.name,
                release_date: m.release_date || m.first_air_date,
              })),
            },
            severity: 'high',
          };

          const exists = await this.alertExists(collection.id, 'collection_incomplete');
          
          if (!exists) {
            await this.createAlert(alert);
            alerts.push(alert);
          }
        }
      } catch (err) {
        console.error(`Error checking collection ${collection.name}:`, err);
      }
    }

    return alerts;
  }

  // Helper: Check if alert already exists
  async alertExists(contentId: string, alertType: string, seasonNum?: number): Promise<boolean> {
    let query = this.supabase
      .from('catalog_alerts')
      .select('id')
      .eq('content_id', contentId)
      .eq('alert_type', alertType)
      .eq('status', 'pending');

    if (seasonNum !== undefined) {
      query = query.eq("details->>'missing_season'", seasonNum.toString());
    }

    const { data } = await query.single();
    return !!data;
  }

  // Helper: Create alert in database
  async createAlert(alert: AlertData): Promise<void> {
    const { error } = await this.supabase
      .from('catalog_alerts')
      .insert({
        alert_type: alert.alert_type,
        content_id: alert.content_id,
        content_type: alert.content_type,
        title: alert.title,
        poster_url: alert.poster_url,
        tmdb_id: alert.tmdb_id,
        details: alert.details,
        severity: alert.severity,
        status: 'pending',
        detected_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error creating alert:', error);
    } else {
      console.log(`Alert created: ${alert.alert_type} - ${alert.title}`);
    }
  }

  // Helper: Log scan completion
  async logScanCompletion(results: Record<string, number>): Promise<void> {
    await this.supabase
      .from('audit_logs')
      .insert({
        action: 'CATALOG_SCAN_COMPLETED',
        action_category: 'catalog',
        severity: 'info',
        details: {
          scan_results: results,
          scan_type: 'auto_scan',
        },
        created_at: new Date().toISOString(),
      });
  }

  // Helper: Calculate severity based on air date
  calculateSeverity(airDate?: string): 'low' | 'medium' | 'high' | 'critical' {
    if (!airDate) return 'medium';
    
    const releaseDate = new Date(airDate);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - releaseDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > 30) return 'high';
    if (daysDiff > 14) return 'medium';
    return 'low';
  }

  // Helper: Estimate release date
  estimateReleaseDate(airDate?: string): string | null {
    if (!airDate) return null;
    
    const date = new Date(airDate);
    // Add 1 day buffer for availability
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
  }
}

// ============================================
// MAIN HANDLER
// ============================================
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const tmdbApiKey = Deno.env.get('TMDB_API_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey || !tmdbApiKey) {
      throw new Error('Missing required environment variables');
    }

    // Initialize scanner
    const scanner = new CatalogScanner(tmdbApiKey, supabaseUrl, supabaseServiceKey);

    // Run scan
    console.log('Starting catalog auto-scan...');
    const results = await scanner.scan();
    console.log('Scan completed:', results);

    // Return results
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Catalog scan completed successfully',
        results,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Scan error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});
