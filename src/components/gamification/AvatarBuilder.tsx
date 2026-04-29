import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Palette, Shirt, Crown, Sparkles, Check, Lock, Star } from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useAvatarItems, useUserAvatarItems, useEquippedAvatar, useEquipItem, useRarityColor, useRarityLabel } from '@/hooks/useAvatar';
import type { AvatarItem } from '@/services/AvatarService';

type TabType = 'body' | 'hair' | 'eyes' | 'clothing' | 'accessories' | 'background';

interface AvatarBuilderProps {
  userId: string;
  onClose?: () => void;
}

const TABS: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'body', label: 'Corpo', icon: <User className="w-4 h-4" /> },
  { id: 'hair', label: 'Cabelo', icon: <Palette className="w-4 h-4" /> },
  { id: 'eyes', label: 'Olhos', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'clothing', label: 'Roupas', icon: <Shirt className="w-4 h-4" /> },
  { id: 'accessories', label: 'Acessórios', icon: <Crown className="w-4 h-4" /> },
  { id: 'background', label: 'Fundo', icon: <Palette className="w-4 h-4" /> },
];

export function AvatarBuilder({ userId, onClose }: AvatarBuilderProps) {
  const [activeTab, setActiveTab] = useState<TabType>('body');
  const [previewItem, setPreviewItem] = useState<AvatarItem | null>(null);

  const { data: allItems, isLoading: loadingItems } = useAvatarItems();
  const { data: userItems, isLoading: loadingUserItems } = useUserAvatarItems(userId);
  const { data: equipped, isLoading: loadingEquipped } = useEquippedAvatar(userId);
  const equipMutation = useEquipItem();
  const getRarityColor = useRarityColor();
  const getRarityLabel = useRarityLabel();

  const ownedItemIds = new Set(userItems?.map(ui => ui.avatar_item_id) || []);

  const tabItems = allItems?.filter(item => item.category === activeTab) || [];

  const handleEquip = async (item: AvatarItem) => {
    if (!ownedItemIds.has(item.id)) return;

    const slotMap: Record<string, string> = {
      body: 'slot_body',
      hair: 'slot_hair',
      eyes: 'slot_eyes',
      clothing: 'slot_top',
      accessories: 'slot_accessory_1',
      background: 'slot_background',
    };

    const slot = slotMap[activeTab];
    if (!slot) return;

    await equipMutation.mutateAsync({ userId, slot: slot as any, itemId: item.id });
    setPreviewItem(null);
  };

  const isEquipped = (item: AvatarItem) => {
    if (!equipped) return false;
    const slots = ['slot_body', 'slot_hair', 'slot_eyes', 'slot_top', 'slot_accessory_1', 'slot_background', 'slot_badge', 'slot_frame'];
    return slots.some(slot => equipped[slot as keyof typeof equipped] === item.id);
  };

  const isLoading = loadingItems || loadingUserItems || loadingEquipped;

  if (isLoading) {
    return (
      <Card className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden bg-background/95 backdrop-blur-sm">
      {/* Header */}
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          Personalizar Avatar
        </h2>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            Fechar
          </Button>
        )}
      </div>

      <div className="grid md:grid-cols-[300px_1fr] lg:grid-cols-[350px_1fr]">
        {/* Preview Panel */}
        <div className="p-6 border-r border-border/50 bg-gradient-to-b from-background to-muted/30">
          <div className="aspect-square bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl flex items-center justify-center relative overflow-hidden">
            <AvatarPreview equipped={equipped} previewItem={previewItem} activeTab={activeTab} />
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              {previewItem ? `Preview: ${previewItem.name}` : 'Selecione um item para preview'}
            </p>
          </div>
        </div>

        {/* Items Grid */}
        <div className="flex flex-col">
          {/* Tabs */}
          <div className="flex overflow-x-auto p-2 gap-1 border-b border-border/50">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setPreviewItem(null); }}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted text-muted-foreground'
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Items */}
          <div className="p-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 overflow-y-auto max-h-[400px]">
            <AnimatePresence mode="popLayout">
              {tabItems.map(item => {
                const owned = ownedItemIds.has(item.id);
                const equipped = isEquipped(item);

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => owned && setPreviewItem(item)}
                    onMouseEnter={() => owned && setPreviewItem(item)}
                    onMouseLeave={() => setPreviewItem(null)}
                    className={cn(
                      'relative aspect-square rounded-xl p-3 cursor-pointer transition-all group',
                      equipped
                        ? 'ring-2 ring-primary bg-primary/10'
                        : owned
                          ? 'hover:bg-muted border border-border'
                          : 'opacity-50 cursor-not-allowed border border-border'
                    )}
                  >
                    {/* Rarity Badge */}
                    <div
                      className="absolute top-1 right-1 w-2 h-2 rounded-full"
                      style={{ backgroundColor: getRarityColor(item.rarity || 'common') }}
                    />

                    {/* Item Icon Placeholder */}
                    <div className="h-full flex flex-col items-center justify-center gap-2">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${getRarityColor(item.rarity || 'common')}20` }}
                      >
                        {item.icon ? (
                          <span className="text-2xl">{item.icon}</span>
                        ) : (
                          <User className="w-6 h-6" style={{ color: getRarityColor(item.rarity || 'common') }} />
                        )}
                      </div>
                      <span className="text-xs text-center line-clamp-2 font-medium">{item.name}</span>
                    </div>

                    {/* Locked Indicator */}
                    {!owned && (
                      <div className="absolute inset-0 bg-background/80 rounded-xl flex items-center justify-center">
                        <Lock className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}

                    {/* Equipped Indicator */}
                    {equipped && (
                      <div className="absolute bottom-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}

                    {/* Equip Button on Hover */}
                    {owned && !equipped && (
                      <div className="absolute inset-0 bg-primary/90 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); handleEquip(item); }}>
                          Equipar
                        </Button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Avatar Preview Component
function AvatarPreview({ equipped, previewItem, activeTab }: { equipped?: any; previewItem: AvatarItem | null; activeTab: TabType }) {
  // This is a simplified preview - in production you'd render the actual avatar SVG/image
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
        <User className="w-16 h-16 text-primary/60" />
      </div>

      {previewItem && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm shadow-lg"
        >
          <span className="font-medium">{previewItem.name}</span>
        </motion.div>
      )}
    </div>
  );
}

export default AvatarBuilder;
