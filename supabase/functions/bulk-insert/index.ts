import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const table = body.table;
    const data = body.data || (body.raw_json ? JSON.parse(body.raw_json) : null);

    if (!table || !data || !Array.isArray(data)) {
      return new Response(JSON.stringify({ error: "Missing table or data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mapped = data.map((item: any) => {
      if (table === "cinema") {
        const cat = item.categories || item.genero || item.category || "";
        const category = Array.isArray(cat) ? cat.join(", ") : String(cat);
        return {
          titulo: item.titulo,
          tmdb_id: item.tmdb_id || null,
          url: item.url || null,
          trailer: item.trailer || null,
          year: item.year || null,
          rating: item.rating || null,
          description: item.desc || item.description || null,
          poster: item.poster || null,
          category: category || null,
          type: item.type || "movie",
        };
      } else if (table === "filmes_kids") {
        return {
          titulo: item.titulo,
          url: item.url || null,
          genero: item.genero || null,
          year: item.year || null,
          rating: item.rating || null,
          description: item.desc || item.description || null,
          poster: item.poster || null,
          type: item.type || "movie",
        };
      } else if (table === "series") {
        return {
          titulo: item.titulo,
          tmdb_id: item.tmdb_id || null,
          trailer: item.trailer || null,
          identificador_archive: item.identificador_archive || null,
          type: item.type || "serie",
        };
      } else if (table === "series_kids") {
        return {
          titulo: item.titulo,
          identificador_archive: item.identificador_archive || null,
          genero: item.genero || null,
          year: item.year || null,
          rating: item.rating || null,
          description: item.desc || item.description || null,
          poster: item.poster || null,
          type: item.type || "serie",
        };
      } else if (table === "tv_ao_vivo") {
        return {
          nome: item.nome || item.name,
          url: item.url,
          logo: item.logo || null,
          grupo: item.grupo || item.group || null,
        };
      }
      return item;
    });

    const batchSize = 50;
    let inserted = 0;
    const errors: string[] = [];

    for (let i = 0; i < mapped.length; i += batchSize) {
      const batch = mapped.slice(i, i + batchSize);
      const { error } = await supabase.from(table).insert(batch);
      if (error) {
        errors.push(`Batch ${i}: ${error.message}`);
      } else {
        inserted += batch.length;
      }
    }

    return new Response(JSON.stringify({ success: true, inserted, total: data.length, errors }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
