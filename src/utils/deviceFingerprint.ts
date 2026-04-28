/**
 * Device Fingerprint Utility
 * Gera device_id único e persistente para cada dispositivo.
 */

const DEVICE_ID_KEY = 'cinecasa_device_id';

export type DeviceType = 'tv' | 'mobile' | 'web';

export interface DeviceInfo {
  deviceId: string;
  fingerprint: string;
  deviceName: string;
  deviceType: DeviceType;
  os: string;
  browser: string;
  screenResolution: string;
  timezone: string;
  language: string;
}

export function detectDeviceType(): DeviceType {
  const ua = navigator.userAgent.toLowerCase();
  const tvPatterns = [/smart-tv|smarttv|googletv|appletv|hbbtv|tizen|webos|samsung.*tv|lg.*tv|bravia|firetv|android.*tv/i];
  for (const pattern of tvPatterns) {
    if (pattern.test(ua)) return 'tv';
  }
  if (window.screen.width >= 1920 && !('ontouchstart' in window)) {
    if (!/mobile|android.*mobile|iphone|ipad/i.test(ua)) return 'tv';
  }
  const mobilePatterns = [/mobile|android.*mobile|iphone|ipad|ipod|opera mini/i];
  for (const pattern of mobilePatterns) {
    if (pattern.test(ua)) return 'mobile';
  }
  if (('ontouchstart' in window) && window.screen.width < 1366) return 'mobile';
  return 'web';
}

export function detectOS(): string {
  const ua = navigator.userAgent;
  if (/Windows NT 10/i.test(ua)) return 'Windows 10/11';
  if (/Windows NT 6/i.test(ua)) return 'Windows';
  if (/Mac OS X/i.test(ua) || /Macintosh/i.test(ua)) return 'macOS';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Android/i.test(ua)) return 'Android';
  if (/Linux/i.test(ua)) return 'Linux';
  if (/Tizen/i.test(ua)) return 'Tizen';
  if (/WebOS/i.test(ua)) return 'webOS';
  return 'Unknown';
}

export function detectBrowser(): string {
  const ua = navigator.userAgent;
  if (/Edg/i.test(ua)) return 'Edge';
  if (/Chrome/i.test(ua) && !/OPR/i.test(ua)) return 'Chrome';
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return 'Safari';
  if (/Firefox/i.test(ua)) return 'Firefox';
  if (/OPR|Opera/i.test(ua)) return 'Opera';
  if (/SamsungBrowser/i.test(ua)) return 'Samsung Internet';
  return 'Unknown';
}

export async function generateFingerprint(): Promise<string> {
  const components = {
    ua: navigator.userAgent,
    lang: navigator.language,
    platform: navigator.platform,
    screen: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    cores: navigator.hardwareConcurrency || 0,
    touch: 'ontouchstart' in window,
  };
  const data = new TextEncoder().encode(JSON.stringify(components));
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function getOrCreateDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (id) return id;
  id = sessionStorage.getItem(DEVICE_ID_KEY);
  if (id) {
    try { localStorage.setItem(DEVICE_ID_KEY, id); } catch {}
    return id;
  }
  id = crypto.randomUUID();
  try { localStorage.setItem(DEVICE_ID_KEY, id); } catch {}
  try { sessionStorage.setItem(DEVICE_ID_KEY, id); } catch {}
  return id;
}

export function generateDeviceName(): string {
  const type = detectDeviceType();
  const os = detectOS();
  const browser = detectBrowser();
  if (type === 'tv') return os.includes('Tizen') ? 'Samsung TV' : os.includes('webOS') ? 'LG TV' : `Smart TV (${browser})`;
  if (type === 'mobile') return os === 'iOS' ? (/iPad/i.test(navigator.userAgent) ? 'iPad' : 'iPhone') : `${os} Mobile`;
  return `${os} (${browser})`;
}

export async function getApproximateLocation(): Promise<string | null> {
  try {
    const res = await fetch('https://ipapi.co/json/', { headers: { 'Accept': 'application/json' } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.city && data.country_name ? `${data.city}, ${data.country_name}` : data.country_name || null;
  } catch {
    return null;
  }
}

export async function getFullDeviceInfo(): Promise<DeviceInfo> {
  const [fingerprint, location] = await Promise.all([
    generateFingerprint(),
    getApproximateLocation()
  ]);
  return {
    deviceId: getOrCreateDeviceId(),
    fingerprint,
    deviceName: generateDeviceName(),
    deviceType: detectDeviceType(),
    os: detectOS(),
    browser: detectBrowser(),
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
  };
}
