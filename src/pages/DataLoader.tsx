import { useState } from "react";

const tvChannels = [
  { nome: "SBT HD", url: "https://cdn.jmvstream.com/w/LVW-10801/LVW10801_Xvg4R0u57n/playlist.m3u8", logo: "https://i.imgur.com/Jgbq3CC.jpeg", grupo: "ABERTOS" },
  { nome: "Record TV", url: "https://cdn.jmvstream.com/w/LVW-10842/LVW10842_513N26MDBL/playlist.m3u8", logo: "https://i.imgur.com/zaTvGQW.jpeg", grupo: "ABERTOS" },
  { nome: "Rede TV!", url: "https://streaming.cloudecast.com/hls/redetves/index.m3u8", logo: "https://i.imgur.com/8zg9jQn.jpeg", grupo: "ABERTOS" },
  { nome: "TV Cultura", url: "https://5b33b873179a2.streamlock.net:1443/live/livestream/playlist.m3u8", logo: "https://i.imgur.com/UD5r8B8.jpeg", grupo: "ABERTOS" },
  { nome: "VTV SBT", url: "https://video01.kshost.com.br:4443/tvlagos/tvlagos/chunklist_w2011496035.m3u8", logo: "https://i.imgur.com/Jgbq3CC.jpeg", grupo: "ABERTOS" },
  { nome: "Gospel Movie TV", url: "https://stmv1.srvif.com/gospelf/gospelf/playlist.m3u8", logo: null, grupo: "RELIGIOSO" },
  { nome: "Gospel Cartoon", url: "https://stmv1.srvif.com/gospelcartoon/gospelcartoon/playlist.m3u8", logo: null, grupo: "KIDS" },
  { nome: "Geekdot Animes", url: "https://stream.ichibantv.com:3764/hybrid/play.m3u8", logo: "https://i.imgur.com/zXf9h4X.png", grupo: "KIDS" },
  { nome: "AWTV Kids", url: "https://awtv.nuvemplay.live/hls/stream.m3u8", logo: "https://i.imgur.com/6X9m9Yp.png", grupo: "KIDS" },
  { nome: "BDC TV", url: "https://video01.kshost.com.br/bdctv/bdctv/playlist.m3u8", logo: "https://i.imgur.com/6X9m9Yp.png", grupo: "KIDS" },
  { nome: "Boruto Pluto TV", url: "https://service-stitcher.clusters.pluto.tv/v1/stitch/embed/hls/channel/656f389c3944b60008e5bdab/master.m3u8", logo: "https://i.imgur.com/6W9m9Yp.png", grupo: "KIDS" },
  { nome: "One Piece Pluto TV", url: "https://service-stitcher.clusters.pluto.tv/v1/stitch/embed/hls/channel/624b1c8d4321e200073ee421/master.m3u8", logo: "https://i.imgur.com/6W9m9Yp.png", grupo: "KIDS" },
  { nome: "Os Jetsons", url: "https://stmv1.srvif.com/jetsontv/jetsontv/playlist.m3u8", logo: "https://i.imgur.com/6X9m9Yp.png", grupo: "KIDS" },
  { nome: "Kuriakos Kids", url: "https://w2.manasat.com/kkids/smil:kkids.smil/playlist.m3u8", logo: "https://i.imgur.com/6X9m9Yp.png", grupo: "KIDS" },
  { nome: "TNT Esportes", url: "https://cdn-1.nxplay.com.br/TNT_TK/index.m3u8", logo: "https://i.imgur.com/F0v9Z4L.png", grupo: "ESPORTES" },
  { nome: "TV Brasil Esportes", url: "https://ebc-tvbrasil.akamaized.net/hls/live/2033663/tvbrasil/index.m3u8", logo: null, grupo: "ESPORTES" },
  { nome: "Jovem Pan News", url: "https://d6yfbj4xxtrod.cloudfront.net/out/v1/7836eb391ec24452b149f3dc6df15bbd/index.m3u8", logo: "https://i.imgur.com/oI0A2M3.png", grupo: "JORNALISMO" },
  { nome: "TV Aparecida", url: "https://cdn.jmvstream.com/w/LVW-9716/LVW9716_HbtQtezcaw/playlist.m3u8", logo: null, grupo: "RELIGIOSO" },
  { nome: "Novo Tempo", url: "https://stream.live.novotempo.com/tv/smil:tvnovotempo.smil/playlist.m3u8", logo: null, grupo: "RELIGIOSO" },
  { nome: "Rede Gospel", url: "https://cdn.jmvstream.com/w/LVW-8719/LVW8719_AcLVAxWy5J/playlist.m3u8", logo: null, grupo: "RELIGIOSO" },
  { nome: "TV Series As Panteras", url: "https://stmv1.srvif.com/tvserie/tvserie/playlist.m3u8", logo: null, grupo: "SERIES" },
  { nome: "Kuriakos Cine", url: "https://w2.manasat.com/kcine/smil:kcine.smil/playlist.m3u8", logo: null, grupo: "FILMES" },
  { nome: "KpopTV Play", url: "https://giatv.bozztv.com/giatv/giatv-kpoptvplay/kpoptvplay/playlist.m3u8", logo: null, grupo: "VARIEDADES" },
  { nome: "Darkflix", url: "https://video01.soultv.com.br/darkflix/darkflix/playlist.m3u8", logo: "https://i.imgur.com/9v6Q27q.png", grupo: "FILMES" },
  { nome: "GLN Filmes", url: "https://stmv8.samcast.com.br/glnfilmes/glnfilmes/playlist.m3u8", logo: "https://i.imgur.com/6pYVjS9.png", grupo: "FILMES" },
  { nome: "Cine Monde", url: "https://video01.soultv.com.br/cinemonde/cinemonde/playlist.m3u8", logo: "https://i.imgur.com/9v6Q27q.png", grupo: "FILMES" },
  { nome: "Soul Cine Clube", url: "https://video01.soultv.com.br/soulcine/soulcine/playlist.m3u8", logo: "https://i.imgur.com/9v6Q27q.png", grupo: "FILMES" },
  { nome: "Top Cine", url: "https://olympusamagi.amagi.tv/hls/amagi_hls_data_olympusat-topcine-latam-plex/CDN/playlist.m3u8", logo: null, grupo: "FILMES" },
  { nome: "Runtime Cinema", url: "https://ammo-espanol-plex.amagi.tv/hls/amagi_hls_data_plexAAAAA-ammo-espanol-plex/CDN/playlist.m3u8", logo: null, grupo: "FILMES" },
  { nome: "Chroma TV", url: "https://5c483b9d1019c.streamlock.net/8054/8054/playlist.m3u8", logo: null, grupo: "SERIES" },
  { nome: "TV Series Classic", url: "https://video10.logicahost.com.br/serieclassic/serieclassic/playlist.m3u8", logo: "https://i.imgur.com/9v6Q27q.png", grupo: "SERIES" },
  { nome: "Viva Web TV", url: "https://video01.kshost.com.br:4443/cypriano46326/cypriano46326/playlist.m3u8", logo: "https://i.imgur.com/9v6Q27q.png", grupo: "SERIES" },
  { nome: "Shorts TV", url: "https://shortstv-fast-spain-lg.amagi.tv/playlist.m3u8", logo: "https://i.imgur.com/lyBkCzB.png", grupo: "SERIES" },
  { nome: "Cinehouse", url: "https://3e14f4fda10247bc907cf85bbf6f6d88.mediatailor.us-east-1.amazonaws.com/v1/master/44f73ba4d03e9607dcd9bebdcb8494d86964f1d8/Plex_Cinehouse/playlist.m3u8", logo: null, grupo: "SERIES" },
  { nome: "Canal Educação", url: "https://canaleducacao-stream.ebc.com.br/index.m3u8", logo: "https://i.imgur.com/B9O0o3m.png", grupo: "VARIEDADES" },
  { nome: "Shorts TV ES", url: "https://shortstv-fast-spain-lg.amagi.tv/playlist.m3u8", logo: "https://i.imgur.com/lyBkCzB.png", grupo: "ESPANHOL" },
  { nome: "Top Cine ES", url: "https://olympusamagi.amagi.tv/hls/amagi_hls_data_olympusat-topcine-latam-plex/CDN/playlist.m3u8", logo: null, grupo: "ESPANHOL" },
  { nome: "Rede SPTV", url: "https://video01.logicahost.com.br/websptv/websptv/playlist.m3u8", logo: null, grupo: "VARIEDADES" },
  { nome: "TV Brasil", url: "https://tvbrasil-stream.ebc.com.br/index.m3u8", logo: null, grupo: "VARIEDADES" },
  { nome: "TV Vila Real", url: "https://cdn.jmvstream.com/w/LVW-10841/LVW10841_mT77z9o2cP/playlist.m3u8", logo: null, grupo: "VARIEDADES" },
  { nome: "MyTime Movie Network", url: "https://appletree-mytime-samsungbrazil.amagi.tv/playlist.m3u8", logo: null, grupo: "VARIEDADES" },
];

