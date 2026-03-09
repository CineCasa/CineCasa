import { useState, useEffect } from "react";
import ContentRow from "./ContentRow";
import { fetchTmdbDiscoverWatchProvider, tmdbImageUrl } from "@/services/tmdb";
import { useSupabaseContent } from "@/hooks/useSupabaseContent";
import { ContentItem } from "@/data/content";

interface Top5StreamingRowProps {
  title: string;
  providerId: number; 
  // Netflix = 8 (for Br), Prime = 119, Disney = 337, HBO = 384, Globoplay = 307, Paramount = 531
}

const CACHE_KEY_PREFIX = "cinecasa_top5_";
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

const Top5StreamingRow = ({ title, providerId }: Top5StreamingRowProps) => {
  const [items, setItems] = useState<ContentItem[]>([]);
  const { data: categories } = useSupabaseContent();

  useEffect(() => {
    const fetchTop5 = async () => {
      const cacheKey = `${CACHE_KEY_PREFIX}${providerId}`;
      const cached = localStorage.getItem(cacheKey);
      let results = [];

      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_DURATION) {
          results = parsed.data;
        }
      }

      if (results.length === 0) {
        const res = await fetchTmdbDiscoverWatchProvider(providerId);
        if (res && res.results) {
          results = res.results.slice(0, 5);
          localStorage.setItem(cacheKey, JSON.stringify({
            timestamp: Date.now(),
            data: results
          }));
        }
      }

      if (results.length > 0) {
        // Flatten Supabase categories to cross-reference
        const allLocalItems = categories?.flatMap(c => c.items) || [];
        
        const mappedItems: ContentItem[] = results.map((r: any) => {
          // Check if we have this item in our DB
          const isAvailableLocal = allLocalItems.some(
            local => local.title?.toLowerCase() === r.name?.toLowerCase() || local.title?.toLowerCase() === r.title?.toLowerCase()
          );

          return {
            id: `top5-${providerId}-${r.id}`,
            tmdbId: r.id,
            title: r.name || r.title,
            image: tmdbImageUrl(r.poster_path, "w500"),
            backdrop: tmdbImageUrl(r.backdrop_path, "original"),
             // Injecting the "Coming Soon" badge metadata if not strictly found locally
            rating: isAvailableLocal ? r.vote_average?.toFixed(1) : "Em Breve",
            year: parseInt((r.first_air_date || r.release_date || "2024").split("-")[0]),
            duration: "",
            genre: ["Top 5", title],
            description: r.overview,
            type: r.title ? "movie" : "series",
            isComingSoon: !isAvailableLocal
          };
        });

        setItems(mappedItems);
      }
    };

    fetchTop5();
  }, [providerId, title, categories]);

  if (items.length === 0) return null;

  return (
    <div className="relative group/top5">
      <ContentRow category={{ id: `top5-${providerId}`, title, items }} />
    </div>
  );
};

export default Top5StreamingRow;
