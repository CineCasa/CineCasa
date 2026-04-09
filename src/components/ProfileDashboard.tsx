import React, { useState } from 'react';
import { User, Settings, Trophy, Clock, BarChart3, Star, Heart, Play, Eye, Users, Crown, Shield, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Button } from '@/components/ui';
import { ProfileSwitcher } from './ProfileSwitcher';
import { PersonalizedRecommendations } from './PersonalizedRecommendations';
import { WatchHistory } from './WatchHistory';
import { AvatarCustomizer } from './AvatarCustomizer';
import { useProfileSwitching } from '@/hooks/useProfileSwitching';
import { usePersonalizedRecommendations } from '@/hooks/usePersonalizedRecommendations';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import { cn } from '@/lib/utils';

interface ProfileDashboardProps {
  userId?: string;
  className?: string;
}

export function ProfileDashboard({ userId, className }: ProfileDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'recommendations' | 'history' | 'customization' | 'settings'>('overview');
  const [showProfileSwitcher, setShowProfileSwitcher] = useState(false);

  const {
    profiles,
    activeProfile,
    stats: profileStats,
    switchToProfile,
    createProfile,
    updateProfile,
  } = useProfileSwitching({ userId });

  const {
    recommendations,
    stats: recommendationStats,
    hasRecommendations,
  } = usePersonalizedRecommendations({ userId });

  const {
    history,
    stats: historyStats,
    hasHistory,
  } = useWatchHistory({ userId });

  const handleProfileSelect = (profile: any) => {
    switchToProfile(profile.id);
    setShowProfileSwitcher(false);
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card variant="elevated" className="p-6">
        <div className="flex items-center gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              {activeProfile?.avatar_url ? (
                <img
                  src={activeProfile.avatar_url}
                  alt={activeProfile.name}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <User className="w-12 h-12 text-white" />
              )}
            </div>
            
            {/* Status badges */}
            <div className="absolute -bottom-1 -right-1 flex gap-1">
              <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900"></div>
              {activeProfile?.is_kid && (
                <div className="w-4 h-4 bg-yellow-500 rounded-full border-2 border-gray-900 flex items-center justify-center">
                  <Crown className="w-2 h-2 text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-white">{activeProfile?.name || 'Perfil'}</h2>
              {activeProfile?.is_kid && (
                <Badge variant="secondary">
                  <Crown className="w-3 h-3 mr-1" />
                  Infantil
                </Badge>
              )}
            </div>
            
            <div className="text-gray-400 mb-4">
              Membro desde {new Date(activeProfile?.created_at || '').toLocaleDateString('pt-BR')}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-2xl font-bold text-white">
                  {formatTime(historyStats.totalWatchTime)}
                </div>
                <div className="text-sm text-gray-400">Tempo assistido</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {historyStats.totalItemsWatched}
                </div>
                <div className="text-sm text-gray-400">Itens assistidos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {recommendationStats.total}
                </div>
                <div className="text-sm text-gray-400">Recomendações</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {historyStats.averageRating.toFixed(1)}
                </div>
                <div className="text-sm text-gray-400">Avaliação média</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={() => setShowProfileSwitcher(true)}
              className="text-gray-400 border-gray-700"
            >
              <Users className="w-4 h-4 mr-2" />
              Trocar Perfil
            </Button>
            <Button
              variant="primary"
              onClick={() => setActiveTab('customization')}
            >
              <Settings className="w-4 h-4 mr-2" />
              Personalizar
            </Button>
          </div>
        </div>
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="default" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Play className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{historyStats.totalItemsWatched}</div>
              <div className="text-sm text-gray-400">Filmes/Séries</div>
            </div>
          </div>
        </Card>

        <Card variant="default" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{formatTime(historyStats.totalWatchTime)}</div>
              <div className="text-sm text-gray-400">Tempo total</div>
            </div>
          </div>
        </Card>

        <Card variant="default" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{historyStats.averageRating.toFixed(1)}</div>
              <div className="text-sm text-gray-400">Avaliação média</div>
            </div>
          </div>
        </Card>

        <Card variant="default" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">12</div>
              <div className="text-sm text-gray-400">Conquistas</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Continue Watching */}
        <Card variant="default" className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Continuar Assistindo</h3>
            <Button variant="ghost" size="sm" className="text-gray-400">
              Ver todos
            </Button>
          </div>
          
          <div className="space-y-3">
            {history.slice(0, 3).map((item: any) => (
              <div key={item.id} className="flex items-center gap-3">
                <img
                  src={item.coverImage || '/placeholder-movie.jpg'}
                  alt={item.title}
                  className="w-12 h-12 object-cover rounded-lg"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium line-clamp-1">{item.title}</div>
                  <div className="text-sm text-gray-400">
                    {Math.round(item.progress)}% • {formatTime(item.current_time)}
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-gray-400">
                  <Play className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Recommendations */}
        <Card variant="default" className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Recomendados para Você</h3>
            <Button variant="ghost" size="sm" className="text-gray-400">
              Ver todos
            </Button>
          </div>
          
          <div className="space-y-3">
            {recommendations.slice(0, 3).map((item: any) => (
              <div key={item.id} className="flex items-center gap-3">
                <img
                  src={item.coverImage || '/placeholder-movie.jpg'}
                  alt={item.title}
                  className="w-12 h-12 object-cover rounded-lg"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium line-clamp-1">{item.title}</div>
                  <div className="text-sm text-gray-400">
                    {item.reasons?.[0] || 'Recomendado para você'}
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-gray-400">
                  <Heart className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Account Stats */}
      <Card variant="default" className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-white">Estatísticas da Conta</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-gray-400 mb-2">Uso por Perfil</div>
            <div className="space-y-2">
              {profiles.slice(0, 3).map((profile: any) => (
                <div key={profile.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-700"></div>
                    <span className="text-sm text-gray-300">{profile.name}</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    {formatTime(profile.watch_time_minutes || 0)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-400 mb-2">Gêneros Favoritos</div>
            <div className="flex flex-wrap gap-2">
              {historyStats.topGenres.slice(0, 5).map((genre: any) => (
                <Badge key={genre.genre} variant="secondary" size="sm">
                  {genre.genre} ({genre.count})
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-400 mb-2">Padrões de Visualização</div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Melhor dia:</span>
                <span className="text-gray-300">{historyStats.watchingPatterns.bestDay}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Melhor horário:</span>
                <span className="text-gray-300">{historyStats.watchingPatterns.bestTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Média diária:</span>
                <span className="text-gray-300">{formatTime(historyStats.watchingPatterns.averageDailyTime)}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'recommendations':
        return (
          <PersonalizedRecommendations
            userId={userId}
            profileId={activeProfile?.id}
            onItemSelect={(item) => console.log('Selected:', item)}
          />
        );
      case 'history':
        return (
          <WatchHistory
            userId={userId}
            profileId={activeProfile?.id}
            onItemSelect={(item) => console.log('Selected:', item)}
          />
        );
      case 'customization':
        return (
          <AvatarCustomizer
            userId={userId}
            profileId={activeProfile?.id}
            onSave={(customization) => console.log('Saved:', customization)}
          />
        );
      case 'settings':
        return (
          <Card variant="default" className="p-8 text-center">
            <Settings className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">
              Configurações em Desenvolvimento
            </h3>
            <p className="text-gray-500 text-sm">
              As configurações do perfil estarão disponíveis em breve.
            </p>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Meu Perfil</h1>
          <p className="text-gray-400 mt-1">
            Gerencie seu perfil, preferências e histórico
          </p>
        </div>
        
        {/* Profile Switcher */}
        <ProfileSwitcher
          userId={userId}
          onProfileSelect={handleProfileSelect}
          showCreateButton={true}
          showManageButton={true}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-gray-800">
        {[
          { id: 'overview', label: 'Visão Geral', icon: User },
          { id: 'recommendations', label: 'Recomendações', icon: Star },
          { id: 'history', label: 'Histórico', icon: Clock },
          { id: 'customization', label: 'Avatar', icon: Shield },
          { id: 'settings', label: 'Configurações', icon: Settings },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 border-b-2 transition-colors',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            )}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Profile Switcher Modal */}
      {showProfileSwitcher && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Selecionar Perfil</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowProfileSwitcher(false)}
                className="text-gray-400"
              >
                ✕
              </Button>
            </div>
            
            <ProfileSwitcher
              userId={userId}
              onProfileSelect={handleProfileSelect}
              showCreateButton={true}
              showManageButton={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}
