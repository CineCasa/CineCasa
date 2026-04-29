import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// Types
export type AvatarItem = Database['public']['Tables']['avatar_items']['Row'];
export type UserAvatarItem = Database['public']['Tables']['user_avatar_items']['Row'];
export type UserEquippedAvatar = Database['public']['Tables']['user_equipped_avatar']['Row'];

export type AvatarCategory = 'body' | 'hair' | 'eyes' | 'clothing' | 'accessories' | 'background' | 'badge' | 'frame';
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface EquippedSlots {
  slot_body?: string;
  slot_hair?: string;
  slot_eyes?: string;
  slot_top?: string;
  slot_bottom?: string;
  slot_accessory_1?: string;
  slot_accessory_2?: string;
  slot_background?: string;
  slot_badge?: string;
  slot_frame?: string;
}

export interface AvatarRenderConfig {
  backgroundColor?: string;
  skinTone?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
}

class AvatarService {
  private static instance: AvatarService;

  static getInstance(): AvatarService {
    if (!AvatarService.instance) {
      AvatarService.instance = new AvatarService();
    }
    return AvatarService.instance;
  }

  // =====================================================
  // AVATAR ITEMS
  // =====================================================

  async getAllItems(): Promise<AvatarItem[]> {
    const { data, error } = await supabase
      .from('avatar_items')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getItemsByCategory(category: AvatarCategory): Promise<AvatarItem[]> {
    const { data, error } = await supabase
      .from('avatar_items')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getItemById(itemId: string): Promise<AvatarItem | null> {
    const { data, error } = await supabase
      .from('avatar_items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (error) return null;
    return data;
  }

  // =====================================================
  // USER ITEMS (INVENTORY)
  // =====================================================

  async getUserItems(userId: string): Promise<UserAvatarItem[]> {
    const { data, error } = await supabase
      .from('user_avatar_items')
      .select(`
        *,
        avatar_item:avatar_items(*)
      `)
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getUserItemsByCategory(userId: string, category: AvatarCategory): Promise<UserAvatarItem[]> {
    const { data, error } = await supabase
      .from('user_avatar_items')
      .select(`
        *,
        avatar_item:avatar_items!inner(*)
      `)
      .eq('user_id', userId)
      .eq('avatar_item.category', category)
      .order('unlocked_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async hasItem(userId: string, itemId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('user_avatar_items')
      .select('id')
      .eq('user_id', userId)
      .eq('avatar_item_id', itemId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  }

  async unlockItem(
    userId: string, 
    itemId: string, 
    unlockedBy: string = 'purchase',
    meta: Record<string, unknown> = {}
  ): Promise<UserAvatarItem> {
    // Verificar se já tem
    const has = await this.hasItem(userId, itemId);
    if (has) {
      throw new Error('Item já desbloqueado');
    }

    const { data, error } = await supabase
      .from('user_avatar_items')
      .insert({
        user_id: userId,
        avatar_item_id: itemId,
        unlocked_by: unlockedBy,
        unlocked_meta: meta,
      })
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Falha ao desbloquear item');

    return data;
  }

  async toggleFavorite(userId: string, itemId: string): Promise<boolean> {
    const { data: current } = await supabase
      .from('user_avatar_items')
      .select('is_favorite')
      .eq('user_id', userId)
      .eq('avatar_item_id', itemId)
      .single();

    const newValue = !(current?.is_favorite ?? false);

    const { error } = await supabase
      .from('user_avatar_items')
      .update({ is_favorite: newValue })
      .eq('user_id', userId)
      .eq('avatar_item_id', itemId);

    if (error) throw error;
    return newValue;
  }

  // =====================================================
  // EQUIPAMENTO
  // =====================================================

  async getEquippedAvatar(userId: string): Promise<UserEquippedAvatar | null> {
    const { data, error } = await supabase
      .from('user_equipped_avatar')
      .select(`
        *,
        body_item:slot_body(*),
        hair_item:slot_hair(*),
        eyes_item:slot_eyes(*),
        top_item:slot_top(*),
        bottom_item:slot_bottom(*),
        acc1_item:slot_accessory_1(*),
        acc2_item:slot_accessory_2(*),
        bg_item:slot_background(*),
        badge_item:slot_badge(*),
        frame_item:slot_frame(*)
      `)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) return null;
    return data;
  }

  async equipItem(userId: string, slot: keyof EquippedSlots, itemId: string | null): Promise<void> {
    // Verificar se usuário tem o item (se não for null)
    if (itemId) {
      const has = await this.hasItem(userId, itemId);
      if (!has) {
        throw new Error('Item não disponível no inventário');
      }
    }

    // Verificar se existe registro
    const { data: existing } = await supabase
      .from('user_equipped_avatar')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      // Update
      const { error } = await supabase
        .from('user_equipped_avatar')
        .update({ [slot]: itemId, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) throw error;
    } else {
      // Insert
      const { error } = await supabase
        .from('user_equipped_avatar')
        .insert({
          user_id: userId,
          [slot]: itemId,
        });

      if (error) throw error;
    }

    // Incrementar contador de uso
    if (itemId) {
      await supabase.rpc('increment_item_usage', { p_item_id: itemId, p_user_id: userId });
    }
  }

  async equipMultiple(userId: string, slots: Partial<EquippedSlots>): Promise<void> {
    const { data: existing } = await supabase
      .from('user_equipped_avatar')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    const updateData = {
      ...slots,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      const { error } = await supabase
        .from('user_equipped_avatar')
        .update(updateData)
        .eq('user_id', userId);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('user_equipped_avatar')
        .insert({
          user_id: userId,
          ...slots,
        });

      if (error) throw error;
    }
  }

  async saveCustomization(userId: string, config: Record<string, unknown>): Promise<void> {
    const { error } = await supabase
      .from('user_equipped_avatar')
      .update({
        customization_config: config,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) throw error;
  }

  // =====================================================
  // RENDERIZAÇÃO
  // =====================================================

  generateAvatarSvg(equipped: UserEquippedAvatar, config: AvatarRenderConfig = {}): string {
    const { size = 'md' } = config;
    
    const sizes = {
      sm: { w: 64, h: 64 },
      md: { w: 128, h: 128 },
      lg: { w: 256, h: 256 },
      xl: { w: 512, h: 512 },
    };

    const { w, h } = sizes[size];

    // SVG base simplificado (placeholder para implementação real)
    return `
      <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#4F46E5"/>
            <stop offset="100%" style="stop-color:#10B981"/>
          </linearGradient>
        </defs>
        <rect width="${w}" height="${h}" fill="url(#bg)" rx="${w * 0.1}"/>
        <circle cx="${w * 0.5}" cy="${h * 0.4}" r="${w * 0.25}" fill="#FCD34D"/>
        <rect x="${w * 0.3}" y="${h * 0.55}" width="${w * 0.4}" height="${h * 0.3}" rx="${w * 0.05}" fill="#3B82F6"/>
      </svg>
    `.trim();
  }

  // =====================================================
  // UTILIDADES
  // =====================================================

  getRarityColor(rarity: ItemRarity): string {
    const colors: Record<ItemRarity, string> = {
      common: '#9CA3AF',
      uncommon: '#10B981',
      rare: '#3B82F6',
      epic: '#8B5CF6',
      legendary: '#F59E0B',
      mythic: '#EC4899',
    };
    return colors[rarity] || colors.common;
  }

  getRarityLabel(rarity: ItemRarity): string {
    const labels: Record<ItemRarity, string> = {
      common: 'Comum',
      uncommon: 'Incomum',
      rare: 'Raro',
      epic: 'Épico',
      legendary: 'Lendário',
      mythic: 'Mítico',
    };
    return labels[rarity] || 'Comum';
  }
}

export const avatarService = AvatarService.getInstance();
export default avatarService;
