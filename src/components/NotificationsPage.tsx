import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Film, Tv, Clock, RefreshCw, Play, Star, Calendar, X, Settings, CreditCard, AlertTriangle, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { usePlayer } from '@/contexts/PlayerContext';
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
  trailer?: string;
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
  const { openPlayer } = usePlayer();
  
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
        .select('id, titulo, poster, year, category, genero, created_at, tmdb_id, rating, description, trailer')
        .gte('created_at', cutoffDate)
        .order('created_at', { ascending: false });

      if (moviesError) {
        console.error('[NotificationsPage] Erro ao buscar filmes:', moviesError);
      }

      // Buscar séries recentes (últimos 50 cadastrados - ordenar por id_n descendente para pegar mais recentes)
      const { data: series, error: seriesError } = await supabase
        .from('series')
        .select('id_n, titulo, banner, capa, ano, genero, tmdb_id, descricao, trailer')
        .order('id_n', { ascending: false })
        .limit(50);

      console.log('[NotificationsPage] Séries encontradas (últimos 50 por ID):', series?.length || 0, series);

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
        trailer: item.trailer,
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
        trailer: item.trailer,
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

  // Helper to convert YouTube URL to embed format
  const getYoutubeEmbedUrl = (url: string): { url: string; valid: boolean; error?: string } => {
    if (!url) return { url: '', valid: false, error: 'URL do trailer não fornecida' };
    // Check if it's a search results URL (invalid for embedding)
    if (url.includes('youtube.com/results')) {
      return { url: '', valid: false, error: 'URL do trailer é uma página de busca. Configure a URL direta do vídeo no banco de dados.' };
    }
    // If already embed format, return as is
    if (url.includes('youtube.com/embed/')) {
      return { url, valid: true };
    }
    // Extract video ID from various YouTube URL formats
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/v\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return { url: `https://www.youtube.com/embed/${match[1]}`, valid: true };
    }
    return { url: '', valid: false, error: 'Formato de URL do trailer não reconhecido' };
  };

  // Verificar se conteúdo tem menos de 24h
  const isWithin24Hours = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    return diffInHours < 24;
  };

  // Filtrar conteúdo: filmes apenas últimas 24h, séries dos últimos 50 cadastrados
  const recentContent = content.filter(item => {
    if (item.type === 'series') {
      // Séries: mostrar todas as 50 mais recentes do banco
      return true;
    }
    // Filmes: apenas últimas 24h
    return isWithin24Hours(item.created_at);
  });

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
        
        {/* Lista de Conteúdo - Cards horizontais */}
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
          <div className="space-y-4">
            {(selectedCategory 
              ? recentContent.filter(item => (item.category || item.genero) === selectedCategory)
              : recentContent
            ).map((item) => (
              <div
                key={item.id}
                onClick={() => handlePlay(item)}
                className="group flex flex-row bg-[#0f172a]/80 backdrop-blur-md rounded-xl overflow-hidden border border-white/10 transition-all duration-300 hover:border-[#00E5FF]/50 hover:shadow-[0_0_20px_rgba(0,229,255,0.2)] cursor-pointer"
              >
                {/* Poster - Lado Esquerdo */}
                <div className="relative w-[100px] sm:w-[140px] md:w-[160px] lg:w-[180px] flex-shrink-0 aspect-[2/3]">
                  {item.poster ? (
                    <img
                      src={item.poster}
                      alt={item.title}
                      className="w-full h-full object-cover object-top"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                      {item.type === 'movie' ? (
                        <Film className="w-10 h-10 sm:w-12 sm:h-12 text-gray-600" />
                      ) : (
                        <Tv className="w-10 h-10 sm:w-12 sm:h-12 text-gray-600" />
                      )}
                    </div>
                  )}
                  {/* Badge de tempo sobre o poster */}
                  <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md px-2 py-1 rounded-lg text-xs text-white flex items-center gap-1 border border-white/10">
                    <Clock className="w-3 h-3 text-[#00E5FF]" />
                    {formatTimeAgo(item.created_at)}
                  </div>
                </div>

                {/* Conteúdo - Lado Direito */}
                <div className="flex-1 p-2 sm:p-4 md:p-5 flex flex-col justify-between min-w-0">
                  <div className="min-w-0">
                    {/* Badge de tipo */}
                    <div className="mb-1 sm:mb-2">
                      <span className={`
                        px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-xs font-medium border inline-block
                        ${item.type === 'movie'
                          ? 'bg-[#00E5FF]/20 text-[#00E5FF] border-[#00E5FF]/30'
                          : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                        }
                      `}>
                        {item.type === 'movie' ? 'Filme' : 'Série'}
                      </span>
                    </div>

                    {/* Título */}
                    <h3 className="text-sm sm:text-lg md:text-xl font-bold text-white mb-1 sm:mb-2 group-hover:text-[#00E5FF] transition-colors line-clamp-2">
                      {item.title}
                    </h3>

                    {/* Metadados: Rating, Ano, Categoria */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-3 text-xs sm:text-sm mb-1.5 sm:mb-3">
                      {item.rating && (
                        <span className="flex items-center gap-1 bg-yellow-500/20 text-yellow-400 px-1.5 sm:px-2 py-0.5 rounded-md font-semibold text-xs sm:text-sm">
                          <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="currentColor" />
                          <span>{item.rating}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-gray-400 text-xs sm:text-sm">
                        <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span>{item.year || 'N/A'}</span>
                      </span>
                      {(item.category || item.genero) && (
                        <span className="bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium truncate max-w-[100px] sm:max-w-[150px]">
                          {item.category || item.genero}
                        </span>
                      )}
                    </div>

                    {/* Descrição */}
                    <p className="text-gray-400 text-xs sm:text-sm line-clamp-1 sm:line-clamp-2 md:line-clamp-3 max-w-2xl">
                      {item.description || 'Sem descrição disponível.'}
                    </p>
                  </div>

                  {/* Botões de ação */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 sm:mt-4">
                    <button className={`
                      flex items-center gap-1.5 px-2 sm:px-4 py-1.5 sm:py-2 rounded-[20px] font-medium text-xs sm:text-sm
                      transition-all duration-300 hover:scale-105 flex-shrink-0
                      ${isLoggedIn
                        ? 'bg-[#00A8E1] text-white hover:bg-[#0095C8] shadow-[0_0_15px_rgba(0,168,225,0.5)]'
                        : 'bg-gray-600 text-gray-300'
                      }
                    `}>
                      <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill={isLoggedIn ? "currentColor" : "none"} />
                      <span className="hidden sm:inline">{isLoggedIn ? 'Assistir' : 'Login'}</span>
                      <span className="sm:hidden">Play</span>
                    </button>
                    {/* Botão Trailer Vermelho YouTube */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.trailer) {
                          const result = getYoutubeEmbedUrl(item.trailer);
                          console.log('[NotificationsPage] Trailer check:', { original: item.trailer, result });
                          if (!result.valid) {
                            toast.error(result.error || 'Trailer configurado incorretamente');
                            return;
                          }
                          openPlayer({
                            id: item.id,
                            title: `${item.title} - Trailer`,
                            type: item.type,
                            videoUrl: result.url,
                            poster: item.poster,
                            year: item.year
                          });
                        } else {
                          toast.error('Trailer não disponível para este título');
                        }
                      }}
                      className="flex items-center gap-1.5 px-2 sm:px-4 py-1.5 sm:py-2 rounded-[20px] font-medium text-xs sm:text-sm bg-[#FF0000] text-white hover:bg-[#CC0000] transition-all duration-300 hover:scale-105 shadow-lg shadow-red-500/30 flex-shrink-0"
                    >
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                      <span>Trailer</span>
                    </button>
                    <button className="p-1.5 sm:p-2 rounded-[20px] bg-white/10 hover:bg-white/20 text-white hover:text-[#00E5FF] transition-all duration-300 border border-cyan-500/30 hover:border-cyan-400/50 flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
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
