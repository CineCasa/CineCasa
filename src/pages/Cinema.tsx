import PremiumNavbar from "@/components/PremiumNavbar";
import HeroBanner from "@/components/HeroBanner";
import ContentRow from "@/components/ContentRow";
import { useSupabaseContent } from "@/hooks/useSupabaseContent";

const Cinema = () => {
  const { data: categories, isLoading } = useSupabaseContent();

  // Filtra apenas categorias que começam com "cinema-" (definido no hook)
  // As categorias agora seguem o padrão centralizado do hook
  const cinemaCategories = categories?.filter(cat => cat.id.startsWith("cinema-")) || [];

  return (
    <div className="min-h-screen bg-background">
      <PremiumNavbar />
      <main className="pb-20">
        <HeroBanner filterCategory="Cinema" />
        <div className="relative pt-16 -mt-10 pointer-events-none">
          {isLoading ? (
            <div className="flex items-center justify-center p-20 text-muted-foreground">
              Carregando produções de cinema...
            </div>
          ) : (
            cinemaCategories.map((cat) => (
              <div key={cat.id} className="pointer-events-auto">
                <ContentRow category={cat} />
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Cinema;
