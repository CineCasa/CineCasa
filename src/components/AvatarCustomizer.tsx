import { useState, useCallback, useEffect } from 'react';
import { Palette, RotateCcw, Save, User, Shirt, Glasses, Sparkles, Crown, Star, Download, Upload } from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface AvatarCustomizerProps {
  userId?: string;
  profileId?: string;
  onSave?: (customization: any) => void;
  className?: string;
}

const BODY_TYPES = ['slim', 'average', 'athletic', 'plus'] as const;
const SKIN_TONES = ['#F5D0A9', '#E8C39E', '#D4A574', '#B8956A', '#9C7B5C', '#7D5A3C', '#5C3A21', '#3D2314'] as const;
const HAIR_STYLES = ['short', 'medium', 'long', 'bald', 'mohawk', 'afro', 'curly'] as const;
const HAIR_COLORS = ['#000000', '#2C2C2C', '#4A3728', '#8B4513', '#D2691E', '#FFD700', '#DC143C', '#4B0082'] as const;
const EYE_COLORS = ['#4A6741', '#5D4E37', '#8B4513', '#6495ED', '#808080', '#40E0D0'] as const;
const SHIRT_TYPES = ['basic', 'polo', 'hoodie', 'jacket', 'formal'] as const;
const SHIRT_COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#1F2937', '#FFFFFF'] as const;
const ACCESSORIES = ['none', 'glasses', 'sunglasses', 'hat', 'cap'] as const;
const EXPRESSIONS = ['neutral', 'smile', 'laugh', 'serious', 'wink'] as const;

