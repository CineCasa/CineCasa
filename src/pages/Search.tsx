import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import PremiumNavbar from "@/components/PremiumNavbar";
import ContentCard from "@/components/ContentCard";
import { useSupabaseContent } from "@/hooks/useSupabaseContent";
import { ContentItem } from "@/data/content";
import { motion, AnimatePresence } from "framer-motion";
import { Search as SearchIcon } from "lucide-react";

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const { data: categories, isLoading } = useSupabaseContent();

  const allItems = useMemo(() => {
    if (!categories) return [];
    const seen = new Set();
    const uniqueItems: ContentItem[] = [];
    
    categories.forEach(cat => {
      cat.items.forEach(item => {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          uniqueItems.push(item);
        }
      });
    });
    
    return uniqueItems;
  }, [categories]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return [];
    const lowQuery = query.toLowerCase();
    return allItems.filter(item => 
      item.title.toLowerCase().includes(lowQuery) || 
      item.genre.some(g => g.toLowerCase().includes(lowQuery)) ||
      item.description.toLowerCase().includes(lowQuery)
    );
  }, [allItems, query]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PremiumNavbar />
      <main className="pt-24 px-4 md:px-8 lg:px-12 pb-20">
        <div className="mb-10">
          <h1 className="text-2xl md:text-3xl font-bold text-white/60 mb-2">
            Resultados para: <span className="text-white">"{query}"</span>
          </h1>
          <p className="text-muted-foreground uppercase text-xs font-bold tracking-widest">
            {filteredItems.length} títulos encontrados
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-40 animate-pulse">
            <SearchIcon size={48} className="text-primary/20 mb-4" />
            <p className="text-white/40 font-medium">Buscando no catálogo...</p>
          </div>
        ) : filteredItems.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-4 gap-y-24 py-10"
          >
            <AnimatePresence>
              {filteredItems.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="relative"
                >
                  <ContentCard item={item} index={idx} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : query.trim() !== "" ? (
          <div className="flex flex-col items-center justify-center py-40 text-center">
            <div className="bg-white/5 p-8 rounded-full mb-6">
               <SearchIcon size={64} className="text-white/10" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Nenhum título encontrado</h2>
            <p className="text-white/50 max-w-md mx-auto">
              Infelizmente não encontramos nada para "{query}". Tente buscar por outros termos, gêneros ou atores.
            </p>
          </div>
        ) : (
           <div className="flex flex-col items-center justify-center py-40 text-center">
              <p className="text-white/40">Digite algo para começar sua busca.</p>
           </div>
        )}
      </main>
    </div>
  );
};

export default Search;
