import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSupabaseContent } from "@/hooks/useSupabaseContent";
import VideoPlayer from "@/components/VideoPlayer";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SeriesEpisodes from "@/components/SeriesEpisodes";

const Content = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: categories } = useSupabaseContent();
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !categories) return;

    // Buscar conteúdo em todas as categorias
    const allItems = categories?.flatMap(cat => cat.items) || [];
    const foundContent = allItems.find(item => item.id === id);

    if (foundContent) {
      setContent(foundContent);
    } else {
      // Redirecionar para home se não encontrar
      navigate("/");
    }
    setLoading(false);
  }, [id, categories, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#00A8E1] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!content) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-12 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate(-1)}
              className="text-white/60 hover:text-white transition-colors mb-4"
            >
              ← Voltar
            </button>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">{content.title}</h1>
            <div className="flex items-center gap-4 text-white/60">
              <span>{content.year}</span>
              <span>•</span>
              <span>{content.genre.join(", ")}</span>
              {content.rating && (
                <>
                  <span>•</span>
                  <span className="text-yellow-400">⭐ {content.rating}</span>
                </>
              )}
            </div>
          </div>

          {/* Video Player - Full Width */}
          {content.content && (
            <div className="mb-8">
              <VideoPlayer
                src={content.content}
                poster={content.backdrop || content.image}
                title={content.title}
              />
            </div>
          )}

          {/* Episodes Section - Only for Series */}
          {content.type === "tv" && (
            <div className="mb-8">
              <SeriesEpisodes 
                seriesId={content.id}
                tmdbId={content.tmdbId}
              />
            </div>
          )}

          {/* Description */}
          {content.description && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">Sinopse</h2>
              <p className="text-white/80 leading-relaxed">{content.description}</p>
            </div>
          )}

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Informações</h3>
              <div className="space-y-2 text-white/60">
                <p><span className="font-semibold">Ano:</span> {content.year}</p>
                <p><span className="font-semibold">Gênero:</span> {content.genre.join(", ")}</p>
                <p><span className="font-semibold">Tipo:</span> {content.type}</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Ações</h3>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    // Adicionar aos favoritos
                    const favs = JSON.parse(localStorage.getItem("paixaofavs") || "[]");
                    const newFavs = [...favs, content];
                    localStorage.setItem("paixaofavs", JSON.stringify(newFavs));
                    alert("Adicionado aos favoritos!");
                  }}
                  className="w-full bg-[#00A8E1] text-white font-bold py-3 rounded-lg transition-colors hover:bg-[#00A8E1]/80"
                >
                  ❤️ Adicionar aos Favoritos
                </button>
                <button
                  onClick={() => navigate("/")}
                  className="w-full bg-white/10 text-white font-bold py-3 rounded-lg transition-colors hover:bg-white/20"
                >
                  🏠 Voltar para Início
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Content;
