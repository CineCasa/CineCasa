import React from 'react';

interface SkeletonCardProps {
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ className = '' }) => {
  return (
    <div className={`relative aspect-[2/3] rounded-xl bg-white/5 overflow-hidden ${className}`}>
      {/* Skeleton shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
    </div>
  );
};

export const SkeletonRow: React.FC<{ count?: number; title?: boolean }> = ({ 
  count = 6, 
  title = true 
}) => {
  return (
    <div className="mb-8">
      {title && (
        <div className="h-6 w-48 bg-white/10 rounded mb-4 animate-pulse" />
      )}
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-[160px]">
            <SkeletonCard />
          </div>
        ))}
      </div>
    </div>
  );
};

export const SkeletonHero: React.FC = () => {
  return (
    <div className="relative w-full h-[70vh] bg-black overflow-hidden">
      {/* Background gradient placeholder */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
      
      {/* Content placeholder */}
      <div className="absolute bottom-0 left-0 right-0 p-8 space-y-4">
        <div className="h-8 w-3/4 bg-white/10 rounded animate-pulse" />
        <div className="h-4 w-1/2 bg-white/10 rounded animate-pulse" />
        <div className="flex gap-4 mt-4">
          <div className="h-10 w-32 bg-white/10 rounded animate-pulse" />
          <div className="h-10 w-32 bg-white/10 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
