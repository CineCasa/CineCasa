import { useState } from 'react';
import { Palette, RotateCcw, Save, Download, Upload, Sparkles, Crown, Star, Lock, Unlock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Button } from '@/components/ui';
import { useAvatarCustomization, useAvatarPreview } from '@/hooks/useAvatarCustomization';
import { cn } from '@/lib/utils';

interface AvatarCustomizerProps {
  userId?: string;
  profileId?: string;
  onSave?: (customization: any) => void;
  className?: string;
}

export function AvatarCustomizer({
  userId,
  profileId,
  onSave,
  className,
}: AvatarCustomizerProps) {
  const [activeTab, setActiveTab] = useState<'appearance' | 'clothing' | 'accessories' | 'special'>('appearance');
  const [showPreview, setShowPreview] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  const {
    customization,
    availableItems,
    itemsByCategory,
    isLoading,
    isSaving,
    isUnlocking,
    updateCustomization,
    resetCustomization,
    randomizeCustomization,
    saveCustomization,
    generateAvatarUrl,
    isItemUnlocked,
    exportCustomization,
    importCustomization,
    hasSpecialItems,
  } = useAvatarCustomization({
    userId,
    profileId,
    enableSpecialItems: true,
    enableAnimations: true,
    autoSave: false,
  });

  const {
    previewUrl,
    isGenerating,
    generatePreview,
  } = useAvatarPreview(customization);

  const handleSave = () => {
    saveCustomization.mutate(customization);
    onSave?.(customization);
  };

  const handleImport = async () => {
    if (importFile) {
      await importCustomization(importFile);
      setImportFile(null);
    }
  };

  const handleUnlockItem = (itemId: string, cost: number) => {
    // Em produção, verificaria se usuário tem pontos suficientes
    if (window.confirm(`Desbloquear este item por ${cost} pontos?`)) {
      // unlockItem.mutate({ itemId, cost });
    }
  };

  const renderCustomizationOption = <T extends string>(
    category: string,
    options: readonly T[],
    currentValue: T,
    onChange: (value: T) => void
  ) => (
    <div className="space-y-2">
      <div className="text-sm font-medium text-gray-300 capitalize">{category}</div>
      <div className="grid grid-cols-3 gap-2">
        {options.map(option => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={cn(
              'p-3 rounded-lg border-2 transition-all',
              currentValue === option
                ? 'border-primary bg-primary/10'
                : 'border-gray-700 hover:border-gray-600'
            )}
          >
            <div className="w-8 h-8 mx-auto mb-1 bg-gray-700 rounded-full" />
            <div className="text-xs text-gray-300 capitalize">{option}</div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderColorPicker = (
    category: string,
    currentValue: string,
    onChange: (value: string) => void
  ) => {
    const colors = [
      '#000000', '#1F2937', '#374151', '#6B7280', '#9CA3AF',
      '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
      '#EC4899', '#F97316', '#84CC16', '#06B6D4', '#6366F1',
    ];

    return (
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-300">{category}</div>
        <div className="grid grid-cols-6 gap-2">
          {colors.map(color => (
            <button
              key={color}
              onClick={() => onChange(color)}
              className={cn(
                'w-10 h-10 rounded-lg border-2 transition-all',
                currentValue === color
                  ? 'border-primary scale-110'
                  : 'border-gray-700 hover:border-gray-600'
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderSpecialItems = (category: string, items: any[]) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-300 capitalize">{category}</div>
        <Badge variant="secondary" size="xs">
          {items.filter(item => isItemUnlocked(item.id)).length}/{items.length}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {items.map(item => (
          <Card
            key={item.id}
            variant={isItemUnlocked(item.id) ? 'default' : 'outlined'}
            size="sm"
            className={cn(
              'cursor-pointer transition-all',
              !isItemUnlocked(item.id) && 'opacity-50'
            )}
            onClick={() => {
              if (isItemUnlocked(item.id)) {
                // Aplicar item
              } else {
                handleUnlockItem(item.id, item.price || 100);
              }
            }}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 bg-gray-700 rounded-lg" />
                {item.price && !isItemUnlocked(item.id) && (
                  <Badge variant="secondary" size="xs">
                    <Lock className="w-3 h-3" />
                    {item.price}
                  </Badge>
                )}
              </div>
              <div className="text-xs text-gray-300">{item.name}</div>
              {item.unlockCondition && (
                <div className="text-xs text-gray-500 mt-1">{item.unlockCondition}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-gray-400">Carregando customização...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Palette className="w-6 h-6 text-primary" />
            Customizar Avatar
          </h2>
          <p className="text-gray-400 mt-1">
            Personalize seu avatar com aparência, roupas e acessórios exclusivos
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={randomizeCustomization}
            className="text-gray-400 border-gray-700"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Aleatório
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetCustomization}
            className="text-gray-400 border-gray-700"
          >
            Resetar
          </Button>
        </div>
      </div>

      {/* Preview */}
      <Card variant="elevated" className="p-6">
        <div className="flex items-center justify-center">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
              {/* Preview do avatar */}
              <div className="text-4xl">👤</div>
            </div>
            
            {/* Badge de preview */}
            {showPreview && (
              <Badge variant="primary" className="absolute -top-2 -right-2">
                <Sparkles className="w-3 h-3" />
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex justify-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              generatePreview();
              setShowPreview(true);
            }}
            disabled={isGenerating}
            className="text-gray-400 border-gray-700"
          >
            {isGenerating ? 'Gerando...' : 'Preview'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800">
        {[
          { id: 'appearance', label: 'Aparência', icon: '👤' },
          { id: 'clothing', label: 'Roupas', icon: '👕' },
          { id: 'accessories', label: 'Acessórios', icon: '🎩' },
          { id: 'special', label: 'Especiais', icon: '✨' },
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
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Aparência */}
        {activeTab === 'appearance' && (
          <div className="space-y-6">
            {renderCustomizationOption(
              'Tipo de corpo',
              ['slim', 'average', 'athletic', 'plus'] as const,
              customization.bodyType,
              (value) => updateCustomization({ bodyType: value })
            )}
            
            {renderColorPicker(
              'Tom de pele',
              customization.skinTone,
              (value) => updateCustomization({ skinTone: value })
            )}
            
            {renderCustomizationOption(
              'Formato do rosto',
              ['round', 'square', 'heart', 'oval', 'diamond'] as const,
              customization.faceShape,
              (value) => updateCustomization({ faceShape: value })
            )}
            
            {renderCustomizationOption(
              'Cabelo',
              ['short', 'medium', 'long', 'bald', 'ponytail', 'mohawk', 'buzzcut'] as const,
              customization.hairStyle,
              (value) => updateCustomization({ hairStyle: value })
            )}
            
            {renderColorPicker(
              'Cor do cabelo',
              customization.hairColor,
              (value) => updateCustomization({ hairColor: value })
            )}
            
            {renderCustomizationOption(
              'Barba',
              ['none', 'beard', 'mustache', 'goatee', 'full'] as const,
              customization.facialHair,
              (value) => updateCustomization({ facialHair: value })
            )}
            
            {renderCustomizationOption(
              'Olhos',
              ['round', 'almond', 'monolid', 'hooded', 'upturned', 'downturned'] as const,
              customization.eyeShape,
              (value) => updateCustomization({ eyeShape: value })
            )}
            
            {renderColorPicker(
              'Cor dos olhos',
              customization.eyeColor,
              (value) => updateCustomization({ eyeColor: value })
            )}
            
            {renderCustomizationOption(
              'Óculos',
              ['none', 'regular', 'sunglasses', 'reading', 'monocle'] as const,
              customization.glasses,
              (value) => updateCustomization({ glasses: value })
            )}
          </div>
        )}

        {/* Roupas */}
        {activeTab === 'clothing' && (
          <div className="space-y-6">
            {renderCustomizationOption(
              'Parte de cima',
              ['none', 'tshirt', 'shirt', 'sweater', 'jacket', 'suit', 'dress'],
              customization.topType,
              (value) => updateCustomization({ topType: value })
            )}
            
            {renderColorPicker(
              'Cor da parte de cima',
              customization.topColor,
              (value) => updateCustomization({ topColor: value })
            )}
            
            {renderCustomizationOption(
              'Parte de baixo',
              ['none', 'pants', 'shorts', 'skirt', 'dress'],
              customization.bottomType,
              (value) => updateCustomization({ bottomType: value })
            )}
            
            {renderColorPicker(
              'Cor da parte de baixo',
              customization.bottomColor,
              (value) => updateCustomization({ bottomColor: value })
            )}
          </div>
        )}

        {/* Acessórios */}
        {activeTab === 'accessories' && (
          <div className="space-y-6">
            {renderCustomizationOption(
              'Chapéu',
              ['none', 'cap', 'beanie', 'headband', 'crown', 'helmet', 'hat'] as const,
              customization.headwear,
              (value) => updateCustomization({ headwear: value })
            )}
            
            {renderCustomizationOption(
              'Acessório',
              ['none', 'earrings', 'necklace', 'tie', 'scarf', 'glasses'] as const,
              customization.accessory,
              (value) => updateCustomization({ accessory: value })
            )}
            
            {renderCustomizationOption(
              'Fundo',
              ['none', 'gradient', 'pattern', 'solid', 'image'] as const,
              customization.background,
              (value) => updateCustomization({ background: value })
            )}
            
            {renderColorPicker(
              'Cor do fundo',
              customization.backgroundColor,
              (value) => updateCustomization({ backgroundColor: value })
            )}
            
            {renderCustomizationOption(
              'Expressão',
              ['happy', 'neutral', 'sad', 'excited', 'cool', 'sleeping', 'wink', 'surprised'] as const,
              customization.expression,
              (value) => updateCustomization({ expression: value })
            )}
            
            {renderCustomizationOption(
              'Animação',
              ['none', 'bounce', 'wave', 'blink', 'float', 'spin', 'pulse'] as const,
              customization.animation,
              (value) => updateCustomization({ animation: value })
            )}
          </div>
        )}

        {/* Especiais */}
        {activeTab === 'special' && (
          <div className="space-y-6">
            {/* Itens especiais */}
            {itemsByCategory.special && itemsByCategory.special.length > 0 && (
              renderSpecialItems('Itens Especiais', itemsByCategory.special)
            )}
            
            {/* Badges */}
            {itemsByCategory.badges && itemsByCategory.badges.length > 0 && (
              renderSpecialItems('Badges', itemsByCategory.badges)
            )}
            
            {/* Frames */}
            {itemsByCategory.frames && itemsByCategory.frames.length > 0 && (
              renderSpecialItems('Frames', itemsByCategory.frames)
            )}
            
            {/* Effects */}
            {itemsByCategory.effects && itemsByCategory.effects.length > 0 && (
              renderSpecialItems('Efeitos', itemsByCategory.effects)
            )}
            
            {!hasSpecialItems && (
              <div className="text-center py-8 text-gray-500">
                <Crown className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                <p className="text-sm">
                  Complete conquistas para desbloquear itens especiais!
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Import/Export */}
      <Card variant="outlined" className="p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Importar/Exportar customização
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('import-avatar')?.click()}
              className="text-gray-400 border-gray-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              Importar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportCustomization}
              className="text-gray-400 border-gray-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
        <input
          id="import-avatar"
          type="file"
          accept=".json"
          onChange={(e) => setImportFile(e.target.files?.[0] || null)}
          className="hidden"
        />
        {importFile && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm text-gray-400">Arquivo: {importFile.name}</span>
            <Button
              variant="outline"
              size="xs"
              onClick={handleImport}
              className="text-xs"
            >
              Importar
            </Button>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setImportFile(null)}
              className="text-xs text-gray-400"
            >
              Cancelar
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

// Componente para avatar preview em tempo real
interface AvatarPreviewProps {
  customization: any;
  size?: 'sm' | 'md' | 'lg';
  showAnimation?: boolean;
}

export function AvatarPreview({ 
  customization, 
  size = 'md', 
  showAnimation = true 
}: AvatarPreviewProps) {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  const animationClass = showAnimation && customization.animation !== 'none' 
    ? `animate-${customization.animation}` 
    : '';

  return (
    <div className={cn(
      'relative rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center',
      sizeClasses[size],
      animationClass
    )}>
      {/* Avatar simplificado - em produção renderizaria avatar real */}
      <div className="text-center">
        <div className="text-2xl md:text-3xl lg:text-4xl">
          {customization.expression === 'happy' ? '😊' :
           customization.expression === 'sad' ? '😢' :
           customization.expression === 'excited' ? '🤩' :
           customization.expression === 'cool' ? '😎' :
           customization.expression === 'sleeping' ? '😴' :
           customization.expression === 'wink' ? '😉' :
           customization.expression === 'surprised' ? '😮' : '😐'}
        </div>
        
        {/* Acessórios visuais */}
        {customization.glasses !== 'none' && (
          <div className="text-xs">👓</div>
        )}
        {customization.headwear !== 'none' && (
          <div className="text-xs">🎩</div>
        )}
      </div>
      
      {/* Badge de especial */}
      {customization.specialItems && customization.specialItems.length > 0 && (
        <Badge variant="secondary" className="absolute -top-1 -right-1">
          <Star className="w-3 h-3" />
        </Badge>
      )}
    </div>
  );
}
