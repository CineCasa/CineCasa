import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Film, Tv, Clock, RefreshCw, Play, Star, Calendar, X, Settings, CreditCard, AlertTriangle, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { Card } from '@/components/ui';

interface ContentItem {
  id: string;
  title: string;
  type: 'movie' | 'series';
  poster?: string;
  year?: string;
  category?: string;
  genero?: string;
  created_at: string;
  tmdb_id?: number;
  rating?: string;
  description?: string;
}

interface AlertItem {
  id: string;
  type: 'system' | 'financial';
  title: string;
  message: string;
  severity?: 'warning' | 'danger';
  actionUrl?: string;
  actionLabel?: string;
  created_at: string;
}

interface UserSubscription {
  is_active: boolean | null;
  approved: boolean | null;
  plan: string | null;
  created_at: string | null;
}

export const NotificationsPage: React.FC = () => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const { session } = useAuth();
  const navigate = useNavigate();
  
  const isLoggedIn = !!session;
  const userId = session?.user?.id;

  // Buscar status da assinatura do usuário
  const fetchSubscriptionStatus = useCallback(async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_active, approved, plan, created_at')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('[NotificationsPage] Erro ao buscar assinatura:', error);
        return;
      }
      
      setSubscription(data as UserSubscription);
    } catch (err) {
      console.error('[NotificationsPage] Erro ao verificar assinatura:', err);
    }
  }, [userId]);

  // Gerar alertas baseados na assinatura
  const generateAlerts = useCallback(() => {
    const newAlerts: AlertItem[] = [];
    
    // Alerta de sistema (melhorias recentes)
    newAlerts.push({
      id: 'system-1',
      type: 'system',
      title: 'Atualizações do Sistema',
      message: 'Novas melhorias de performance e interface implementadas. O sistema agora carrega 40% mais rápido!',
      created_at: new Date().toISOString(),
    });
    
    // Alertas financeiros baseados no status da assinatura
    if (subscription) {
      const isExpired = !subscription.is_active || !subscription.approved;
      const createdAt = subscription.created_at ? new Date(subscription.created_at) : null;
      const daysSinceCreation = createdAt 
        ? Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      
      if (isExpired) {
        // Assinatura vencida - Card Vermelho Neon
        newAlerts.push({
          id: 'financial-expired',
          type: 'financial',
          title: 'Assinatura Vencida',
          message: 'Sua assinatura está vencida. Renove agora para continuar aproveitando todo o conteúdo.',
          severity: 'danger',
          actionUrl: '/payment',
          actionLabel: 'Renovar Agora',
          created_at: new Date().toISOString(),
        });
      } else if (daysSinceCreation >= 27) {
        // Assinatura vence em até 3 dias - Card Amarelo Neon
        const daysLeft = Math.max(0, 30 - daysSinceCreation);
        newAlerts.push({
          id: 'financial-warning',
          type: 'financial',
          title: 'Assinatura Próxima ao Vencimento',
          message: `Sua assinatura vence em ${daysLeft} dia${daysLeft === 1 ? '' : 's'}. Renove agora para evitar interrupção.`,
          severity: 'warning',
          actionUrl: '/payment',
          actionLabel: 'Renovar',
          created_at: new Date().toISOString(),
        });
      }
    }
    
    setAlerts(newAlerts);
  }, [subscription]);

  // Buscar conteúdo das últimas 24h
  const fetchRecentContent = useCallback(async () => {
    try {
      setIsLoading(true);
      const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      console.log(`[NotificationsPage] Buscando conteúdo desde: ${cutoffDate}`);

      // Buscar filmes das últimas 24h
      const { data: movies, error: moviesError } = await supabase
        .from('cinema')
        .select('id, titulo, poster, year, category, genero, created_at, tmdb_id, rating, description')
        .gte('created_at', cutoffDate)
        .order('created_at', { ascending: false });

      if (moviesError) {
        console.error('[NotificationsPage] Erro ao buscar filmes:', moviesError);
      }

      // Buscar séries das últimas 24h (se tiver created_at)
      const { data: series, error: seriesError } = await supabase
        .from('series')
        .select('id_n, titulo, banner, capa, ano, genero, tmdb_id, descricao, created_at')
        .gte('created_at', cutoffDate)
        .order('created_at', { ascending: false })
        .limit(20);

      if (seriesError) {
        console.error('[NotificationsPage] Erro ao buscar séries:', seriesError);
      }

      // Formatar filmes
      const formattedMovies: ContentItem[] = (movies || []).map((item: any) => ({
        id: item.id.toString(),
        title: item.titulo,
        type: 'movie' as const,
        poster: item.poster,
        year: item.year,
        category: item.category,
        genero: item.genero,
        created_at: item.created_at,
        tmdb_id: item.tmdb_id,
        rating: item.rating,
        description: item.description,
      }));

      // Formatar séries
      const formattedSeries: ContentItem[] = (series || []).map((item: any) => ({
        id: item.id_n?.toString() || item.id?.toString(),
        title: item.titulo,
        type: 'series' as const,
        poster: item.banner || item.capa,
        year: item.ano,
        category: item.genero,
        genero: item.genero,
        created_at: item.created_at || new Date().toISOString(),
        tmdb_id: item.tmdb_id,
        rating: undefined,
        description: item.descricao,
      }));

      const allContent = [...formattedMovies, ...formattedSeries];
      
      console.log(`[NotificationsPage] Total encontrado: ${allContent.length}`);
      
      setContent(allContent);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('[NotificationsPage] Erro:', err);
      toast.error('Erro ao carregar conteúdo recente');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Polling para atualização automática
  useEffect(() => {
    fetchRecentContent();
    fetchSubscriptionStatus();

    // Atualizar a cada 2 minutos
    const interval = setInterval(() => {
      fetchRecentContent();
      fetchSubscriptionStatus();
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchRecentContent, fetchSubscriptionStatus]);

  // Gerar alertas quando subscription mudar
  useEffect(() => {
    generateAlerts();
  }, [generateAlerts]);

  // Dispensar alerta
  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => [...prev, alertId]);
    toast.success('Alerta dispensado');
  };

  // Carregar alertas dispensados do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dismissedNotifications');
    if (saved) {
      setDismissedAlerts(JSON.parse(saved));
    }
  }, []);

  // Salvar alertas dispensados no localStorage
  useEffect(() => {
    localStorage.setItem('dismissedNotifications', JSON.stringify(dismissedAlerts));
  }, [dismissedAlerts]);

  // Extrair categorias únicas
  const categories = [...new Set(content.map(item => item.category || item.genero || 'Geral').filter(Boolean))];

  // Filtrar conteúdo por categoria
  const filteredContent = selectedCategory 
    ? content.filter(item => (item.category || item.genero) === selectedCategory)
    : content;

  // Agrupar por categoria
  const contentByCategory = filteredContent.reduce((acc, item) => {
    const cat = item.category || item.genero || 'Geral';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, ContentItem[]>);

  const handlePlay = (item: ContentItem) => {
    if (!isLoggedIn) {
      toast.error('Faça login para assistir', {
        description: 'Você precisa estar logado para acessar o conteúdo.',
        action: {
          label: 'Entrar',
          onClick: () => navigate('/'),
        },
      });
      return;
    }

    const path = item.type === 'movie' 
      ? `/details/cinema/${item.id}` 
      : `/details/series/${item.id}`;
    navigate(path);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Agora há pouco';
    if (diffInHours === 1) return 'Há 1 hora';
    if (diffInHours < 24) return `Há ${diffInHours} horas`;
    return `Há ${Math.floor(diffInHours / 24)} dias`;
  };

  // Verificar se conteúdo tem menos de 24h
  const isWithin24Hours = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    return diffInHours < 24;
  };

  // Filtrar apenas conteúdo das últimas 24h
  const recentContent = content.filter(item => isWithin24Hours(item.created_at));

  // Alertas visíveis (não dispensados)
  const visibleAlerts = alerts.filter(alert => !dismissedAlerts.includes(alert.id));

  return (
    <div className="min-h-screen bg-black text-white pt-14 sm:pt-[70px] md:pt-[94px]">
      {/* Header Minimalista */}
      <div className="bg-black/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-[#00E5FF]" />
              {/* Título Neon */}
              <h1 className="text-lg sm:text-2xl font-bold tracking-wider uppercase bg-gradient-to-r from-[#00E5FF] to-[#00B8D4] bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]">
                RECENTES (ÚLTIMAS 24H)
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {lastUpdated && (
                <span className="text-gray-400 text-xs sm:text-sm hidden md:inline">
                  Atualizado: {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              <button
                onClick={fetchRecentContent}
                className="p-1.5 sm:p-2 rounded-xl hover:bg-white/10 transition-all duration-300 border border-white/10 hover:border-[#00E5FF]/50"
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 text-[#00E5FF] ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        
        {/* Grid de Conteúdo - Capas dos filmes/séries recentes PRIMEIRO */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12 sm:py-16">
            <RefreshCw className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-[#00E5FF]" />
            <span className="ml-3 text-sm sm:text-base text-gray-400">Carregando conteúdo recente...</span>
          </div>
        ) : recentContent.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <div className="inline-flex p-4 rounded-full bg-white/5 mb-4">
              <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-gray-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-300 mb-2">
              Nenhuma novidade nas últimas 24h
            </h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Volte mais tarde para descobrir novos filmes e séries adicionados ao catálogo.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
            {(selectedCategory 
              ? recentContent.filter(item => (item.category || item.genero) === selectedCategory)
              : recentContent
            ).map((item) => (
              <Card
                key={item.id}
                variant="outlined"
                size="sm"
                interactive
                onClick={() => handlePlay(item)}
                className="relative overflow-hidden group rounded-xl border border-white/10 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-[0_0_20px_rgba(0,229,255,0.5)] hover:border-[#00E5FF] bg-black/40 backdrop-blur-sm"
              >
                <div className="aspect-[2/3] relative">
                  {item.poster ? (
                    <img
                      src={item.poster}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                      {item.type === 'movie' ? (
                        <Film className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600" />
                      ) : (
                        <Tv className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600" />
                      )}
                    </div>
                  )}
                  
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
                  
                  {/* Hover play button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <button className={`
                      w-14 h-14 rounded-full flex items-center justify-center
                      transition-all duration-300 hover:scale-110
                      ${isLoggedIn 
                        ? 'bg-[#00E5FF] shadow-[0_0_20px_rgba(0,229,255,0.6)]' 
                        : 'bg-gray-600'
                      }
                    `}>
                      {isLoggedIn ? (
                        <Play className="w-6 h-6 text-black ml-1" fill="currentColor" />
                      ) : (
                        <span className="text-xs text-white font-medium">Login</span>
                      )}
                    </button>
                  </div>

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {/* Badge de tempo */}
                    <div className="bg-black/70 backdrop-blur-md px-2 py-1 rounded-lg text-xs text-white flex items-center gap-1 border border-white/10">
                      <Clock className="w-3 h-3 text-[#00E5FF]" />
                      {formatTimeAgo(item.created_at)}
                    </div>
                    {/* Badge de tipo */}
                    <div className={`
                      px-2 py-1 rounded-lg text-xs font-medium border
                      ${item.type === 'movie' 
                        ? 'bg-[#00E5FF]/20 text-[#00E5FF] border-[#00E5FF]/30' 
                        : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                      }
                    `}>
                      {item.type === 'movie' ? 'Filme' : 'Série'}
                    </div>
                  </div>

                  {/* Badge de rating */}
                  {item.rating && (
                    <div className="absolute bottom-2 right-2 bg-green-500/90 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1 border border-green-400/30 shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                      <Star className="w-3 h-3" fill="currentColor" />
                      {item.rating}
                    </div>
                  )}
                </div>

                {/* Info section */}
                <div className="p-3 backdrop-blur-md bg-black/60 border-t border-white/5">
                  <h3 className="text-white text-sm font-semibold line-clamp-2 group-hover:text-[#00E5FF] transition-colors duration-300">
                    {item.title}
                  </h3>
                  {item.year && (
                    <p className="text-gray-400 text-xs flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" />
                      {item.year}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Seção de Alertas - ABAIXO das capas dos conteúdos */}
        {visibleAlerts.length > 0 && (
          <div className="mt-12 space-y-4">
            <h2 className="text-lg font-semibold text-white mb-4">Alertas do Sistema</h2>
            {visibleAlerts.map(alert => (
              <div
                key={alert.id}
                className={`
                  relative overflow-hidden rounded-2xl backdrop-blur-xl border p-4 sm:p-5
                  transition-all duration-300 hover:scale-[1.01]
                  ${alert.type === 'system' 
                    ? 'bg-gradient-to-r from-[#00E5FF]/10 to-[#00B8D4]/5 border-[#00E5FF]/30 shadow-[0_0_20px_rgba(0,229,255,0.2)]' 
                    : alert.severity === 'danger'
                      ? 'bg-gradient-to-r from-red-500/10 to-red-600/5 border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                      : 'bg-gradient-to-r from-yellow-500/10 to-amber-500/5 border-yellow-500/40 shadow-[0_0_20px_rgba(234,179,8,0.25)]'
                  }
                `}
              >
                {/* Ícone de fundo decorativo */}
                <div className="absolute right-0 top-0 p-6 opacity-10">
                  {alert.type === 'system' ? (
                    <Settings className="w-20 h-20 text-[#00E5FF]" />
                  ) : (
                    <CreditCard className="w-20 h-20 text-current" />
                  )}
                </div>

                <div className="relative flex items-start gap-4">
                  {/* Ícone */}
                  <div className={`
                    p-3 rounded-xl shrink-0
                    ${alert.type === 'system' 
                      ? 'bg-[#00E5FF]/20 text-[#00E5FF]' 
                      : alert.severity === 'danger'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }
                  `}>
                    {alert.type === 'system' ? (
                      <Settings className="w-6 h-6" />
                    ) : alert.severity === 'danger' ? (
                      <AlertTriangle className="w-6 h-6" />
                    ) : (
                      <Clock className="w-6 h-6" />
                    )}
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <h3 className={`
                      font-semibold text-base sm:text-lg mb-1
                      ${alert.type === 'system' 
                        ? 'text-[#00E5FF]' 
                        : alert.severity === 'danger'
                          ? 'text-red-400'
                          : 'text-yellow-400'
                      }
                    `}>
                      {alert.title}
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {alert.message}
                    </p>
                    
                    {/* Ação */}
                    {alert.actionUrl && (
                      <button
                        onClick={() => navigate(alert.actionUrl!)}
                        className={`
                          mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                          transition-all duration-300 hover:scale-105
                          ${alert.severity === 'danger'
                            ? 'bg-red-500 hover:bg-red-400 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                            : 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]'
                          }
                        `}
                      >
                        {alert.actionLabel}
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Botão Dispensar */}
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white shrink-0"
                    title="Dispensar alerta"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Brilho de borda */}
                <div className={`
                  absolute inset-0 rounded-2xl pointer-events-none
                  ${alert.type === 'system'
                    ? 'shadow-[inset_0_0_20px_rgba(0,229,255,0.1)]'
                    : alert.severity === 'danger'
                      ? 'shadow-[inset_0_0_20px_rgba(239,68,68,0.15)]'
                      : 'shadow-[inset_0_0_20px_rgba(234,179,8,0.12)]'
                  }
                `} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
