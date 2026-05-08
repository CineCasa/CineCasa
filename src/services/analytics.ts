/**
 * ANALYTICS E MONITORAMENTO
 * - Sentry: rastreamento de erros em produção
 * - Umami: analytics anônimas (alternativa leve ao Google Analytics)
 * - PostHog: feature flags e behavioral analytics (opcional)
 */

// ── SENTRY (Error tracking) ────────────────────────────────────
// Instalar: npm install @sentry/react @sentry/tracing
// Usar em main.tsx:
//   import * as Sentry from "@sentry/react";
//   Sentry.init({ dsn: "seu_dsn_aqui", environment: import.meta.env.MODE });
//   const SentryRoutes = Sentry.withSentryRouting(Routes);

export function captureException(error: Error, context?: Record<string, any>) {
  const Sentry = (window as any).Sentry;
  if (!Sentry) return;
  Sentry.captureException(error, { extra: context });
  console.error('[Error captured to Sentry]', error);
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  const Sentry = (window as any).Sentry;
  if (!Sentry) return;
  Sentry.captureMessage(message, level);
}

// ── UMAMI (Analytics anônimas) ────────────────────────────────
// Instalar: npm install @umami/web
// Adicionar em index.html:
//   <script async src="https://cloud.umami.is/script.js" data-website-id="seu_id"></script>

export function trackEvent(name: string, data?: Record<string, any>) {
  const umami = (window as any).umami;
  if (!umami) return;
  umami.track(name, data || {});
  if (import.meta.env.DEV) console.log('[Umami event]', name, data);
}

export function trackPageView(path: string) {
  const umami = (window as any).umami;
  if (!umami) return;
  umami.pageView({ path });
}

export const analyticsEvents = {
  // Autenticação
  userSignUp: (method: string) => trackEvent('user_signup', { method }),
  userLogin: (method: string) => trackEvent('user_login', { method }),
  userLogout: () => trackEvent('user_logout'),
  userSubscribe: (plan: string) => trackEvent('user_subscribe', { plan }),
  userCancelSubscribe: () => trackEvent('user_cancel_subscription'),

  // Conteúdo
  contentPlay: (contentId: string, type: string, title: string) =>
    trackEvent('content_play', { contentId, type, title }),
  contentPause: (contentId: string, watchTime: number) =>
    trackEvent('content_pause', { contentId, watchTime }),
  contentComplete: (contentId: string, type: string, duration: number) =>
    trackEvent('content_complete', { contentId, type, duration }),
  contentRate: (contentId: string, rating: number) =>
    trackEvent('content_rate', { contentId, rating }),
  contentAddFavorite: (contentId: string) =>
    trackEvent('content_add_favorite', { contentId }),
  contentRemoveFavorite: (contentId: string) =>
    trackEvent('content_remove_favorite', { contentId }),
  contentAddWatchlist: (contentId: string) =>
    trackEvent('content_add_watchlist', { contentId }),

  // Search
  searchQuery: (query: string, resultCount: number) =>
    trackEvent('search_query', { query, resultCount }),

  // Gamificação
  achievementUnlocked: (code: string, title: string, xpGain: number) =>
    trackEvent('achievement_unlocked', { code, title, xpGain }),
  levelUp: (newLevel: number, totalXp: number) =>
    trackEvent('level_up', { newLevel, totalXp }),
  streakMilestone: (days: number) =>
    trackEvent('streak_milestone', { days }),

  // Social
  watchPartyCreated: (roomId: string, participantCount: number) =>
    trackEvent('watch_party_created', { roomId, participantCount }),
  watchPartySent: (invites: number) =>
    trackEvent('watch_party_sent', { invites }),
  watchPartyChatMessage: (roomId: string) =>
    trackEvent('watch_party_chat', { roomId }),

  // UI
  pageView: (pageName: string) => trackPageView(`/${pageName}`),
  navigationClick: (target: string) =>
    trackEvent('navigation_click', { target }),
  settingsChange: (setting: string, value: string) =>
    trackEvent('settings_change', { setting, value }),

  // Erro
  appError: (errorName: string, context?: string) =>
    trackEvent('app_error', { errorName, context }),
};

// ── PostHog (Opcional - feature flags e behavioral analytics) ──
// Instalar: npm install posthog-js
// Usar em main.tsx:
//   import posthog from 'posthog-js'
//   posthog.init(import.meta.env.VITE_POSTHOG_KEY, { api_host: 'https://us.posthog.com' })

export function isFeatureEnabled(flagName: string): boolean {
  const posthog = (window as any).posthog;
  if (!posthog) return false;
  return posthog.isFeatureEnabled(flagName);
}

export function capturePostHogEvent(event: string, properties?: Record<string, any>) {
  const posthog = (window as any).posthog;
  if (!posthog) return;
  posthog.capture(event, properties || {});
}

// ── Performance monitoring ────────────────────────────────────
export function initPerformanceMonitoring() {
  if (!('PerformanceObserver' in window)) return;

  // Largest Contentful Paint (LCP)
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      const lcp = lastEntry.renderTime || lastEntry.loadTime;
      if (lcp) {
        trackEvent('web_vitals', { metric: 'LCP', value: Math.round(lcp) });
        if (import.meta.env.DEV) console.log('[LCP]', Math.round(lcp) + 'ms');
      }
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch { }

  // Cumulative Layout Shift (CLS)
  try {
    const clsObserver = new PerformanceObserver((list) => {
      let clsValue = 0;
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      trackEvent('web_vitals', { metric: 'CLS', value: Math.round(clsValue * 100) / 100 });
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  } catch { }

  // First Input Delay (FID) - deprecado mas ainda útil
  try {
    const fidObserver = new PerformanceObserver((list) => {
      const entry = list.getEntries()[0] as any;
      if (entry) {
        const fid = entry.processingStart - entry.startTime;
        trackEvent('web_vitals', { metric: 'FID', value: Math.round(fid) });
      }
    });
    fidObserver.observe({ entryTypes: ['first-input'] });
  } catch { }

  // Page load time
  window.addEventListener('load', () => {
    const perfData = performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
    trackEvent('page_load_time', { time: pageLoadTime });
    if (import.meta.env.DEV) console.log('[Page Load]', pageLoadTime + 'ms');
  });
}