const BATCH_SIZE = 30;

function sanitizeJsonText(text: string): string {
  // Remove non-JSON content (like separator lines and text headers)
  // Split into potential JSON array segments and merge
  let cleaned = text.trim();
  
  // Handle files with two arrays separated by garbage text
  // Find the pattern: ] ... garbage ... { and replace with ,
  cleaned = cleaned.replace(/\]\s*[\s\S]*?_+[\s\S]*?(?=\{)/g, ',');
  
  // Remove any remaining non-JSON lines between objects
  cleaned = cleaned.replace(/,\s*([A-ZÀ-Ú][^\n{]*)\n/gi, ',\n');
  
  // Ensure it starts with [ and ends with ]
  if (!cleaned.startsWith('[')) cleaned = '[' + cleaned;
  if (!cleaned.endsWith(']')) cleaned = cleaned + ']';
  
  // Fix trailing commas before ]
  cleaned = cleaned.replace(/,\s*\]/g, ']');
  
  return cleaned;
}

async function fetchAndParseJson(url: string): Promise<any[]> {
  const res = await fetch(url);
  const text = await res.text();
  
  try {
    return JSON.parse(text);
  } catch {
    // Try sanitizing
    const sanitized = sanitizeJsonText(text);
    try {
      return JSON.parse(sanitized);
    } catch (e2) {
      // Last resort: extract individual objects with regex
      const objects: any[] = [];
      const regex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
      let match;
      while ((match = regex.exec(text)) !== null) {
        try {
          objects.push(JSON.parse(match[0]));
        } catch { /* skip invalid */ }
      }
      if (objects.length === 0) throw new Error(`Could not parse JSON from ${url}: ${e2}`);
      return objects;
    }
  }
}

