import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, Plus, Edit, Trash2, Crown, User, Settings, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Button } from '@/components/ui';
import { useProfileSwitching } from '@/hooks/useProfileSwitching';
import { cn } from '@/lib/utils';

interface ProfileSwitcherProps {
  userId?: string;
  onProfileSelect?: (profile: any) => void;
  onManageProfiles?: () => void;
  showCreateButton?: boolean;
  showManageButton?: boolean;
  className?: string;
}

export function ProfileSwitcher({
  userId,
  onProfileSelect,
  onManageProfiles,
  showCreateButton = true,
  showManageButton = true,
  className,
}: ProfileSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [isKidProfile, setIsKidProfile] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  const {
    profiles,
    activeProfile,
    isSwitching,
    switchToProfile,
    createProfile,
    deleteProfile,
    createDefaultProfile,
    stats,
  } = useProfileSwitching({ userId });

  const handleCreateProfile = () => {
    if (newProfileName.trim()) {
      createProfile.mutate({
        name: newProfileName.trim(),
        is_kid: isKidProfile,
      });
      setNewProfileName('');
      setIsKidProfile(false);
      setShowCreateForm(false);
    }
  };

  const handleQuickCreateProfile = (isKid: boolean) => {
    createDefaultProfile(
      isKid ? 'Criança' : 'Novo Perfil',
      isKid
    );
  };

  const formatWatchTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  // Fecha dropdown ao clicar fora ou pressionar ESC
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node) &&
      buttonRef.current &&
      !buttonRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  }, []);

  const handleEscapeKey = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, handleClickOutside, handleEscapeKey]);

  // Força fechamento se isSwitching ficar preso por mais de 5 segundos
  useEffect(() => {
    if (isSwitching) {
      const timeout = setTimeout(() => {
        console.warn('[ProfileSwitcher] Forçando fechamento do loading após timeout');
        setIsOpen(false);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [isSwitching]);

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Profile ativo atual */}
      <div 
        ref={buttonRef}
        className="flex items-center gap-3 p-3 bg-gray-900 border border-gray-800 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors"
        onClick={() => !isSwitching && setIsOpen(!isOpen)}
      >
        <div className="relative">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
            {activeProfile?.avatar_url ? (
              <img
                src={activeProfile.avatar_url}
                alt={activeProfile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-5 h-5 text-white" />
            )}
          </div>
          
          {/* Badge de perfil ativo */}
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="text-white font-medium truncate">{activeProfile?.name || 'Perfil'}</div>
          <div className="text-xs text-gray-400">
            {activeProfile?.is_kid && (
              <Badge variant="secondary" size="xs" className="mr-2">
                <Crown className="w-3 h-3" />
                Infantil
              </Badge>
            )}
            {stats.totalWatchTime > 0 && (
              <span>{formatWatchTime(stats.totalWatchTime)} assistidos</span>
            )}
          </div>
        </div>
        
        <button
          className="p-1 hover:bg-gray-700 rounded transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            if (!isSwitching) setIsOpen(!isOpen);
          }}
        >
          {isOpen ? (
            <X className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown 
              className={cn(
                'w-4 h-4 text-gray-400 transition-transform',
                isOpen && 'rotate-180'
              )}
            />
          )}
        </button>
      </div>

      {/* Dropdown de perfis */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 w-80 bg-gray-900 border border-gray-800 rounded-lg shadow-xl z-50">
          {/* Header do dropdown */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <h3 className="text-white font-medium">Perfis</h3>
            <div className="flex gap-2">
              {showCreateButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateForm(true)}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              )}
              {showManageButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onManageProfiles}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Form de criação de perfil */}
          {showCreateForm && (
            <div className="p-4 border-b border-gray-800">
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Nome do perfil"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500"
                  maxLength={20}
                />
                
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={isKidProfile}
                      onChange={(e) => setIsKidProfile(e.target.checked)}
                      className="rounded"
                    />
                    Perfil infantil
                  </label>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewProfileName('');
                      setIsKidProfile(false);
                    }}
                    className="text-gray-400 border-gray-700"
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleCreateProfile}
                    disabled={!newProfileName.trim()}
                    className="disabled:opacity-50"
                  >
                    Criar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Lista de perfis */}
          <div className="max-h-96 overflow-y-auto">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className={cn(
                  'flex items-center gap-3 p-3 hover:bg-gray-800 cursor-pointer transition-colors',
                  profile.id === activeProfile?.id && 'bg-gray-800'
                )}
                onClick={() => {
                  switchToProfile(profile.id);
                  setIsOpen(false);
                  onProfileSelect?.(profile);
                }}
              >
                <div className="relative">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-gray-300" />
                    )}
                  </div>
                  
                  {profile.is_active && (
                    <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-gray-900"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-white font-medium truncate">{profile.name}</div>
                    {profile.is_kid && (
                      <Badge variant="secondary" size="xs">
                        <Crown className="w-3 h-3" />
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-400">
                    {profile.watch_time_minutes > 0 && (
                      <span>{formatWatchTime(profile.watch_time_minutes)}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Abrir modal de edição
                    }}
                    className="text-gray-400 hover:text-gray-300 p-1"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  
                  {profiles.length > 1 && !profile.is_active && (
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteProfile.mutate(profile.id);
                      }}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Quick create buttons */}
          {!showCreateForm && (
            <div className="p-4 border-t border-gray-800">
              <div className="text-sm text-gray-400 mb-3">Criar perfil rápido:</div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickCreateProfile(false)}
                  className="text-gray-300 border-gray-700 hover:text-white hover:border-gray-600"
                >
                  <User className="w-4 h-4 mr-2" />
                  Adulto
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickCreateProfile(true)}
                  className="text-gray-300 border-gray-700 hover:text-white hover:border-gray-600"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Criança
                </Button>
              </div>
            </div>
          )}

          {/* Estatísticas */}
          {stats.total > 1 && (
            <div className="p-4 border-t border-gray-800">
              <div className="text-sm text-gray-400 mb-3">Estatísticas da conta:</div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-500">Total perfis:</span>
                  <div className="text-white font-medium">{stats.total}</div>
                </div>
                <div>
                  <span className="text-gray-500">Perfis infantis:</span>
                  <div className="text-white font-medium">{stats.kids}</div>
                </div>
                <div>
                  <span className="text-gray-500">Adultos:</span>
                  <div className="text-white font-medium">{stats.adults}</div>
                </div>
                <div>
                  <span className="text-gray-500">Tempo total:</span>
                  <div className="text-white font-medium">{formatWatchTime(stats.totalWatchTime)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Mais ativo:</span>
                  <div className="text-white font-medium truncate">{stats.mostActive?.name || '-'}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Overlay para fechar dropdown */}
      {isOpen && !isSwitching && (
        <div
          className="fixed inset-0 bg-black/50 z-40 cursor-pointer"
          onClick={() => setIsOpen(false)}
          onKeyDown={(e) => e.key === 'Escape' && setIsOpen(false)}
          tabIndex={0}
          role="button"
          aria-label="Fechar menu"
        />
      )}

      {/* Loading overlay */}
      {isSwitching && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-white font-medium">Trocando perfil...</div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente para avatar de perfil
interface ProfileAvatarProps {
  profile: any;
  size?: 'sm' | 'md' | 'lg';
  showActiveIndicator?: boolean;
  isActive?: boolean;
  onClick?: () => void;
}

export function ProfileAvatar({ 
  profile, 
  size = 'md', 
  showActiveIndicator = true,
  isActive = false,
  onClick 
}: ProfileAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  return (
    <div
      className={cn(
        'relative rounded-full overflow-hidden bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center cursor-pointer hover:from-gray-500 hover:to-gray-600 transition-all',
        sizeClasses[size],
        isActive && 'ring-2 ring-primary ring-offset-2 ring-offset-gray-900'
      )}
      onClick={onClick}
    >
      {profile.avatar_url ? (
        <img
          src={profile.avatar_url}
          alt={profile.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <User className={cn(
          size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6',
          'text-gray-300'
        )} />
      )}
      
      {showActiveIndicator && isActive && (
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
      )}
      
      {profile.is_kid && (
        <div className="absolute -top-1 -right-1">
          <Crown className="w-3 h-3 text-yellow-500" />
        </div>
      )}
    </div>
  );
}

// Componente para mini perfil
interface MiniProfileProps {
  profile: any;
  onClick?: () => void;
  isActive?: boolean;
}

export function MiniProfile({ profile, onClick, isActive = false }: MiniProfileProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors',
        isActive && 'bg-gray-800'
      )}
      onClick={onClick}
    >
      <ProfileAvatar profile={profile} size="sm" isActive={isActive} />
      <div className="flex-1 min-w-0">
        <div className="text-white text-sm font-medium truncate">{profile.name}</div>
        {profile.is_kid && (
          <Badge variant="secondary" size="xs" className="mt-1">
            <Crown className="w-3 h-3" />
          </Badge>
        )}
      </div>
    </div>
  );
}
