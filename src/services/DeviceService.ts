import { supabase } from '@/integrations/supabase/client';
import { getFullDeviceInfo, getOrCreateDeviceId } from '@/utils/deviceFingerprint';
import type { DeviceType } from '@/utils/deviceFingerprint';

/**
 * CORREÇÕES:
 * - Todas as RPCs (register_device, get_user_devices, remove_device,
 *   logout_other_devices, etc.) não existem no banco
 * - Substituído por queries diretas à tabela user_devices
 *
 * Colunas reais da tabela user_devices:
 * id (uuid), user_id, device_name, device_type (tv|mobile|web),
 * device_id, location, last_active, is_current, created_at,
 * updated_at, is_active, ip_address, user_agent, os, browser,
 * screen_resolution, timezone, language, fingerprint
 */

export interface UserDevice {
  id: string;
  device_id: string;
  device_name: string;
  device_type: DeviceType;
  location: string | null;
  last_active: string;
  is_current: boolean;
  is_active: boolean;
  created_at: string;
  ip_address: string | null;
  os: string | null;
  browser: string | null;
  screen_resolution: string | null;
  timezone: string | null;
}

class DeviceService {
  private static instance: DeviceService;
  private activityDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly ACTIVITY_DEBOUNCE_MS = 30000;

  static getInstance(): DeviceService {
    if (!DeviceService.instance) DeviceService.instance = new DeviceService();
    return DeviceService.instance;
  }

  getCurrentDeviceId(): string {
    return getOrCreateDeviceId();
  }

  // ── Registrar dispositivo atual na tabela user_devices ───────
  async registerDevice(userId: string): Promise<{ success: boolean; deviceId: string | null; error?: string }> {
    try {
      const deviceInfo = await getFullDeviceInfo();

      // Normaliza device_type para os valores aceitos pelo banco: tv | mobile | web
      const rawType = (deviceInfo.deviceType || 'web').toLowerCase();
      const deviceType: DeviceType =
        rawType === 'tv' ? 'tv' : rawType === 'mobile' ? 'mobile' : 'web';

      const payload = {
        user_id: userId,
        device_id: deviceInfo.deviceId,
        device_name: deviceInfo.deviceName || 'Dispositivo desconhecido',
        device_type: deviceType,
        last_active: new Date().toISOString(),
        is_current: true,
        is_active: true,
        user_agent: navigator.userAgent,
        os: deviceInfo.os ?? null,
        browser: deviceInfo.browser ?? null,
        screen_resolution: deviceInfo.screenResolution ?? null,
        timezone: deviceInfo.timezone ?? null,
        language: deviceInfo.language ?? null,
        fingerprint: deviceInfo.fingerprint ?? null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('user_devices')
        .upsert(payload, { onConflict: 'user_id,device_id' });

      if (error) return { success: false, deviceId: null, error: error.message };

      // Marcar outros como não-current
      await supabase
        .from('user_devices')
        .update({ is_current: false, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .neq('device_id', deviceInfo.deviceId);

      return { success: true, deviceId: deviceInfo.deviceId };
    } catch (err: any) {
      return { success: false, deviceId: null, error: err.message };
    }
  }

  // ── Buscar todos os dispositivos do usuário ──────────────────
  async getUserDevices(userId: string): Promise<{ devices: UserDevice[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('user_devices')
        .select(
          'id, device_id, device_name, device_type, location, last_active, is_current, is_active, created_at, ip_address, os, browser, screen_resolution, timezone'
        )
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('last_active', { ascending: false });

      if (error) return { devices: [], error: error.message };

      return { devices: (data as UserDevice[]) || [] };
    } catch (err: any) {
      return { devices: [], error: err.message };
    }
  }

  // ── Remover dispositivo ──────────────────────────────────────
  async removeDevice(deviceId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_devices')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('device_id', deviceId)
        .eq('user_id', userId);

      return !error;
    } catch {
      return false;
    }
  }

  // ── Desconectar todos os outros dispositivos ─────────────────
  async logoutOtherDevices(currentDeviceId: string, userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('user_devices')
        .update({ is_active: false, is_current: false, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .neq('device_id', currentDeviceId)
        .eq('is_active', true)
        .select('id');

      if (error) return 0;
      return data?.length || 0;
    } catch {
      return 0;
    }
  }

  // ── Atualizar last_active (debounced) ────────────────────────
  async updateLastActivity(userId?: string): Promise<boolean> {
    if (this.activityDebounceTimer) clearTimeout(this.activityDebounceTimer);

    return new Promise(resolve => {
      this.activityDebounceTimer = setTimeout(async () => {
        try {
          const deviceId = getOrCreateDeviceId();
          const { error } = await supabase
            .from('user_devices')
            .update({ last_active: new Date().toISOString(), updated_at: new Date().toISOString() })
            .eq('device_id', deviceId)
            .eq('user_id', userId || '');

          resolve(!error);
        } catch {
          resolve(false);
        }
      }, this.ACTIVITY_DEBOUNCE_MS);
    });
  }

  // ── Contar dispositivos ativos ───────────────────────────────
  async countActiveDevices(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('user_devices')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_active', true);

      return error ? 0 : count || 0;
    } catch {
      return 0;
    }
  }
}

export const deviceService = DeviceService.getInstance();
export default deviceService;