async function insertBatch(table: string, data: any[]) {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "eqhstnlsmfrwxhvcwoid";
  const url = `https://${projectId}.supabase.co/functions/v1/bulk-insert`;
  
  let totalInserted = 0;
  const errors: string[] = [];
  
  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table, data: batch }),
      });
      const result = await res.json();
      if (result.inserted) totalInserted += result.inserted;
      if (result.errors?.length) errors.push(...result.errors);
    } catch (e) {
      errors.push(`Batch ${i}: ${String(e)}`);
    }
  }
  
  return { inserted: totalInserted, total: data.length, errors };
}

export default function DataLoader() {
  const [log, setLog] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (msg: string) => setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const loadAll = async () => {
    setLoading(true);
    setLog([]);

    try {
      // Cinema
      addLog("Carregando filmes-2.json...");
      const filmesData = await fetchAndParseJson("/data/filmes-2.json");
      addLog(`Parsed ${filmesData.length} filmes. Inserindo na tabela cinema...`);
      const r1 = await insertBatch("cinema", filmesData);
      addLog(`✅ Cinema: ${r1.inserted}/${r1.total} inseridos. Erros: ${r1.errors.length}`);
      if (r1.errors.length) r1.errors.forEach(e => addLog(`  ❌ ${e}`));

      // Filmes Kids
      addLog("Carregando filmeskids-2.json...");
      const filmesKidsData = await fetchAndParseJson("/data/filmeskids-2.json");
      addLog(`Parsed ${filmesKidsData.length} filmes kids. Inserindo...`);
      const r2 = await insertBatch("filmes_kids", filmesKidsData);
      addLog(`✅ Filmes Kids: ${r2.inserted}/${r2.total} inseridos. Erros: ${r2.errors.length}`);
      if (r2.errors.length) r2.errors.forEach(e => addLog(`  ❌ ${e}`));

      // Series
      addLog("Carregando series-3.json...");
      const seriesData = await fetchAndParseJson("/data/series-3.json");
      addLog(`Parsed ${seriesData.length} séries. Inserindo...`);
      const r3 = await insertBatch("series", seriesData);
      addLog(`✅ Séries: ${r3.inserted}/${r3.total} inseridos. Erros: ${r3.errors.length}`);
      if (r3.errors.length) r3.errors.forEach(e => addLog(`  ❌ ${e}`));

      // Series Kids
      addLog("Carregando serieskids-3.json...");
      const seriesKidsData = await fetchAndParseJson("/data/serieskids-3.json");
      addLog(`Parsed ${seriesKidsData.length} séries kids. Inserindo...`);
      const r4 = await insertBatch("series_kids", seriesKidsData);
      addLog(`✅ Séries Kids: ${r4.inserted}/${r4.total} inseridos. Erros: ${r4.errors.length}`);
      if (r4.errors.length) r4.errors.forEach(e => addLog(`  ❌ ${e}`));

      // TV ao Vivo
      addLog(`Inserindo ${tvChannels.length} canais ao vivo...`);
      const r5 = await insertBatch("tv_ao_vivo", tvChannels);
      addLog(`✅ TV ao Vivo: ${r5.inserted}/${r5.total} inseridos. Erros: ${r5.errors.length}`);
      if (r5.errors.length) r5.errors.forEach(e => addLog(`  ❌ ${e}`));

      addLog("🎉 Concluído!");
    } catch (e) {
      addLog(`💥 Erro fatal: ${String(e)}`);
    }
    
    setLoading(false);
  };

  return (
    <div style={{ background: "#000", color: "#fff", minHeight: "100vh", padding: "2rem", fontFamily: "monospace" }}>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>CineCasa - Data Loader</h1>
      <p style={{ marginBottom: "1rem", opacity: 0.7 }}>Carrega os dados dos arquivos JSON para o Supabase via edge function.</p>
      <button
        onClick={loadAll}
        disabled={loading}
        style={{
          padding: "1rem 2rem",
          fontSize: "1rem",
          background: loading ? "#333" : "#e50914",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: loading ? "not-allowed" : "pointer",
          marginBottom: "1rem",
        }}
      >
        {loading ? "⏳ Carregando..." : "🚀 Inserir Todos os Dados"}
      </button>
      <div style={{ background: "#111", padding: "1rem", borderRadius: "8px", maxHeight: "70vh", overflow: "auto" }}>
        {log.map((l, i) => (
          <div key={i} style={{ marginBottom: "0.3rem", fontSize: "0.85rem" }}>{l}</div>
        ))}
        {!log.length && <div style={{ opacity: 0.5 }}>Clique no botão para iniciar a inserção dos dados...</div>}
      </div>
    </div>
  );
}
