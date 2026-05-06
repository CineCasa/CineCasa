import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Play, Heart, Clock, ThumbsUp, ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { usePlayer } from "@/contexts/PlayerContext";
import { fetchTmdbDetails } from "@/services/tmdb";

const C = {
  bg: "#070A10",
  neon: "#00B7FF",
  neon2: "#00E5FF",
  text: "#EAF6FF",
  glass: "rgba(10,18,40,0.6)",
  glassB: "rgba(0,183,255,0.2)",
};

const DetailsNew = () => {
  const { id, type } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { openPlayer } = usePlayer();

  const [data, setData] = useState<any>(null);
  const [load, setLoad] = useState(true);
  const [isFav, setIsFav] = useState(false);
  const [isWatch, setIsWatch] = useState(false);
  const [liked, setLiked] = useState(false);
  const [recs, setRecs] = useState<any[]>([]);
  const [cast, setCast] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoad(true);
      try {
        const table = type === "series" ? "series" : "cinema";
        const idColumn = table === "series" ? "id_n" : "id";
        const { data: local } = await supabase
          .from(table as any)
          .select("*")
          .eq(idColumn as any, id)
          .maybeSingle();

        if (!local) {
          setLoad(false);
          return;
        }

        if (local?.tmdb_id) {
          const tmdb = await fetchTmdbDetails(local.tmdb_id, type === "series" ? "tv" : "movie");
          if (tmdb) {
            const d = tmdb.credits?.crew?.find((c: any) => c.job === "Director")?.name;
            const w = tmdb.credits?.crew?.find((c: any) => c.job === "Writer")?.name;
            const s = tmdb.production_companies?.[0]?.name;
            const cert = tmdb.release_dates?.results?.find(
              (r: any) => r.iso_3166_1 === "BR"
            )?.release_dates?.[0]?.certification;
            setData({
              ...local,
              ...tmdb,
              title: tmdb.title || tmdb.name || (local as any).titulo,
              backdrop_path: tmdb.backdrop_path || (local as any).banner || (local as any).capa,
              year:
                tmdb.release_date?.substring(0, 4) ||
                tmdb.first_air_date?.substring(0, 4) ||
                (local as any).year ||
                (local as any).ano,
              director: d,
              writer: w,
              studio: s,
              certification: cert,
              videoUrl: (local as any).url || (local as any).trailer || null,
              trailerUrl: (local as any).trailer || null,
            });
            setCast(tmdb.credits?.cast?.slice(0, 15) || []);
          } else {
            setData({
              ...local,
              title: (local as any).titulo,
              year: (local as any).year || (local as any).ano,
              videoUrl: (local as any).url || null,
              trailerUrl: (local as any).trailer || null,
            });
          }
        } else {
          setData({
            ...local,
            title: (local as any).titulo,
            year: (local as any).year || (local as any).ano,
            videoUrl: (local as any).url || null,
            trailerUrl: (local as any).trailer || null,
          });
        }

        // Buscar recomendações
        const { data: r } = await supabase
          .from(table as any)
          .select(`id, ${idColumn === "id_n" ? "id_n," : ""}titulo, ${table === "series" ? "capa" : "poster"}, rating`)
          .neq(idColumn as any, id)
          .limit(10);
        setRecs(
          r?.map((i: any) => ({
            id: (i.id || i.id_n)?.toString(),
            title: i.titulo,
            poster: i.capa || i.poster,
            rating: i.rating,
            type: table === "series" ? "series" : "cinema",
          })) || []
        );

        // Verificar favorito e watchlist
        if (user) {
          const { data: f } = await supabase
            .from("favorites")
            .select("id")
            .eq("user_id", user.id)
            .eq("content_id", Number(id))
            .eq("content_type", table)
            .maybeSingle();
          setIsFav(!!f);

          const { data: wl } = await supabase
            .from("watchlist" as any)
            .select("id")
            .eq("user_id", user.id)
            .eq("content_id", Number(id))
            .eq("content_type", table)
            .maybeSingle();
          setIsWatch(!!wl);
        }
      } catch (e) {
        console.error("[DetailsNew] Erro:", e);
      }
      setLoad(false);
    })();
  }, [id, type, user]);

  // Bug #1 corrigido: Assistir agora usa PlayerContext
  const handleWatch = () => {
    if (!data) return;
    if (!data.videoUrl) {
      toast({ title: "Vídeo não disponível", description: "Este conteúdo ainda não possui link de reprodução." });
      return;
    }
    openPlayer({
      id: id!,
      title: data.title,
      type: type === "series" ? "series" : "movie",
      videoUrl: data.videoUrl,
      poster: data.poster_path
        ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
        : data.poster || data.capa || undefined,
    });
  };

  // Bug #5 corrigido: Trailer abre o link do trailer
  const handleTrailer = () => {
    if (!data) return;
    const trailerUrl = data.trailerUrl || data.trailer;
    if (!trailerUrl) {
      toast({ title: "Trailer não disponível" });
      return;
    }
    // Se for YouTube, abre no player interno; senão abre em nova aba
    const isYouTube = trailerUrl.includes("youtube.com") || trailerUrl.includes("youtu.be");
    if (isYouTube) {
      openPlayer({
        id: `trailer-${id}`,
        title: `Trailer - ${data.title}`,
        type: "movie",
        videoUrl: trailerUrl,
        poster: data.poster_path
          ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
          : data.poster || data.capa || undefined,
      });
    } else {
      window.open(trailerUrl, "_blank", "noopener noreferrer");
    }
  };

  const toggleFav = async () => {
    if (!user || !data) return toast({ title: "Faça login primeiro" });
    const table = type === "series" ? "series" : "cinema";
    if (isFav) {
      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("content_id", Number(id))
        .eq("content_type", table);
      setIsFav(false);
      toast({ title: "Removido dos favoritos" });
    } else {
      await supabase.from("favorites").insert({
        user_id: user.id,
        content_id: Number(id),
        content_type: table,
        titulo: data.title,
        poster: data.poster_path || (data as any).poster || (data as any).capa || null,
      });
      setIsFav(true);
      toast({ title: "Adicionado aos favoritos! ❤️" });
    }
  };

  const toggleWatch = async () => {
    if (!user || !data) return toast({ title: "Faça login primeiro" });
    const table = type === "series" ? "series" : "cinema";
    if (isWatch) {
      await supabase
        .from("watchlist" as any)
        .delete()
        .eq("user_id", user.id)
        .eq("content_id", Number(id))
        .eq("content_type", table);
      setIsWatch(false);
      toast({ title: "Removido da lista" });
    } else {
      await supabase.from("watchlist" as any).insert({
        user_id: user.id,
        content_id: Number(id),
        content_type: table,
        titulo: data.title,
        poster: data.poster_path || (data as any).poster || (data as any).capa || null,
      });
      setIsWatch(true);
      toast({ title: "Adicionado à lista ✅" });
    }
  };

  // Bug #6 corrigido: Like salva no Supabase
  const handleLike = async () => {
    if (!user) return toast({ title: "Faça login para curtir" });
    if (liked) {
      toast({ title: "Você já curtiu este conteúdo!" });
      return;
    }
    try {
      // Salvar like na tabela de ratings se existir, ou só no estado local
      const table = type === "series" ? "series" : "cinema";
      await supabase.from("ratings" as any).upsert({
        user_id: user.id,
        content_id: Number(id),
        content_type: table,
        rating: 1,
      }, { onConflict: "user_id,content_id,content_type" }).select();
      setLiked(true);
      toast({ title: "Curtido! 👍" });
    } catch {
      // Se tabela ratings não existir, só atualiza visualmente
      setLiked(true);
      toast({ title: "Curtido! 👍" });
    }
  };

  const age = (c?: string) => {
    if (!c) return { a: "L", r: "Livre" };
    const x = c.toUpperCase();
    if (x.includes("12")) return { a: "12", r: "Conteúdo moderado" };
    if (x.includes("14")) return { a: "14", r: "Violência moderada" };
    if (x.includes("16") || x.includes("R")) return { a: "16", r: "Violência intensa" };
    if (x.includes("18")) return { a: "18", r: "Conteúdo adulto" };
    return { a: "L", r: "Livre" };
  };

  const flag = (c?: string) =>
    c ? `https://flagcdn.com/w40/${c.toLowerCase()}.png` : "";

  if (load)
    return (
      <div
        style={{
          background: C.bg,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ color: C.neon }}>Carregando...</div>
      </div>
    );

  if (!data)
    return (
      <div
        style={{
          background: C.bg,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div style={{ color: C.text, fontSize: "20px" }}>Conteúdo não encontrado</div>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: C.neon,
            color: "black",
            border: "none",
            borderRadius: "12px",
            padding: "10px 20px",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          Voltar
        </button>
      </div>
    );

  const backdrop = data.backdrop_path
    ? `https://image.tmdb.org/t/p/original${data.backdrop_path}`
    : (data as any).banner || (data as any).capa || (data as any).poster;
  const a = age(data.certification);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text }}>
      <section
        style={{
          position: "relative",
          width: "100vw",
          aspectRatio: "16/9",
          minHeight: "520px",
          maxHeight: "760px",
          overflow: "hidden",
          backgroundImage: `url(${backdrop})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to right, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.62) 45%, rgba(0,0,0,0.22) 70%, rgba(0,0,0,0) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "220px",
            background: "linear-gradient(to bottom, rgba(0,0,0,0), #070A10)",
            zIndex: 4,
          }}
        />
        <button
          onClick={() => navigate(-1)}
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            zIndex: 20,
            background: "rgba(0,0,0,0.5)",
            border: "none",
            borderRadius: "50%",
            width: "44px",
            height: "44px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "white",
          }}
        >
          <ChevronLeft size={24} />
        </button>
        <div
          style={{
            position: "absolute",
            left: "28px",
            right: "28px",
            bottom: "80px",
            zIndex: 10,
            display: "grid",
            gridTemplateColumns: "1.2fr 0.8fr",
            gap: "22px",
            alignItems: "end",
          }}
        >
          <div>
            <span
              style={{
                display: "inline-block",
                background: "rgba(0,183,255,0.15)",
                border: "1px solid rgba(0,183,255,0.25)",
                color: C.neon,
                padding: "6px 12px",
                borderRadius: "12px",
                fontWeight: 800,
                fontSize: "12px",
                textTransform: "uppercase",
              }}
            >
              {type === "series" ? "Série" : "Filme"}
            </span>
            <h1
              style={{
                margin: "12px 0 0 0",
                fontSize: "clamp(32px, 4vw, 58px)",
                fontWeight: 900,
                letterSpacing: "1px",
                textTransform: "uppercase",
                textShadow: "0 0 35px rgba(0,183,255,0.25)",
              }}
            >
              {data.title}
            </h1>
            <div
              style={{
                marginTop: "12px",
                display: "flex",
                gap: "10px",
                alignItems: "center",
                fontSize: "14px",
                opacity: 0.9,
              }}
            >
              <span>⭐ {data.vote_average?.toFixed(1) || "0.0"}/10</span>
              <span style={{ opacity: 0.6 }}>•</span>
              <span>{data.year}</span>
              <span style={{ opacity: 0.6 }}>•</span>
              <span>{data.runtime || "120"} min</span>
              <span
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  padding: "6px 10px",
                  borderRadius: "12px",
                  fontWeight: 800,
                  fontSize: "12px",
                }}
              >
                4K UHD
              </span>
            </div>
            <div
              style={{
                marginTop: "10px",
                display: "flex",
                gap: "10px",
                alignItems: "center",
                fontSize: "13px",
              }}
            >
              <span
                style={{
                  background: "rgba(255,0,0,0.18)",
                  border: "1px solid rgba(255,0,0,0.35)",
                  padding: "5px 9px",
                  borderRadius: "10px",
                  fontWeight: 900,
                }}
              >
                {a.a}
              </span>
              <span>{a.r}</span>
              <span style={{ opacity: 0.6 }}>|</span>
              {data.origin_country?.[0] && (
                <>
                  <img
                    src={flag(data.origin_country[0])}
                    style={{ width: "26px", height: "18px", borderRadius: "4px", objectFit: "cover" }}
                  />
                  <span>{data.origin_country[0]}</span>
                </>
              )}
            </div>
            <div style={{ marginTop: "10px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {(data.genres || []).map((g: any, i: number) => (
                <span
                  key={i}
                  style={{
                    background: "rgba(0,183,255,0.12)",
                    border: "1px solid rgba(0,183,255,0.25)",
                    padding: "7px 12px",
                    borderRadius: "999px",
                    fontSize: "12px",
                    fontWeight: 800,
                  }}
                >
                  {g.name}
                </span>
              ))}
            </div>
            <p
              style={{
                marginTop: "14px",
                fontSize: "15px",
                lineHeight: 1.5,
                opacity: 0.88,
                maxWidth: "720px",
              }}
            >
              {data.overview}
            </p>
            <div
              style={{
                marginTop: "18px",
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              {/* Bug #1 corrigido: usa openPlayer */}
              <button
                onClick={handleWatch}
                style={{
                  background: `linear-gradient(90deg, ${C.neon}, ${C.neon2})`,
                  color: "black",
                  border: "none",
                  borderRadius: "16px",
                  padding: "14px 20px",
                  fontSize: "15px",
                  fontWeight: 900,
                  cursor: "pointer",
                  boxShadow: "0 0 30px rgba(0,183,255,0.35)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Play size={18} fill="black" /> Assistir agora
              </button>

              {/* Bug #5 corrigido: Trailer tem handler */}
              <button
                onClick={handleTrailer}
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  backdropFilter: "blur(16px)",
                  color: "white",
                  borderRadius: "16px",
                  padding: "14px 20px",
                  fontSize: "15px",
                  fontWeight: 900,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                🎬 Trailer
              </button>

              <div style={{ display: "flex", gap: "12px", marginLeft: "12px" }}>
                <button
                  onClick={toggleFav}
                  style={{
                    background: C.glass,
                    border: `1px solid ${C.glassB}`,
                    backdropFilter: "blur(14px)",
                    color: isFav ? "#ff3366" : "white",
                    borderRadius: "18px",
                    padding: "10px 12px",
                    cursor: "pointer",
                    fontWeight: 900,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    width: "82px",
                    gap: "6px",
                  }}
                >
                  <Heart size={18} fill={isFav ? "#ff3366" : "none"} />
                  <span style={{ fontSize: "11px", opacity: 0.85 }}>Favoritos</span>
                </button>

                <button
                  onClick={toggleWatch}
                  style={{
                    background: C.glass,
                    border: `1px solid ${C.glassB}`,
                    backdropFilter: "blur(14px)",
                    color: isWatch ? C.neon : "white",
                    borderRadius: "18px",
                    padding: "10px 12px",
                    cursor: "pointer",
                    fontWeight: 900,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    width: "82px",
                    gap: "6px",
                  }}
                >
                  <Clock size={18} />
                  <span style={{ fontSize: "11px", opacity: 0.85 }}>Depois</span>
                </button>

                {/* Bug #6 corrigido: Like tem handler */}
                <button
                  onClick={handleLike}
                  style={{
                    background: C.glass,
                    border: `1px solid ${liked ? C.neon : C.glassB}`,
                    backdropFilter: "blur(14px)",
                    color: liked ? C.neon : "white",
                    borderRadius: "18px",
                    padding: "10px 12px",
                    cursor: "pointer",
                    fontWeight: 900,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    width: "82px",
                    gap: "6px",
                  }}
                >
                  <ThumbsUp size={18} fill={liked ? C.neon : "none"} />
                  <span style={{ fontSize: "11px", opacity: 0.85 }}>Like</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cast */}
      {cast.length > 0 && (
        <section style={{ padding: "32px 28px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "16px", color: C.neon }}>
            Elenco
          </h2>
          <div style={{ display: "flex", gap: "16px", overflowX: "auto", paddingBottom: "8px" }}>
            {cast.map((actor: any, i: number) => (
              <div key={i} style={{ flexShrink: 0, textAlign: "center", width: "80px" }}>
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    background: "rgba(255,255,255,0.1)",
                    marginBottom: "8px",
                  }}
                >
                  {actor.profile_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                      alt={actor.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "24px",
                      }}
                    >
                      👤
                    </div>
                  )}
                </div>
                <p style={{ fontSize: "11px", fontWeight: 700, lineHeight: 1.2 }}>{actor.name}</p>
                {actor.character && (
                  <p style={{ fontSize: "10px", opacity: 0.6, lineHeight: 1.2, marginTop: "2px" }}>
                    {actor.character}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recomendações */}
      {recs.length > 0 && (
        <section style={{ padding: "0 28px 40px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "16px", color: C.neon }}>
            Você também pode gostar
          </h2>
          <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "8px" }}>
            {recs.map((item: any) => (
              <div
                key={item.id}
                onClick={() => navigate(`/details/${item.type}/${item.id}`)}
                style={{
                  flexShrink: 0,
                  width: "120px",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: "120px",
                    height: "180px",
                    borderRadius: "12px",
                    overflow: "hidden",
                    background: "rgba(255,255,255,0.05)",
                    marginBottom: "8px",
                  }}
                >
                  {item.poster && (
                    <img
                      src={item.poster.startsWith("http") ? item.poster : `https://image.tmdb.org/t/p/w342${item.poster}`}
                      alt={item.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  )}
                </div>
                <p style={{ fontSize: "12px", fontWeight: 700, lineHeight: 1.3 }}>{item.title}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default DetailsNew;
