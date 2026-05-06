import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Play, Heart, Clock, ThumbsUp, ChevronLeft, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { usePlayer } from "@/contexts/PlayerContext";
import { v4 as uuidv4 } from "uuid";

/**
 * NOVAS FEATURES:
 * 1. Lista de temporadas + episódios para séries (tabelas temporadas + episodios)
 * 2. Ao clicar no episódio → abre player com props corretos (episodeId, season, episode)
 * 3. PlayerContext recebe onNextEpisode callback para autoplay do próximo
 * 4. Resume de onde parou (lê user_progress)
 * 5. Botões Trailer e Like funcionais
 */

const C = {
  bg: "#070A10",
  neon: "#00B7FF",
  neon2: "#00E5FF",
  text: "#EAF6FF",
  glass: "rgba(10,18,40,0.6)",
  glassB: "rgba(0,183,255,0.2)",
  card: "rgba(255,255,255,0.04)",
};

interface Episodio {
  id_n: number;
  temporada_id: number;
  numero_episodio: number;
  titulo: string;
  descricao: string | null;
  duracao: number | null;
  arquivo: string | null;   // URL do vídeo
  imagem_185: string | null;
  imagem_342: string | null;
  imagem_500: string | null;
  banner: string | null;
  trailer: string | null;
}

