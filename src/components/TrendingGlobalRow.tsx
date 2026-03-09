import { useState, useEffect } from "react";
import ContentRow from "./ContentRow";
import { fetchTmdbTrendingWeek, tmdbImageUrl } from "@/services/tmdb";
import { useSupabaseContent } from "@/hooks/useSupabaseContent";
import { ContentItem } from "@/data/content";

interface TrendingGlobalRowProps {
  title: string;
  type: "movie" | "tv";
}

const CACHE_KEY_PREFIX = "cinecasa_trending_";
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

const TrendingGlobalRow = ({ title, type }: TrendingGlobalRowProps) => {
  const [items, setItems] = useState<ContentItem[]>([]);
  const { data: categories } = useSupabaseContent();

  useEffect(() => {
    const fetchTrending = async () => {
      const cacheKey = `${CACHE_KEY_PREFIX}${type}`;
      const cached = localStorage.getItem(cacheKey);
      let results = [];

      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_DURATION) {
          results = parsed.data;
        }
      }

      if (results.length === 0) {
        const res = await fetchTmdbTrendingWeek(type);
        if (res && res.results) {
          results = res.results.slice(0, 5);
          localStorage.setItem(cacheKey, JSON.stringify({
            timestamp: Date.now(),
            data: results
          }));
        }
      }

      if (results.length > 0) {
        const allLocalItems = categories?.flatMap(c => c.items) || [];
        
        const mappedItems: ContentItem[] = results.map((r: any) => {
          const isAvailableLocal = allLocalItems.some(
            local => local.title?.toLowerCase() === r.name?.toLowerCase() || local.title?.toLowerCase() === r.title?.toLowerCase()
          );

          return {
            id: `trending-${type}-${r.id}`,
            tmdbId: r.id,
            title: r.name || r.title,
            image: tmdbImageUrl(r.poster_path, "w500"),
            backdrop: tmdbImageUrl(r.backdrop_path, "original"),
            rating: isAvailableLocal ? r.vote_average?.toFixed(1) : "Em Breve",
            year: parseInt((r.first_air_date || r.release_date || "2024").split("-")[0]),
            duration: "",
            genre: ["Em Alta", title],
            description: r.overview,
            type: r.title ? "movie" : "series",
            isComingSoon: !isAvailableLocal
          };
        });

        setItems(mappedItems);
      }
    };

    fetchTrending();
  }, [type, title, categories]);

  if (items.length === 0) return null;

  return (
    <div className="relative">
      <ContentRow category={{ id: `trending-${type}`, title, items }} />
    </div>
  );
};

export default TrendingGlobalRow;
