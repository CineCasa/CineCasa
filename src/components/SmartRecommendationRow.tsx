import React, { useMemo } from 'react';
import { Sparkles, Brain, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSmartRecommendations } from '@/hooks/useSmartRecommendations';
import { ContentCard } from './ContentCard';
import { cn } from '@/lib/utils';

interface ContentItem {
  id: string | number;
  titulo?: string;
  title?: string;
  category?: string;
  genres?: string[];
  poster?: string;
  rating?: string | number;
  year?: string | number;
  description?: string;
  type?: 'movie' | 'series';
}

interface SmartRecommendationRowProps {
  content: ContentItem[];
  title?: string;
  userId?: string;
  contentType?: 'movie' | 'series';
  limit?: number;
  className?: string;
  showScores?: boolean;
}

export const SmartRecommendationRow: React.FC<SmartRecommendationRowProps> = ({
  content,
  title = 'Recomendados Para Você',
  contentType = 'movie',
  limit = 10,
  className,
  showScores = false
}) => {
  const { recommendations, isLoading, hasRecommendations } = useSmartRecommendations({
    content,
    contentType,
    limit,
    minScore: 0.5
  });

  const sortedContent = useMemo(() => {
    if (!hasRecommendations) return content.slice(0, limit);
    return recommendations.map(r => r.content);
  }, [recommendations, content, hasRecommendations, limit]);

  if (isLoading) {
    return (
      <div className={cn('py-6', className)}>
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-cyan-400 animate-pulse" />
          <div className="h-5 w-48 bg-gray-800 rounded animate-pulse" />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex-shrink-0 w-[160px] aspect-[2/3] bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (sortedContent.length === 0) {
    return null;
  }

  return (
    <div className={cn('py-6', className)}>
      <div className="flex items-center gap-2 mb-4 px-4">
        <Sparkles className="w-5 h-5 text-yellow-400" />
        <h2 className="text-lg font-semibold text-white">
          {title}
        </h2>
        {hasRecommendations && (
          <span className="text-xs text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-full">
            IA
          </span>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 px-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {sortedContent.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="flex-shrink-0 w-[160px]"
          >
            <ContentCard
              id={String(item.id)}
              title={item.titulo || item.title || 'Sem título'}
              image={item.poster || ''}
              year={String(item.year || '')}
              rating={String(item.rating || 'N/A')}
              category={item.category || 'Geral'}
              type={item.type || contentType}
            />
            
            {showScores && hasRecommendations && (
              <div className="mt-2 text-xs text-center">
                <span className="text-cyan-400">
                  Match: {Math.round((recommendations.find(r => r.content.id === item.id)?.score || 0) * 20)}%
                </span>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SmartRecommendationRow;