export function AvatarCustomizer({
  userId,
  profileId,
  onSave,
  className,
}: AvatarCustomizerProps) {
  const [activeTab, setActiveTab] = useState<'appearance' | 'clothing' | 'accessories' | 'special'>('appearance');
  const [isSaving, setIsSaving] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [avatar, setAvatar] = useState({
    bodyType: 'average',
    skinTone: '#E8C39E',
    hairStyle: 'short',
    hairColor: '#4A3728',
    eyeColor: '#4A6741',
    shirtType: 'basic',
    shirtColor: '#3B82F6',
    accessory: 'none',
    expression: 'neutral',
  });

  // Carregar avatar salvo
  useEffect(() => {
    if (!userId) return;
    
    const loadAvatar = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('avatar_customization')
        .eq('id', userId)
        .maybeSingle();
      
      if (data?.avatar_customization) {
        setAvatar(prev => ({ ...prev, ...data.avatar_customization }));
      }
    };
    
    loadAvatar();
  }, [userId]);

  const updateAvatar = useCallback((key: string, value: string) => {
    setAvatar(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = async () => {
    if (!userId) return;
    
    setIsSaving(true);
    try {
      await supabase
        .from('profiles')
        .update({ 
          avatar_customization: avatar,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      onSave?.(avatar);
    } finally {
      setIsSaving(false);
    }
  };

  const resetAvatar = () => {
    setAvatar({
      bodyType: 'average',
      skinTone: '#E8C39E',
      hairStyle: 'short',
      hairColor: '#4A3728',
      eyeColor: '#4A6741',
      shirtType: 'basic',
      shirtColor: '#3B82F6',
      accessory: 'none',
      expression: 'neutral',
    });
  };

  const exportCustomization = () => {
    const dataStr = JSON.stringify(avatar, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'avatar-customization.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importCustomization = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      setAvatar(prev => ({ ...prev, ...data }));
    } catch (error) {
      console.error('Erro ao importar:', error);
    }
  };

  // Renderizar opções de customização
  const renderOptionGrid = (options: readonly string[], currentValue: string, onSelect: (value: string) => void) => (
    <div className="grid grid-cols-3 gap-2">
      {options.map(option => (
        <button
          key={option}
          onClick={() => onSelect(option)}
          className={cn(
            'p-2 rounded-lg border-2 text-xs transition-all',
            currentValue === option
              ? 'border-cyan-400 bg-cyan-400/20 text-white'
              : 'border-gray-700 text-gray-400 hover:border-gray-600'
          )}
        >
          {option.charAt(0).toUpperCase() + option.slice(1)}
        </button>
      ))}
    </div>
  );

  // Renderizar seletor de cor
  const renderColorGrid = (colors: readonly string[], currentValue: string, onSelect: (value: string) => void) => (
    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
      {colors.map(color => (
        <button
          key={color}
          onClick={() => onSelect(color)}
          className={cn(
            'w-10 h-10 rounded-lg border-2 transition-all',
            currentValue === color ? 'border-white scale-110' : 'border-gray-700'
          )}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Palette className="w-6 h-6 text-cyan-400" />
            Personalizar Avatar
          </h2>
          <p className="text-gray-400 mt-1 text-sm">
            Escolha opções de aparência, roupas e acessórios
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetAvatar}
            className="text-gray-400 border-gray-700"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Resetar
          </Button>
        </div>
      </div>

      {/* Preview */}
      <Card variant="elevated" className="p-6">
        {renderPreview()}
        
        <div className="flex justify-center gap-2 mt-4">
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
                ? 'border-cyan-400 text-cyan-400'
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
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-300">Tipo de Corpo</div>
              {renderOptionGrid(BODY_TYPES, avatar.bodyType, (val) => updateAvatar('bodyType', val))}
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-300">Tom de Pele</div>
              {renderColorGrid(SKIN_TONES, avatar.skinTone, (val) => updateAvatar('skinTone', val))}
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-300">Estilo de Cabelo</div>
              {renderOptionGrid(HAIR_STYLES, avatar.hairStyle, (val) => updateAvatar('hairStyle', val))}
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-300">Cor do Cabelo</div>
              {renderColorGrid(HAIR_COLORS, avatar.hairColor, (val) => updateAvatar('hairColor', val))}
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-300">Cor dos Olhos</div>
              {renderColorGrid(EYE_COLORS, avatar.eyeColor, (val) => updateAvatar('eyeColor', val))}
            </div>
          </div>
        )}

        {/* Roupas */}
        {activeTab === 'clothing' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-300">Tipo de Camisa</div>
              {renderOptionGrid(SHIRT_TYPES, avatar.shirtType, (val) => updateAvatar('shirtType', val))}
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-300">Cor da Camisa</div>
              {renderColorGrid(SHIRT_COLORS, avatar.shirtColor, (val) => updateAvatar('shirtColor', val))}
            </div>
          </div>
        )}

        {/* Acessórios */}
        {activeTab === 'accessories' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-300">Acessório</div>
              {renderOptionGrid(ACCESSORIES, avatar.accessory, (val) => updateAvatar('accessory', val))}
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-300">Expressão</div>
              {renderOptionGrid(EXPRESSIONS, avatar.expression, (val) => updateAvatar('expression', val))}
            </div>
          </div>
        )}

        {/* Especiais */}
        {activeTab === 'special' && (
          <div className="space-y-6">
            <div className="text-center py-8 text-gray-500">
              <Crown className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p className="text-sm">
                Complete conquistas para desbloquear itens especiais!
              </p>
            </div>
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
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) importCustomization(file);
          }}
          className="hidden"
        />
      </Card>
    </div>
  );

  // Preview visual simples
  function renderPreview() {
    return (
      <div className="flex justify-center">
        <div 
          className="w-32 h-32 rounded-full flex items-center justify-center text-6xl shadow-lg transition-all duration-300"
          style={{ 
            backgroundColor: avatar.skinTone,
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}
        >
          <span className="filter drop-shadow-lg">
            {avatar.expression === 'smile' && '😊'}
            {avatar.expression === 'laugh' && '😄'}
            {avatar.expression === 'serious' && '😐'}
            {avatar.expression === 'wink' && '😉'}
            {avatar.expression === 'neutral' && '🙂'}
          </span>
        </div>
      </div>
    );
  }
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

  const animationClass = showAnimation && customization?.animation !== 'none' 
    ? `animate-${customization.animation}` 
    : '';

  return (
    <div className={cn(
      'relative rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center',
      sizeClasses[size],
      animationClass
    )}>
      {/* Avatar simplificado */}
      <div className="text-center">
        <div className="text-2xl md:text-3xl lg:text-4xl">
          {customization?.expression === 'happy' ? '😊' :
           customization?.expression === 'sad' ? '😢' :
           customization?.expression === 'excited' ? '🤩' :
           customization?.expression === 'cool' ? '😎' :
           customization?.expression === 'sleeping' ? '😴' :
           customization?.expression === 'wink' ? '😉' :
           customization?.expression === 'surprised' ? '😮' : '😐'}
        </div>
        
        {/* Acessórios visuais */}
        {customization?.glasses !== 'none' && (
          <div className="text-xs">👓</div>
        )}
        {customization?.headwear !== 'none' && (
          <div className="text-xs">🎩</div>
        )}
      </div>
      
      {/* Badge de especial */}
      {customization?.specialItems && customization.specialItems.length > 0 && (
        <Badge variant="secondary" className="absolute -top-1 -right-1">
          <Star className="w-3 h-3" />
        </Badge>
      )}
    </div>
  );
}
