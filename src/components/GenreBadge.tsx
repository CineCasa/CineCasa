import React from 'react';
import { cn } from '@/lib/utils';

interface GenreBadgeProps {
  name: string;
  slug?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'filled';
  onClick?: () => void;
  className?: string;
}

const genreColors: Record<string, string> = {
  'ação': 'bg-red-500/20 text-red-400 border-red-500/30',
  'aventura': 'bg-green-500/20 text-green-400 border-green-500/30',
  'comédia': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'drama': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'terror': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'thriller': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  'romance': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  'ficção científica': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'fantasia': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  'animação': 'bg-orange-400/20 text-orange-300 border-orange-400/30',
  'documentário': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'crime': 'bg-red-600/20 text-red-500 border-red-600/30',
  'mistério': 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  'guerra': 'bg-stone-500/20 text-stone-400 border-stone-500/30',
  'história': 'bg-amber-600/20 text-amber-500 border-amber-600/30',
  'família': 'bg-teal-400/20 text-teal-300 border-teal-400/30',
  'musical': 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30',
  'faroeste': 'bg-orange-600/20 text-orange-500 border-orange-600/30',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

export const GenreBadge: React.FC<GenreBadgeProps> = ({
  name,
  size = 'sm',
  variant = 'default',
  onClick,
  className
}) => {
  const normalizedName = name.toLowerCase();
  const colorClass = genreColors[normalizedName] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  
  const baseClasses = cn(
    'inline-flex items-center rounded-full border font-medium transition-all duration-200',
    sizeClasses[size],
    colorClass,
    onClick && 'cursor-pointer hover:scale-105 active:scale-95',
    className
  );

  return (
    <span 
      className={baseClasses}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {name}
    </span>
  );
};

export default GenreBadge;
