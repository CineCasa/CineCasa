// Edge Function: Recalculate Genre Weights
// Executa recálculo periódico dos pesos de gênero

import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Verificar se é uma requisição autorizada (cron ou admin)
    const authHeader = req.headers.get('authorization');
    const isCronJob = req.headers.get('x-cron-job') === 'true';
    
    if (!isCronJob && !authHeader?.includes(Deno.env.get('ADMIN_SECRET') || '')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const startTime = Date.now();

    // Recalcular todos os gêneros
    const { data, error } = await supabaseAdmin.rpc('recalculate_all_genre_weights');

    if (error) {
      console.error('Error recalculating genre weights:', error);
      throw error;
    }

    const duration = Date.now() - startTime;

    // Log do resultado
    const result = {
      success: true,
      processed_genres: data?.length || 0,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    };

    console.log('Genre weights recalculated:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in recalculate-genre-weights:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
