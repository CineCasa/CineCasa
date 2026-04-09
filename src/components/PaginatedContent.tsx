import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePaginatedContent } from '@/hooks/usePaginatedContent';

interface PaginatedContentProps {
  // Configuração da query
  table: string;
  select?: string;
  filters?: Record<string, any>;
  orderBy?: { column: string; ascending?: boolean };
  initialPageSize?: number;
  
  // Renderização
  renderItem: (item: any, index: number) => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
  renderLoading?: () => React.ReactNode;
  renderError?: (error: any) => React.ReactNode;
  
  // Opções de UI
  showPagination?: boolean;
  showPageSizeSelector?: boolean;
  pageSizeOptions?: number[];
  
  // Scroll infinito
  infiniteScroll?: boolean;
  scrollThreshold?: number;
  
  // Estilo
  className?: string;
  itemClassName?: string;
  gridClassName?: string;
}

export function PaginatedContent({
  table,
  select = '*',
  filters = {},
  orderBy,
  initialPageSize = 20,
  renderItem,
  renderEmpty,
  renderLoading,
  renderError,
  showPagination = true,
  showPageSizeSelector = true,
  pageSizeOptions = [10, 20, 50, 100],
  infiniteScroll = false,
  scrollThreshold = 100,
  className,
  itemClassName,
  gridClassName,
}: PaginatedContentProps) {
  const [isClient, setIsClient] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  const {
    data,
    isLoading,
    isError,
    error,
    hasNextPage,
    hasPreviousPage,
    currentPage,
    pageSize,
    totalCount,
    fetchNextPage,
    fetchPreviousPage,
    goToPage,
    resetPagination,
  } = usePaginatedContent({
    table,
    select,
    filters,
    orderBy,
    initialPageSize,
  });

  // Scroll infinito
  useEffect(() => {
    if (!infiniteScroll || !scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const loading = loadingRef.current;

    const handleScroll = () => {
      if (!container || !loading) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

      // Carregar mais quando faltar 100px do final
      if (scrollPercentage > 0.9 && hasNextPage && !isLoading) {
        fetchNextPage();
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [infiniteScroll, hasNextPage, isLoading, fetchNextPage]);

  // Detectar se é client-side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Renderização condicional
  if (!isClient) {
    return <div className="animate-pulse">Carregando...</div>;
  }

  if (isError && renderError) {
    return renderError(error);
  }

  if (isLoading && data.length === 0 && renderLoading) {
    return renderLoading();
  }

  if (data.length === 0 && renderEmpty) {
    return renderEmpty();
  }

  // Calcular informações de paginação
  const totalPages = Math.ceil(totalCount / pageSize);
  const startItem = currentPage * pageSize + 1;
  const endItem = Math.min((currentPage + 1) * pageSize, totalCount);

  return (
    <div className={cn('w-full', className)}>
      {/* Header com informações */}
      <div className="flex items-center justify-between mb-4 px-4">
        <div className="text-sm text-gray-400">
          Mostrando {startItem}-{endItem} de {totalCount} itens
        </div>
        
        {/* Seletor de tamanho de página */}
        {showPageSizeSelector && !infiniteScroll && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Itens por página:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                // Resetar para primeira página com novo tamanho
                goToPage(0);
                // Atualizar pageSize (isso vai triggerar nova query)
                window.location.search = `?pageSize=${newSize}`;
              }}
              className="bg-gray-800 text-white px-2 py-1 rounded text-sm"
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Container de conteúdo com scroll */}
      <div
        ref={scrollContainerRef}
        className={cn(
          infiniteScroll ? 'overflow-y-auto max-h-[600px]' : '',
          gridClassName || 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'
        )}
      >
        {data.map((item, index) => (
          <div
            key={item.id || index}
            className={cn('transition-all duration-200', itemClassName)}
            style={{
              animationDelay: infiniteScroll ? `${index * 50}ms` : '0ms',
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>

      {/* Loading indicator para scroll infinito */}
      {infiniteScroll && isLoading && (
        <div
          ref={loadingRef}
          className="flex justify-center py-4"
        >
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {/* Paginação tradicional */}
      {showPagination && !infiniteScroll && (
        <div className="flex items-center justify-between mt-6 px-4">
          <div className="flex items-center gap-2">
            {/* Botão anterior */}
            <button
              onClick={fetchPreviousPage}
              disabled={!hasPreviousPage}
              className={cn(
                'flex items-center gap-1 px-3 py-2 rounded transition-colors',
                hasPreviousPage
                  ? 'bg-gray-800 hover:bg-gray-700 text-white'
                  : 'bg-gray-900 text-gray-600 cursor-not-allowed'
              )}
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>

            {/* Números de página */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i;
                } else {
                  // Lógica inteligente para mostrar páginas relevantes
                  if (currentPage <= 2) {
                    pageNum = i;
                  } else if (currentPage >= totalPages - 3) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                }

                const isActive = pageNum === currentPage;
                const isCurrent = pageNum === currentPage;

                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={cn(
                      'w-8 h-8 rounded text-sm transition-colors',
                      isCurrent
                        ? 'bg-primary text-white'
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    )}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}
            </div>

            {/* Botão próximo */}
            <button
              onClick={fetchNextPage}
              disabled={!hasNextPage}
              className={cn(
                'flex items-center gap-1 px-3 py-2 rounded transition-colors',
                hasNextPage
                  ? 'bg-gray-800 hover:bg-gray-700 text-white'
                  : 'bg-gray-900 text-gray-600 cursor-not-allowed'
              )}
            >
              Próximo
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Informações da página */}
          <div className="text-sm text-gray-400">
            Página {currentPage + 1} de {totalPages}
          </div>
        </div>
      )}

      {/* Botão de reset */}
      {(currentPage > 0 || pageSize !== initialPageSize) && (
        <div className="flex justify-center mt-4">
          <button
            onClick={resetPagination}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded text-sm transition-colors"
          >
            Resetar Paginação
          </button>
        </div>
      )}
    </div>
  );
}

// Componente simplificado para grid de conteúdo
export function ContentGrid({
  items,
  renderItem,
  loading = false,
  className,
  itemClassName,
  gridClassName = 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4',
}: {
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  loading?: boolean;
  className?: string;
  itemClassName?: string;
  gridClassName?: string;
}) {
  return (
    <div className={cn('w-full', className)}>
      <div className={cn(gridClassName)}>
        {items.map((item, index) => (
          <div
            key={item.id || index}
            className={cn('transition-all duration-200', itemClassName)}
          >
            {renderItem(item, index)}
          </div>
        ))}
        
        {loading && (
          <div className="col-span-full flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
      </div>
    </div>
  );
}
