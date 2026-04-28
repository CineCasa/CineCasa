import { supabase } from '@/integrations/supabase/client';
import { getFullDeviceInfo, getOrCreateDeviceId, generateFingerprint } from '@/utils/deviceFingerprint';
import type { DeviceInfo, DeviceType } from '@/utils/deviceFingerprint';

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
  private readonly ACTIVITY_DEBOUNCE_MS = 30000; // 30 segundos

  static getInstance(): DeviceService {
    if (!DeviceService.instance) {
      DeviceService.instance = new DeviceService();
    }
    return DeviceService.instance;
  }

  async registerDevice(userId: string): Promise<{ success: boolean; deviceId: string | null; error?: string }> {
    try {
      const deviceInfo = await getFullDeviceInfo();
      const { data, error } = await supabase.rpc('register_device', {
        p_user_id: userId,
        p_device_id: deviceInfo.deviceId,
        p_device_name: deviceInfo.deviceName,
        p_device_type: deviceInfo.deviceType,
        p_location: null, // Será preenchido pelo backend ou próxima atualização
        p_ip_address: null,
        p_user_agent: navigator.userAgent,
        p_os: deviceInfo.os,
        p_browser: deviceInfo.browser,
        p_screen_resolution: deviceInfo.screenResolution,
        p_timezone: deviceInfo.timezone,
        p_language: deviceInfo.language,
        p_fingerprint: deviceInfo.fingerprint,
      });

      if (error) {
        console.error('[DeviceService] Erro ao registrar dispositivo:', error);
        return { success: false, deviceId: null, error: error.message };
      }

      console.log('[DeviceService] Dispositivo registrado:', deviceInfo.deviceName, deviceInfo.deviceId);
      return { success: true, deviceId: deviceInfo.deviceId };
    } catch (err: any) {
      console.error('[DeviceService] Exceção ao registrar:', err);
      return { success: false, deviceId: null, error: err.message };
    }
  }

  async updateLastActivity(userId?: string): Promise<boolean> {
    // Debounce: só atualiza após 30s da última chamada
    if (this.activityDebounceTimer) {
      clearTimeout(this.activityDebounceTimer);
    }

    return new Promise((resolve) => {
      this.activityDebounceTimer = setTimeout(async () => {
        try {
          const deviceId = getOrCreateDeviceId();
          const { error } = await supabase.rpc('update_device_activity', {
            p_device_id: deviceId,
            p_user_id: userId || null,
          });

          if (error) {
            console.warn('[DeviceService] Erro ao atualizar atividade:', error.message);
            resolve(false);
          } else {
            resolve(true);
          }
        } catch {
          resolve(false);
        }
      }, this.ACTIVITY_DEBOUNCE_MS);
    });
  }

  async getUserDevices(userId: string): Promise<{ devices: UserDevice[]; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('get_user_devices', {
        p_user_id: userId,
      });

      if (error) {
        console.error('[DeviceService] Erro ao buscar dispositivos:', error);
        return { devices: [], error: error.message };
      }

      return { devices: (data as UserDevice[]) || [] };
    } catch (err: any) {
      console.error('[DeviceService] Exceção ao buscar:', err);
      return { devices: [], error: err.message };
    }
  }

  async removeDevice(deviceId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('remove_device', {
        p_device_id: deviceId,
        p_user_id: userId,
      });

      if (error) {
        console.error('[DeviceService] Erro ao remover:', error);
        return false;
      }

      console.log('[DeviceService] Dispositivo removido:', deviceId);
      return true;
    } catch (err) {
      console.error('[DeviceService] Exceção ao remover:', err);
      return false;
    }
  }

  async markCurrentDevice(deviceId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('mark_current_device', {
        p_device_id: deviceId,
        p_user_id: userId,
      });

      if (error) {
        console.error('[DeviceService] Erro ao marcar atual:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('[DeviceService] Exceção ao marcar atual:', err);
      return false;
    }
  }

  async logoutOtherDevices(currentDeviceId: string, userId: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('logout_other_devices', {
        p_current_device_id: currentDeviceId,
        p_user_id: userId,
      });

      if (error) {
        console.error('[DeviceService] Erro no logout remoto:', error);
        return 0;
      }

      const count = data as number;
      console.log('[DeviceService] Logout remoto em', count, 'dispositivos');
      return count;
    } catch (err) {
      console.error('[DeviceService] Exceção no logout remoto:', err);
      return 0;
    }
  }

  async countActiveDevices(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('count_active_devices', {
        p_user_id: userId,
      });

      if (error) {
        console.error('[DeviceService] Erro ao contar:', error);
        return 0;
      }

      return (data as number) || 0;
    } catch {
      return 0;
    }
  }

  getCurrentDeviceId(): string {
    return getOrCreateDeviceId();
  }
}

export const deviceService = DeviceService.getInstance();
export default deviceService;
