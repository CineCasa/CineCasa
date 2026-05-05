import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Play, Heart, Clock, ThumbsUp, ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { fetchTmdbDetails } from "@/services/tmdb";

const C = { bg: "#070A10", neon: "#00B7FF", neon2: "#00E5FF", text: "#EAF6FF", glass: "rgba(10,18,40,0.6)", glassB: "rgba(0,183,255,0.2)", logo: "#00d9ff", youtubeRed: "#FF0000" };

const DetailsNew = () => {
  const { id, type } = useParams(), navigate = useNavigate(), { user } = useAuth(), { toast } = useToast();
  const [data, setData] = useState<any>(null), [load, setLoad] = useState(true), [isFav, setIsFav] = useState(false), [isWatch, setIsWatch] = useState(false), [recs, setRecs] = useState<any[]>([]), [cast, setCast] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoad(true);
      try {
        const isSeries = type === "series";
        const table = isSeries ? "series" : "cinema";
        const idCol = isSeries ? "id_n" : "id";
        const { data: local } = await (supabase as any).from(table).select("*").eq(idCol, Number(id)).single();
        if (local?.tmdb_id) {
          const tmdb = await fetchTmdbDetails(local.tmdb_id, isSeries ? "tv" : "movie");
          if (tmdb) {
            const d = tmdb.credits?.crew?.find((c: any) => c.job === "Director")?.name;
            const w = tmdb.credits?.crew?.find((c: any) => c.job === "Writer")?.name;
            const s = tmdb.production_companies?.[0]?.name;
            const cert = tmdb.release_dates?.results?.find((r: any) => r.iso_3166_1 === "BR")?.release_dates?.[0]?.certification;
            const localData = local as any;
            const localYear = localData.year || localData.ano;
            const localBanner = localData.banner;
            setData({ ...localData, ...tmdb, title: tmdb.title || tmdb.name || localData.titulo, backdrop_path: tmdb.backdrop_path || localBanner, year: tmdb.release_date?.substring(0,4) || tmdb.first_air_date?.substring(0,4) || localYear, director: d, writer: w, studio: s, certification: cert });
            setCast(tmdb.credits?.cast?.slice(0,15) || []);
          } else {
            const localData = local as any;
            const localYear = localData.year || localData.ano;
            setData({ ...localData, title: localData.titulo, year: localYear });
          }
        } else {
          const localData = local as any;
          const localYear = localData.year || localData.ano;
          setData({ ...localData, title: localData.titulo, year: localYear });
        }
        const { data: r } = await (supabase as any).from(table).select("*").neq(idCol, Number(id)).limit(10);
        setRecs(r?.map((i: any) => ({ id: i.id || i.id_n, title: i.titulo, poster: i.poster || i.capa, rating: i.rating, type: table })) || []);
        if (user) {
          const localId = (local as any).id || (local as any).id_n;
          const { data: f } = await (supabase as any).from("favorites").select("id").eq("user_id", user.id).eq("content_id", Number(localId)).eq("content_type", table).single();
          setIsFav(!!f);
        }
      } catch (e) { console.error(e); }
      setLoad(false);
    })();
  }, [id, type, user]);

  const toggleFav = async () => {
    if (!user || !data) return toast({ title: "Faça login primeiro" });
    const table = type === "series" ? "series" : "cinema";
    const dataId = data.id || data.id_n;
    if (isFav) { 
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("content_id", Number(dataId)).eq("content_type", table); 
      setIsFav(false); 
      toast({ title: "Removido dos favoritos" }); 
    }
    else { 
      await supabase.from("favorites").insert({ user_id: user.id, content_id: Number(dataId), content_type: table, titulo: data.title, poster: data.poster_path || data.poster || data.capa }); 
      setIsFav(true); 
      toast({ title: "Adicionado aos favoritos" }); 
    }
  };

  const toggleWatch = async () => {
    if (!user || !data) return toast({ title: "Faça login primeiro" });
    const dataId = data.id || data.id_n;
    const table = type === "series" ? "series" : "cinema";
    if (isWatch) { 
      await (supabase as any).from("watchlist").delete().eq("user_id", user.id).eq("content_id", Number(dataId)).eq("content_type", table); 
      setIsWatch(false); 
      toast({ title: "Removido da lista" }); 
    }
    else { 
      await (supabase as any).from("watchlist").insert({ user_id: user.id, content_id: Number(dataId), content_type: table, titulo: data.title, poster: data.poster_path || data.poster || data.capa }); 
      setIsWatch(true); 
      toast({ title: "Adicionado à lista" }); 
    }
  };

  const age = (c?: string) => { if (!c) return {a:"L",r:"Livre"}; const x=c.toUpperCase(); if(x.includes("12"))return{a:"12",r:"Conteúdo moderado"}; if(x.includes("14"))return{a:"14",r:"Violência moderada"}; if(x.includes("16")||x.includes("R"))return{a:"16",r:"Violência intensa"}; if(x.includes("18"))return{a:"18",r:"Conteúdo adulto"}; return{a:"L",r:"Livre"}; };
  const fmt = (v?: number) => v && v > 0 ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v) : "";
  const flag = (c?: string) => c ? `https://flagcdn.com/w40/${c.toLowerCase()}.png` : "";

  if (load) return <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ color: C.neon }}>Carregando...</div></div>;
  if (!data) return <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ color: C.text }}>Não encontrado</div></div>;

  const backdrop = data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : data.banner || data.poster;
  const a = age(data.certification);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text }}>
      <section style={{ position: "relative", width: "100vw", aspectRatio: "16/9", minHeight: "520px", maxHeight: "760px", overflow: "hidden", backgroundImage: `url(${backdrop})`, backgroundSize: "cover", backgroundPosition: "center" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.62) 45%, rgba(0,0,0,0.22) 70%, rgba(0,0,0,0) 100%)" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "220px", background: "linear-gradient(to bottom, rgba(0,0,0,0), #070A10)", zIndex: 4 }} />
        <button onClick={() => navigate('/')} style={{ position: "absolute", top: "20px", left: "20px", zIndex: 20, background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "white" }}><ChevronLeft size={24} /></button>
        <div style={{ position: "absolute", left: "28px", right: "28px", bottom: "80px", zIndex: 10, display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "22px", alignItems: "end" }}>
          <div>
            <span style={{ display: "inline-block", background: "rgba(0,183,255,0.15)", border: "1px solid rgba(0,183,255,0.25)", color: C.neon, padding: "6px 12px", borderRadius: "12px", fontWeight: 800, fontSize: "12px", textTransform: "uppercase" }}>{type === "series" ? "Série" : "Filme"}</span>
            <h1 style={{ margin: "12px 0 0 0", fontSize: "clamp(32px, 4vw, 58px)", fontWeight: 900, letterSpacing: "1px", textTransform: "uppercase", textShadow: "0 0 35px rgba(0,183,255,0.25)" }}>{data.title}</h1>
            <div style={{ marginTop: "12px", display: "flex", gap: "10px", alignItems: "center", fontSize: "14px", opacity: 0.9 }}>
              <span>⭐ {data.vote_average?.toFixed(1) || "0.0"}/10</span><span style={{ opacity: 0.6 }}>•</span><span>{data.year}</span><span style={{ opacity: 0.6 }}>•</span><span>{data.runtime || "120"} min</span>
              <span style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", padding: "6px 10px", borderRadius: "12px", fontWeight: 800, fontSize: "12px" }}>4K UHD</span>
            </div>
            <div style={{ marginTop: "10px", display: "flex", gap: "10px", alignItems: "center", fontSize: "13px" }}>
              <span style={{ background: "rgba(255,0,0,0.18)", border: "1px solid rgba(255,0,0,0.35)", padding: "5px 9px", borderRadius: "10px", fontWeight: 900 }}>{a.a}</span><span>{a.r}</span><span style={{ opacity: 0.6 }}>|</span>
              {data.origin_country?.[0] && <><img src={flag(data.origin_country[0])} style={{ width: "26px", height: "18px", borderRadius: "4px", objectFit: "cover" }} /><span>{data.origin_country[0]}</span></>}
            </div>
            <div style={{ marginTop: "10px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {(data.genres || []).map((g: any, i: number) => <span key={i} style={{ background: "rgba(0,183,255,0.12)", border: "1px solid rgba(0,183,255,0.25)", padding: "7px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: 800 }}>{g.name}</span>)}
            </div>
            <p style={{ marginTop: "14px", fontSize: "15px", lineHeight: 1.5, opacity: 0.88, maxWidth: "720px" }}>{data.overview}</p>
            <div style={{ marginTop: "18px", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
              <button onClick={() => navigate(`/watch/${type}/${id}`)} style={{ background: `linear-gradient(90deg, ${C.neon}, ${C.neon2})`, color: "black", border: "none", borderRadius: "16px", padding: "14px 20px", fontSize: "15px", fontWeight: 900, cursor: "pointer", boxShadow: "0 0 30px rgba(0,183,255,0.35)", display: "flex", alignItems: "center", gap: "8px" }}><Play size={18} fill="black" /> Assistir agora</button>
              <button onClick={() => data?.trailer ? window.open(data.trailer, '_blank') : toast({title: "Trailer não disponível"})} style={{ background: "#FF0000", border: "none", color: "white", borderRadius: "16px", padding: "14px 20px", fontSize: "15px", fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 15px rgba(255,0,0,0.4)" }}><Play size={18} fill="white" /> Trailer</button>
              <div style={{ display: "flex", gap: "12px", marginLeft: "12px" }}>
                <button onClick={toggleFav} style={{ background: C.glass, border: `1px solid ${C.glassB}`, backdropFilter: "blur(14px)", color: isFav ? C.logo : "white", borderRadius: "18px", padding: "10px 12px", cursor: "pointer", fontWeight: 900, display: "flex", flexDirection: "column", alignItems: "center", width: "82px", gap: "6px" }}><Heart size={18} fill={isFav ? C.logo : "none"} /><span style={{ fontSize: "11px", opacity: 0.85 }}>Favoritos</span></button>
                <button onClick={toggleWatch} style={{ background: C.glass, border: `1px solid ${C.glassB}`, backdropFilter: "blur(14px)", color: isWatch ? C.neon : "white", borderRadius: "18px", padding: "10px 12px", cursor: "pointer", fontWeight: 900, display: "flex", flexDirection: "column", alignItems: "center", width: "82px", gap: "6px" }}><Clock size={18} /><span style={{ fontSize: "11px", opacity: 0.85 }}>Depois</span></button>
                <button style={{ background: C.glass, border: `1px solid ${C.glassB}`, backdropFilter: "blur(14px)", color: "white", borderRadius: "18px", padding: "10px 12px", cursor: "pointer", fontWeight: 900, display: "flex", flexDirection: "column", alignItems: "center", width: "82px", gap: "6px" }}><ThumbsUp size={18} /><span style={{ fontSize: "11px", opacity: 0.85 }}>Like</span></button>
              </div>
            </div>
          </div>
          <aside>
            <div style={{ background: C.glass, border: `1px solid ${C.glassB}`, borderRadius: "22px", padding: "18px", backdropFilter: "blur(18px)", boxShadow: "0 0 45px rgba(0,183,255,0.15)" }}>
              <h3 style={{ margin: "0 0 14px 0", fontSize: "14px", fontWeight: 900, color: C.neon, letterSpacing: "1px" }}>DETALHES</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px", fontSize: "13px" }}>
                {data.director && <div style={{ display: "flex", gap: "8px", alignItems: "center" }}><span style={{ opacity: 0.65, fontWeight: 700 }}>Direção:</span><span>{data.director}</span></div>}
                {data.writer && <div style={{ display: "flex", gap: "8px", alignItems: "center" }}><span style={{ opacity: 0.65, fontWeight: 700 }}>Roteiro:</span><span>{data.writer}</span></div>}
                {data.studio && <div style={{ display: "flex", gap: "8px", alignItems: "center" }}><span style={{ opacity: 0.65, fontWeight: 700 }}>Estúdio:</span><span>{data.studio}</span></div>}
                {data.spoken_languages && <div style={{ display: "flex", gap: "8px", alignItems: "center" }}><span style={{ opacity: 0.65, fontWeight: 700 }}>Idiomas:</span><span>{data.spoken_languages.map((l: any) => l.english_name).join(", ")}</span></div>}
                {data.budget > 0 && <div style={{ display: "flex", gap: "8px", alignItems: "center" }}><span style={{ opacity: 0.65, fontWeight: 700 }}>Orçamento:</span><span>{fmt(data.budget)}</span></div>}
                {data.revenue > 0 && <div style={{ display: "flex", gap: "8px", alignItems: "center" }}><span style={{ opacity: 0.65, fontWeight: 700 }}>Bilheteria:</span><span>{fmt(data.revenue)}</span></div>}
              </div>
            </div>
          </aside>
        </div>
      </section>

      {cast.length > 0 && (
        <section style={{ padding: "20px 28px" }}>
          <h2 style={{ margin: "0 0 14px 0", fontSize: "14px", letterSpacing: "1px", color: C.neon, fontWeight: 900 }}>ELENCO PRINCIPAL</h2>
          <div style={{ display: "flex", gap: "14px", overflowX: "auto", paddingBottom: "12px" }}>
            {cast.map((actor: any, i: number) => (
              <div key={i} style={{ width: "140px", flexShrink: 0, textAlign: "center" }}>
                <img src={actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : "https://via.placeholder.com/92"} style={{ width: "92px", height: "92px", borderRadius: "999px", objectFit: "cover", border: "2px solid rgba(0,183,255,0.35)", boxShadow: "0 0 20px rgba(0,183,255,0.25)" }} />
                <div style={{ marginTop: "10px", fontWeight: 900, fontSize: "12px" }}>{actor.name}</div>
                <div style={{ marginTop: "4px", opacity: 0.65, fontSize: "11px" }}>{actor.character}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {recs.length > 0 && (
        <section style={{ padding: "20px 28px" }}>
          <h2 style={{ margin: "0 0 14px 0", fontSize: "14px", letterSpacing: "1px", color: C.neon, fontWeight: 900 }}>SUGESTÕES PARA VOCÊ</h2>
          <div style={{ display: "flex", gap: "14px", overflowX: "auto", paddingBottom: "14px" }}>
            {recs.map((item: any) => (
              <div key={item.id} onClick={() => navigate(`/details/${item.type}/${item.id}`)} style={{ width: "160px", aspectRatio: "2/3", borderRadius: "18px", overflow: "hidden", border: "1px solid rgba(0,183,255,0.15)", background: "rgba(255,255,255,0.04)", cursor: "pointer", flexShrink: 0, transition: "transform 0.2s" }}>
                <img src={item.poster} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default DetailsNew;
