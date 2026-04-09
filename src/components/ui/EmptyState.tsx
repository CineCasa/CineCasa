import React from 'react';
import { cva } from '@/lib/cva';
import { cn } from '@/lib/utils';
import { 
  Film, 
  Search, 
  RefreshCw, 
  Plus, 
  AlertCircle,
  Wifi,
  WifiOff,
  Database
} from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  variant?: 'default' | 'minimal' | 'illustrated';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const emptyStateVariants = cva(
  'flex flex-col items-center justify-center text-center p-8',
  {
    variant: {
      default: 'text-gray-400',
      minimal: 'text-gray-500',
      illustrated: 'text-gray-400',
    },
    size: {
      sm: 'p-4',
      md: 'p-8',
      lg: 'p-12',
    },
  },
);

export function EmptyState({
  icon,
  title,
  description,
  actions,
  variant = 'default',
  size = 'md',
  className,
}: EmptyStateProps) {
  const iconSize = {
    sm: 32,
    md: 48,
    lg: 64,
  };

  const textSize = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const descriptionSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={cn(emptyStateVariants({ variant, size }), className)}>
      {/* Ícone */}
      {icon && (
        <div className="mb-4 flex items-center justify-center">
          <div 
            className="text-gray-600"
            style={{ fontSize: `${iconSize[size]}px` }}
          >
            {icon}
          </div>
        </div>
      )}

      {/* Título */}
      <h3 className={cn('font-semibold mb-2', textSize[size])}>
        {title}
      </h3>

      {/* Descrição */}
      {description && (
        <p className={cn('mb-6 max-w-md', descriptionSize[size])}>
          {description}
        </p>
      )}

      {/* Ações */}
      {actions && (
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
          {actions}
        </div>
      )}
    </div>
  );
}

// Empty States específicos para diferentes contextos
export function EmptyMovies({ onAddMovie }: { onAddMovie?: () => void }) {
  return (
    <EmptyState
      icon={<Film />}
      title="Nenhum filme encontrado"
      description="Parece que ainda não há filmes na sua biblioteca. Adicione alguns para começar!"
      actions={
        <button
          onClick={onAddMovie}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Filme
        </button>
      }
    />
  );
}

export function EmptySeries({ onAddSeries }: { onAddSeries?: () => void }) {
  return (
    <EmptyState
      icon={<Film />}
      title="Nenhuma série encontrada"
      description="Sua biblioteca de séries está vazia. Comece adicionando suas séries favoritas!"
      actions={
        <button
          onClick={onAddSeries}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Série
        </button>
      }
    />
  );
}

export function EmptySearch({ query, onClear }: { query: string; onClear?: () => void }) {
  return (
    <EmptyState
      icon={<Search />}
      title={`Nenhum resultado para "${query}"`}
      description="Tente usar termos diferentes ou verificar a ortografia."
      actions={
        <button
          onClick={onClear}
          className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Limpar Busca
        </button>
      }
    />
  );
}

export function EmptyFavorites({ onBrowse }: { onBrowse?: () => void }) {
  return (
    <EmptyState
      icon={<AlertCircle />}
      title="Nenhum favorito"
      description="Você ainda não adicionou nenhum filme ou série aos favoritos. Explore nosso catálogo e adicione seus favoritos!"
      actions={
        <button
          onClick={onBrowse}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Search className="w-4 h-4 mr-2" />
          Explorar Catálogo
        </button>
      }
    />
  );
}

export function EmptyOffline({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      icon={<WifiOff />}
      title="Sem conexão com a internet"
      description="Verifique sua conexão e tente novamente para acessar o conteúdo."
      actions={
        <button
          onClick={onRetry}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Tentar Novamente
        </button>
      }
    />
  );
}

export function EmptyNetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      icon={<Wifi />}
      title="Erro de conexão"
      description="Não foi possível conectar ao servidor. Verifique sua conexão com a internet."
      actions={
        <div className="flex gap-3">
          <button
            onClick={onRetry}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar Novamente
          </button>
          <button
            onClick={() => window.location.reload()}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Recarregar Página
          </button>
        </div>
      }
    />
  );
}

// Empty State minimal para espaços pequenos
export function EmptyMinimal({ 
  title, 
  description 
}: { 
  title: string;
  description?: string;
}) {
  return (
    <EmptyState
      variant="minimal"
      size="sm"
      title={title}
      description={description}
    />
  );
}