interface Temporada {
  id_n: number;
  serie_id: number;
  numero_temporada: number;
  capa: string | null;
  banner: string | null;
  titulo: string | null;
  ano: string | null;
  episodios: Episodio[];
}

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

  // Séries
  const [temporadas, setTemporadas] = useState<Temporada[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [expandedEp, setExpandedEp] = useState<number | null>(null);

  // Progresso do usuário
  const [userProgress, setUserProgress] = useState<any>(null);

  const isSeries = type === "series";

  // ── Buscar dados principais ──────────────────────────────────
  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoad(true);
      try {
        const table = isSeries ? "series" : "cinema";
        const idCol = isSeries ? "id_n" : "id";

        const { data: local } = await supabase
          .from(table)
          .select("*")
          .eq(idCol, id)
          .maybeSingle();

        if (!local) { setLoad(false); return; }

        // Dados TMDB via worker
        let tmdb: any = null;
        if (local?.tmdb_id) {
          try {
            const res = await fetch(
              `https://cinecasa-worker.cinecasa-worker.workers.dev/tmdb/details?tmdb=${local.tmdb_id}&type=${isSeries ? "tv" : "movie"}`
            );
            if (res.ok) tmdb = await res.json();
          } catch {}
        }

        setData({
          ...local,
          ...(tmdb || {}),
          title: tmdb?.title || tmdb?.name || local.titulo,
          backdrop_path: tmdb?.backdrop_path || local.banner || local.capa,
          year:
            tmdb?.release_date?.substring(0, 4) ||
            tmdb?.first_air_date?.substring(0, 4) ||
            local.year || local.ano,
          videoUrl: local.url || local.arquivo || null,
          trailerUrl: local.trailer || null,
          tmdb_id: local.tmdb_id,
        });

        if (tmdb?.credits?.cast) setCast(tmdb.credits.cast.slice(0, 15));

        // Recomendações
        const { data: r } = await supabase
          .from(table)
          .select(isSeries ? "id_n,titulo,capa,rating" : "id,titulo,poster,rating")
          .neq(idCol, id)
          .limit(10);
        setRecs(
          (r || []).map((i: any) => ({
            id: (i.id || i.id_n)?.toString(),
            title: i.titulo,
            poster: i.capa || i.poster,
            type: table,
          }))
        );

        // Estado favorito / watchlist
        if (user) {
          const [favRes, wlRes, progRes] = await Promise.all([
            supabase.from("favorites").select("id").eq("user_id", user.id).eq("content_id", id).maybeSingle(),
            supabase.from("watchlist").select("id").eq("user_id", user.id).eq("content_id", Number(id)).maybeSingle(),
            supabase.from("user_progress").select("*").eq("user_id", user.id).eq("content_id", id).maybeSingle(),
          ]);
          setIsFav(!!favRes.data);
          setIsWatch(!!wlRes.data);
          setUserProgress(progRes.data);
        }
      } catch (e) {
        console.error("[DetailsNew]", e);
      }
      setLoad(false);
    })();
  }, [id, type, user, isSeries]);

  // ── Buscar temporadas + episódios (apenas séries) ─────────────
  useEffect(() => {
    if (!isSeries || !id) return;
    (async () => {
      const { data: temps } = await supabase
        .from("temporadas")
        .select("*")
        .eq("serie_id", id)
        .order("numero_temporada", { ascending: true });

      if (!temps?.length) return;

      const tempComEps = await Promise.all(
        temps.map(async (t: any) => {
          const { data: eps } = await supabase
            .from("episodios")
            .select("*")
            .eq("temporada_id", t.id_n)
            .order("numero_episodio", { ascending: true });
          return { ...t, episodios: eps || [] };
        })
      );
      setTemporadas(tempComEps);
      setSelectedSeason(tempComEps[0]?.numero_temporada || 1);
    })();
  }, [isSeries, id]);

  // ── Abrir player para um episódio ─────────────────────────────
  const playEpisode = useCallback(
    (ep: Episodio, temporada: Temporada, allEps: Episodio[]) => {
      const videoUrl = ep.arquivo || ep.trailer || data?.videoUrl;
      if (!videoUrl) {
        toast({ title: "Vídeo não disponível", description: "Este episódio ainda não possui link de reprodução." });
        return;
      }

      // Resumir de onde parou (se existir progresso para este episódio)
      let resumeFrom = 0;
      if (userProgress?.episode_id?.toString() === ep.id_n.toString()) {
        resumeFrom = userProgress.time_position || userProgress.current_time || 0;
      }

      // Próximo episódio
      const currentIdx = allEps.findIndex(e => e.id_n === ep.id_n);
      const nextEp = allEps[currentIdx + 1] || null;

      // Próximo episódio na temporada seguinte
      let nextEpFromNextSeason: Episodio | null = null;
      let nextSeasonData: Temporada | null = null;
      if (!nextEp) {
        const currentSeasonIdx = temporadas.findIndex(t => t.id_n === temporada.id_n);
        const nextSeason = temporadas[currentSeasonIdx + 1];
        if (nextSeason?.episodios?.[0]) {
          nextEpFromNextSeason = nextSeason.episodios[0];
          nextSeasonData = nextSeason;
        }
      }

      const resolvedNextEp = nextEp || nextEpFromNextSeason;
      const resolvedNextSeason = nextEp ? temporada : nextSeasonData;

      openPlayer({
        id: id!,
        title: `${data?.title} — T${temporada.numero_temporada}:E${ep.numero_episodio} ${ep.titulo}`,
        type: "series",
        videoUrl,
        poster: ep.imagem_342 || ep.imagem_500 || data?.poster_path
          ? `https://image.tmdb.org/t/p/w500${data?.poster_path}`
          : data?.capa || undefined,
        episodeId: ep.id_n.toString(),
        seasonNumber: temporada.numero_temporada,
        episodeNumber: ep.numero_episodio,
        resumeFrom,
        tmdbId: data?.tmdb_id?.toString(),
        tmdbType: "tv",
        // Callback para próximo episódio
        ...(resolvedNextEp && resolvedNextSeason
          ? {
              hasNextEpisode: true,
              nextEpisodeTitle: `T${resolvedNextSeason.numero_temporada}:E${resolvedNextEp.numero_episodio} ${resolvedNextEp.titulo}`,
              onNextEpisode: () => playEpisode(resolvedNextEp, resolvedNextSeason, resolvedNextSeason.episodios),
            }
          : { hasNextEpisode: false }),
      });
    },
    [data, id, openPlayer, temporadas, toast, userProgress]
  );

  // ── Assistir agora (filmes ou primeiro episódio de série) ──────
  const handleWatch = () => {
    if (!data) return;

    if (isSeries) {
      // Encontrar episódio onde parou, ou começa do primeiro
      const allSeasonsSorted = [...temporadas].sort((a, b) => a.numero_temporada - b.numero_temporada);
      let targetSeason = allSeasonsSorted[0];
      let targetEp = targetSeason?.episodios?.[0];

      if (userProgress?.episode_id) {
        for (const t of temporadas) {
          const found = t.episodios.find(e => e.id_n.toString() === userProgress.episode_id?.toString());
          if (found) { targetSeason = t; targetEp = found; break; }
        }
      }

      if (!targetSeason || !targetEp) {
        toast({ title: "Nenhum episódio disponível ainda." });
        return;
      }
      playEpisode(targetEp, targetSeason, targetSeason.episodios);
      return;
    }

    if (!data.videoUrl) {
      toast({ title: "Vídeo não disponível", description: "Este conteúdo ainda não possui link de reprodução." });
      return;
    }

    const resumeFrom = userProgress?.time_position || userProgress?.current_time || 0;

    openPlayer({
      id: id!,
      title: data.title,
      type: "movie",
      videoUrl: data.videoUrl,
      poster: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : data.poster || data.capa || undefined,
      resumeFrom,
      tmdbId: data.tmdb_id?.toString(),
      tmdbType: "movie",
    });
  };

  const handleTrailer = () => {
    if (!data) return;
    const trailerUrl = data.trailerUrl || data.trailer;
    if (!trailerUrl) { toast({ title: "Trailer não disponível" }); return; }
    const isYT = trailerUrl.includes("youtube") || trailerUrl.includes("youtu.be");
    if (isYT) {
      openPlayer({ id: `trailer-${id}`, title: `Trailer — ${data.title}`, type: "movie", videoUrl: trailerUrl });
    } else {
      window.open(trailerUrl, "_blank", "noopener noreferrer");
    }
  };

  const toggleFav = async () => {
    if (!user || !data) return toast({ title: "Faça login primeiro" });
    const table = isSeries ? "series" : "cinema";
    if (isFav) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("content_id", id);
      setIsFav(false); toast({ title: "Removido dos favoritos" });
    } else {
      await supabase.from("favorites").insert({
        user_id: user.id, content_id: id, content_type: table,
        titulo: data.title, poster: data.poster_path || data.poster || data.capa || null,
      });
      setIsFav(true); toast({ title: "Adicionado aos favoritos! ❤️" });
    }
  };

  const toggleWatch = async () => {
    if (!user || !data) return toast({ title: "Faça login primeiro" });
    const table = isSeries ? "series" : "movie";
    if (isWatch) {
      await supabase.from("watchlist").delete().eq("user_id", user.id).eq("content_id", Number(id)).eq("content_type", table);
      setIsWatch(false); toast({ title: "Removido da lista" });
    } else {
      await supabase.from("watchlist").insert({
        id: uuidv4(),
        user_id: user.id,
        content_id: Number(id),
        content_type: table,
        titulo: data.title,
        poster: data.poster_path || data.poster || data.capa || null,
        rating: data.vote_average?.toString() || null,
        year: data.year || null,
        genero: null,
      });
      setIsWatch(true); toast({ title: "Adicionado à lista ✅" });
    }
  };

  const handleLike = async () => {
    if (!user) return toast({ title: "Faça login para curtir" });
    if (liked) { toast({ title: "Você já curtiu este conteúdo!" }); return; }
    await supabase.from("ratings").upsert(
      { user_id: user.id, content_id: id, content_type: isSeries ? "series" : "movie", rating: 1 },
      { onConflict: "user_id,content_id" }
    ).select();
    setLiked(true);
    toast({ title: "Curtido! 👍" });
  };

  // ── Season selecionada ────────────────────────────────────────
  const currentSeason = temporadas.find(t => t.numero_temporada === selectedSeason);
  const progressPct = userProgress ? Math.min(userProgress.progress || 0, 100) : 0;

  if (load) return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: C.neon, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <div style={{ width: 40, height: 40, border: `3px solid ${C.neon}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <span>Carregando...</span>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!data) return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <div style={{ color: C.text, fontSize: 20 }}>Conteúdo não encontrado</div>
      <button onClick={() => navigate(-1)} style={{ background: C.neon, color: "black", border: "none", borderRadius: 12, padding: "10px 20px", cursor: "pointer", fontWeight: 700 }}>Voltar</button>
    </div>
  );

  const backdrop = data.backdrop_path
    ? data.backdrop_path.startsWith("http") ? data.backdrop_path : `https://image.tmdb.org/t/p/original${data.backdrop_path}`
    : data.banner || data.capa || data.poster;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text }}>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section style={{ position: "relative", width: "100vw", minHeight: 520, maxHeight: 760, overflow: "hidden", backgroundImage: `url(${backdrop})`, backgroundSize: "cover", backgroundPosition: "center" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.62) 45%, rgba(0,0,0,0.12) 100%)" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 220, background: `linear-gradient(to bottom, rgba(0,0,0,0), ${C.bg})`, zIndex: 4 }} />

        <button onClick={() => navigate(-1)} style={{ position: "absolute", top: 20, left: 20, zIndex: 20, background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "white" }}>
          <ChevronLeft size={24} />
        </button>

        <div style={{ position: "absolute", left: 28, right: 28, bottom: 80, zIndex: 10 }}>
          <span style={{ display: "inline-block", background: "rgba(0,183,255,0.15)", border: "1px solid rgba(0,183,255,0.25)", color: C.neon, padding: "6px 12px", borderRadius: 12, fontWeight: 800, fontSize: 12, textTransform: "uppercase" }}>
            {isSeries ? "Série" : "Filme"}
          </span>
          <h1 style={{ margin: "12px 0 0 0", fontSize: "clamp(28px,4vw,56px)", fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", textShadow: "0 0 35px rgba(0,183,255,0.25)" }}>
            {data.title}
          </h1>
          <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center", fontSize: 14, opacity: 0.9, flexWrap: "wrap" }}>
            <span>⭐ {data.vote_average?.toFixed(1) || "—"}/10</span>
            <span style={{ opacity: 0.5 }}>•</span>
            <span>{data.year}</span>
            {data.runtime && <><span style={{ opacity: 0.5 }}>•</span><span>{data.runtime} min</span></>}
            {isSeries && data.number_of_seasons && <><span style={{ opacity: 0.5 }}>•</span><span>{data.number_of_seasons} temporada{data.number_of_seasons > 1 ? "s" : ""}</span></>}
          </div>

          {/* Progresso anterior */}
          {progressPct > 0 && progressPct < 95 && (
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, maxWidth: 200, height: 3, background: "rgba(255,255,255,0.2)", borderRadius: 4 }}>
                <div style={{ width: `${progressPct}%`, height: "100%", background: C.neon, borderRadius: 4 }} />
              </div>
              <span style={{ fontSize: 12, color: C.neon }}>{progressPct}% assistido</span>
            </div>
          )}

          <p style={{ marginTop: 12, fontSize: 14, lineHeight: 1.55, opacity: 0.85, maxWidth: 700 }}>{data.overview}</p>

          <div style={{ marginTop: 18, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <button onClick={handleWatch} style={{ background: `linear-gradient(90deg,${C.neon},${C.neon2})`, color: "black", border: "none", borderRadius: 16, padding: "14px 22px", fontSize: 15, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 0 30px rgba(0,183,255,0.35)" }}>
              <Play size={18} fill="black" />
              {progressPct > 0 && progressPct < 95 ? "Continuar" : (isSeries ? "Assistir T1:E1" : "Assistir agora")}
            </button>
            <button onClick={handleTrailer} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)", backdropFilter: "blur(16px)", color: "white", borderRadius: 16, padding: "14px 20px", fontSize: 15, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              🎬 Trailer
            </button>
            <div style={{ display: "flex", gap: 10, marginLeft: 10 }}>
              {[
                { icon: <Heart size={18} fill={isFav ? "#ff3366" : "none"} />, label: "Favoritos", active: isFav, color: "#ff3366", fn: toggleFav },
                { icon: <Clock size={18} />, label: "Depois", active: isWatch, color: C.neon, fn: toggleWatch },
                { icon: <ThumbsUp size={18} fill={liked ? C.neon : "none"} />, label: "Like", active: liked, color: C.neon, fn: handleLike },
              ].map(({ icon, label, active, color, fn }, i) => (
                <button key={i} onClick={fn} style={{ background: C.glass, border: `1px solid ${active ? color : C.glassB}`, backdropFilter: "blur(14px)", color: active ? color : "white", borderRadius: 18, padding: "10px 12px", cursor: "pointer", fontWeight: 900, display: "flex", flexDirection: "column", alignItems: "center", width: 78, gap: 5 }}>
                  {icon}
                  <span style={{ fontSize: 11, opacity: 0.85 }}>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Episódios (apenas séries) ─────────────────────────────── */}
      {isSeries && temporadas.length > 0 && (
        <section style={{ padding: "32px 28px" }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20, color: C.neon }}>Episódios</h2>

          {/* Seletor de temporada */}
          {temporadas.length > 1 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
              {temporadas.map(t => (
                <button
                  key={t.id_n}
                  onClick={() => setSelectedSeason(t.numero_temporada)}
                  style={{
                    padding: "8px 16px", borderRadius: 20, fontWeight: 700, fontSize: 13, cursor: "pointer", border: "none", transition: "all 0.2s",
                    background: selectedSeason === t.numero_temporada ? C.neon : "rgba(255,255,255,0.08)",
                    color: selectedSeason === t.numero_temporada ? "black" : "white",
                  }}
                >
                  {t.titulo || `Temporada ${t.numero_temporada}`}
                </button>
              ))}
            </div>
          )}

          {/* Lista de episódios */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(currentSeason?.episodios || []).map(ep => {
              const isExpanded = expandedEp === ep.id_n;
              const epProgress = userProgress?.episode_id?.toString() === ep.id_n.toString() ? userProgress.progress || 0 : 0;
              const thumb = ep.imagem_342 || ep.imagem_185 || ep.imagem_500;

              return (
                <div
                  key={ep.id_n}
                  style={{ background: C.card, border: `1px solid rgba(255,255,255,0.06)`, borderRadius: 12, overflow: "hidden", transition: "border-color 0.2s" }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer" }}
                    onClick={() => setExpandedEp(isExpanded ? null : ep.id_n)}
                  >
                    {/* Número */}
                    <span style={{ minWidth: 28, fontSize: 15, fontWeight: 800, color: "rgba(255,255,255,0.4)" }}>
                      {ep.numero_episodio}
                    </span>

                    {/* Thumbnail */}
                    <div style={{ position: "relative", flexShrink: 0, width: 100, height: 56, borderRadius: 8, overflow: "hidden", background: "rgba(255,255,255,0.06)" }}>
                      {thumb ? (
                        <img src={thumb.startsWith("http") ? thumb : `https://image.tmdb.org/t/p/w185${thumb}`} alt={ep.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Play size={20} color="rgba(255,255,255,0.3)" />
                        </div>
                      )}
                      {/* Barra de progresso */}
                      {epProgress > 0 && (
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: "rgba(0,0,0,0.5)" }}>
                          <div style={{ width: `${epProgress}%`, height: "100%", background: C.neon }} />
                        </div>
                      )}
                    </div>

                    {/* Título + duração */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {ep.titulo}
                      </p>
                      {ep.duracao && (
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{ep.duracao} min</span>
                      )}
                    </div>

                    {/* Play + expand */}
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <button
                        onClick={e => { e.stopPropagation(); playEpisode(ep, currentSeason!, currentSeason!.episodios); }}
                        style={{ background: `linear-gradient(135deg,${C.neon},${C.neon2})`, border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
                      >
                        <Play size={14} fill="black" color="black" />
                      </button>
                      <ChevronDown size={16} color="rgba(255,255,255,0.4)" style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                    </div>
                  </div>

                  {/* Descrição expandida */}
                  {isExpanded && ep.descricao && (
                    <div style={{ padding: "0 16px 14px 56px", fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>
                      {ep.descricao}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Elenco ───────────────────────────────────────────────── */}
      {cast.length > 0 && (
        <section style={{ padding: "0 28px 32px" }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16, color: C.neon }}>Elenco</h2>
          <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8 }}>
            {cast.map((actor: any, i: number) => (
              <div key={i} style={{ flexShrink: 0, textAlign: "center", width: 76 }}>
                <div style={{ width: 76, height: 76, borderRadius: "50%", overflow: "hidden", background: "rgba(255,255,255,0.08)", marginBottom: 6 }}>
                  {actor.profile_path
                    ? <img src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`} alt={actor.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>👤</div>
                  }
                </div>
                <p style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.2 }}>{actor.name}</p>
                {actor.character && <p style={{ fontSize: 10, opacity: 0.5, lineHeight: 1.2, marginTop: 2 }}>{actor.character}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Recomendações ─────────────────────────────────────────── */}
      {recs.length > 0 && (
        <section style={{ padding: "0 28px 48px" }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16, color: C.neon }}>Você também pode gostar</h2>
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
            {recs.map(item => (
              <div key={item.id} onClick={() => navigate(`/details/${item.type}/${item.id}`)} style={{ flexShrink: 0, width: 120, cursor: "pointer" }}>
                <div style={{ width: 120, height: 180, borderRadius: 10, overflow: "hidden", background: "rgba(255,255,255,0.05)", marginBottom: 8 }}>
                  {item.poster && <img src={item.poster.startsWith("http") ? item.poster : `https://image.tmdb.org/t/p/w342${item.poster}`} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                </div>
                <p style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.3 }}>{item.title}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default DetailsNew;
