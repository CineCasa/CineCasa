import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import HeroBanner from "@/components/HeroBanner";
import ContentRow from "@/components/ContentRow";
import Footer from "@/components/Footer";
import { useSupabaseContent } from "@/hooks/useSupabaseContent";
import ContinueWatchingRow from "@/components/ContinueWatchingRow";
import DynamicCategoryRow from "@/components/DynamicCategoryRow";
import TrendingGlobalRow from "@/components/TrendingGlobalRow";
import Top5StreamingRow from "@/components/Top5StreamingRow";
import ContentCounter from "@/components/ContentCounter";

// Helper for 'Sábado à noite merece'
// Active from Saturday 16:49 to Sunday 12:59
const isValidSabado = () => {
  const now = new Date();
  const day = now.getDay(); // 0 is Sunday, 6 is Saturday
  const hours = now.getHours();
  const minutes = now.getMinutes();

  if (day === 6) { // Saturday
    if (hours > 16 || (hours === 16 && minutes >= 49)) return true;
  }
  if (day === 0) { // Sunday
    if (hours < 12 || (hours === 12 && minutes <= 59)) return true;
  }
  return false;
};

const Index = () => {
  const { data: categories, isLoading } = useSupabaseContent();
  
  // 1. Filtragem Inicial: Remover TV e Canais
  const filteredCategories = categories?.filter(cat => 
    !cat.title.toLowerCase().includes("tv") && 
    !cat.title.toLowerCase().includes("canais") &&
    cat.id !== "tv-ao-vivo"
  ) || [];

  // 2. Unicidade de Conteúdo e Remoção de Temporadas
  // Rastreamos o que já foi exibido para evitar duplicatas e múltiplas temporadas
  const displayedIds = new Set<string>();

  const getUniqueItems = (items: any[]) => {
    return items.filter(item => {
      // Usamos tmdbId se disponível, senão o título normalizado para detectar temporadas/duplicatas
      const uniqueId = item.tmdbId || item.title.toLowerCase().replace(/temporada\s+\d+/g, "").trim();
      
      if (displayedIds.has(uniqueId) || item.type === "tv") {
        return false;
      }
      displayedIds.add(uniqueId);
      return true;
    });
  };

  // Flatten items for Dynamic Categories (já filtrados por unicidade)
  const allItems = filteredCategories.flatMap(c => c.items);
  
  const isWeekendActive = isValidSabado();

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      const isNavKey = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key);
      
      if (isNavKey && (active === document.body || !active || active.tagName === "DIV")) {
        // Nada importante focado, vamos focar no primeiro card ou link da nav
        const firstFocusable = document.querySelector('.nav-link-item, [tabindex="0"]') as HTMLElement;
        if (firstFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pb-20">
        <HeroBanner />
        <div className="relative z-10 pt-12 -mt-10 flex flex-col gap-4">
          <ContinueWatchingRow />

          {/* Lançamentos & Novidades (2025/2026) */}
          <DynamicCategoryRow 
            title="Lançamentos & Novidades" 
            items={getUniqueItems(allItems)} 
            filterFn={(item) => Number(item.year) >= 2025} 
          />

          {/* Sábado à noite merece (Conditional) */}
          {isWeekendActive && (
             <DynamicCategoryRow 
               title="Sábado à noite merece" 
               items={getUniqueItems(allItems)} 
               filterFn={(item) => {
                 const g = item.genre.map(x => x.toLowerCase());
                 return g.includes("comédia") || g.includes("religioso") || g.includes("suspense") || g.includes("ação") || g.includes("action");
               }} 
               limit={5}
             />
          )}

          {/* Séries em Alta (Filtrando TV global se for canal) */}
          <TrendingGlobalRow title="Séries em Alta" type="tv" />

          {/* Negritude em Destaque */}
          <DynamicCategoryRow 
            title="Negritude em Destaque" 
            items={getUniqueItems(allItems)} 
            filterFn={(item) => item.genre.some(g => g.toLowerCase().includes("negritude"))} 
          />

          <TrendingGlobalRow title="Indicados ao Oscar 25/26" type="movie" />

          <DynamicCategoryRow 
            title="Cinema Nacional" 
            items={getUniqueItems(allItems)} 
            filterFn={(item) => item.genre.some(g => g.toLowerCase().includes("nacional"))} 
          />

          <DynamicCategoryRow 
            title="Animações para a Família" 
            items={getUniqueItems(allItems)} 
            filterFn={(item) => item.genre.some(g => g.toLowerCase().includes("animação") || g.toLowerCase().includes("animation"))} 
          />

          <DynamicCategoryRow 
            title="Romances para se inspirar" 
            items={getUniqueItems(allItems)} 
            filterFn={(item) => item.genre.some(g => g.toLowerCase().includes("romance"))} 
          />

          <Top5StreamingRow title="Top 5 Netflix" providerId={8} />
          <Top5StreamingRow title="Top 5 Prime Vídeo" providerId={119} />
          <Top5StreamingRow title="Top 5 Globoplay" providerId={307} />
          <Top5StreamingRow title="Top 5 Disney+" providerId={337} />
          <Top5StreamingRow title="Top 5 Max" providerId={384} />
          <Top5StreamingRow title="Top 5 Paramount+" providerId={531} />

          {/* Contador de Conteúdo - Apenas para Admin */}
          <ContentCounter />

          {isLoading && (
            <div className="flex justify-center p-10 text-white/50">Carregando catálogo completo...</div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
