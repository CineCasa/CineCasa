import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import ContentRow from "@/components/ContentRow";
import Footer from "@/components/Footer";
import { ContentItem } from "@/data/content";

const Favorites = () => {
  const [favorites, setFavorites] = useState<ContentItem[]>([]);

  useEffect(() => {
    // No CineCasa, os favoritos parecem seguir um padrão de armazenamento local ou similar
    // Por enquanto, vamos carregar do localStorage se existir, ou mostrar vazio
    try {
      const favStr = localStorage.getItem("paixaofavs");
      if (favStr) {
        setFavorites(JSON.parse(favStr));
      }
    } catch (e) {
      console.error("Erro ao carregar favoritos:", e);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 px-4 md:px-8 lg:px-12 pb-20">
        <h1 className="text-3xl md:text-4xl font-black mb-8 text-white uppercase tracking-tight">
          Meus Favoritos
        </h1>
        
        {favorites.length > 0 ? (
          <div className="mt-8">
            <ContentRow 
              category={{ id: "favorites-grid", title: "Minha Lista", items: favorites }} 
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-40 text-center">
            <div className="text-white/20 mb-6">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="w-24 h-24 mx-auto">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Sua lista está vazia</h2>
            <p className="text-white/50 max-w-md">
              Adicione filmes e séries à sua lista para assisti-los mais tarde.
            </p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Favorites;
