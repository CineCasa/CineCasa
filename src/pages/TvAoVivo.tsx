import ContentRow from "@/components/ContentRow";
import { useSupabaseContent } from "@/hooks/useSupabaseContent";

const TvAoVivo = () => {
  const { data: categories, isLoading } = useSupabaseContent();

  const tvCategories = categories?.filter(cat => cat.id === "tv-live") || [];

  return (
    <main className="min-h-screen bg-background pt-24 px-4 md:px-8 lg:px-12">
        <h1 className="text-3xl md:text-4xl font-black mb-8">TV ao Vivo</h1>
        <div>
          {isLoading ? (
            <div className="flex items-center justify-center p-20 text-muted-foreground">
              Sintonizando canais...
            </div>
          ) : (
            tvCategories.map((cat) => (
              <ContentRow key={cat.id} category={cat} />
            ))
          )}
        </div>
      </main>
  );
};

export default TvAoVivo;
