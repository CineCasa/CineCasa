/**
 * Utilitário para limpar dados desnecessários do localStorage
 * Preserva dados importantes como perfil atual e preferências
 */

// Chaves que devem ser preservadas (nunca removidas)
const PROTECTED_KEYS = [
  'current_profile_id',
  'selectedProfile',
  'notification_preferences',
  'sb-aqxgqyslqwvtzzqkltfx-auth-token', // Supabase auth
];

// Padrões de chaves que podem ser limpas (cache, timestamps temporários)
const CLEANABLE_PATTERNS = [
  /^lancamentos_cache_/,      // Cache de lançamentos
  /^lancamentos_timestamp_/,   // Timestamps de lançamentos
  /^recomendacoes_cache_/,    // Cache de recomendações
  /^recomendacoes_timestamp_/, // Timestamps de recomendações
  /^viewing_history_/,        // Histórico de visualização local
  /^VIEWING_HISTORY_/,        // Constante do hook
];

// Chaves específicas que podem ser limpas
const CLEANABLE_KEYS = [
  'last_episode_check',
  'last_recommendation_date',
  'last_continue_watching_reminder',
  'recent_searches',
  'searchHistory',
  'paixaofavs',
  'selectedPlan',
];

/**
 * Verifica se uma chave deve ser protegida
 */
function isProtected(key: string): boolean {
  return PROTECTED_KEYS.includes(key);
}

/**
 * Verifica se uma chave corresponde aos padrões limpáveis
 */
function isCleanablePattern(key: string): boolean {
  return CLEANABLE_PATTERNS.some(pattern => pattern.test(key));
}

/**
 * Verifica se uma chave está na lista de chaves limpáveis
 */
function isCleanableKey(key: string): boolean {
  return CLEANABLE_KEYS.includes(key);
}

/**
 * Limpa todos os dados desnecessários do localStorage
 * Preserva chaves protegidas
 */
export function cleanupLocalStorage(): {
  removed: string[];
  preserved: string[];
  totalRemoved: number;
} {
  const removed: string[] = [];
  const preserved: string[] = [];

  // Iterar sobre todas as chaves do localStorage
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (!key) continue;

    // Verificar se deve ser protegida
    if (isProtected(key)) {
      preserved.push(key);
      continue;
    }

    // Verificar se deve ser limpa (padrão ou chave específica)
    if (isCleanablePattern(key) || isCleanableKey(key)) {
      localStorage.removeItem(key);
      removed.push(key);
    }
  }

  console.log('[localStorageCleanup] Limpeza concluída:', {
    removed: removed.length,
    preserved: preserved.length,
    keys: removed,
  });

  return {
    removed,
    preserved,
    totalRemoved: removed.length,
  };
}

/**
 * Limpa apenas cache de dados (lançamentos, recomendações, histórico)
 * Útil para forçar refresh de dados
 */
export function clearDataCache(): {
  removed: string[];
  totalRemoved: number;
} {
  const removed: string[] = [];

  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (!key) continue;

    // Limpar apenas padrões de cache
    if (isCleanablePattern(key)) {
      localStorage.removeItem(key);
      removed.push(key);
    }
  }

  console.log('[localStorageCleanup] Cache limpo:', {
    removed: removed.length,
    keys: removed,
  });

  return {
    removed,
    totalRemoved: removed.length,
  };
}

/**
 * Limpa apenas timestamps e históricos temporários
 */
export function clearTempData(): {
  removed: string[];
  totalRemoved: number;
} {
  const removed: string[] = [];

  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (!key) continue;

    // Limpar apenas chaves temporárias específicas
    if (isCleanableKey(key)) {
      localStorage.removeItem(key);
      removed.push(key);
    }
  }

  console.log('[localStorageCleanup] Dados temporários limpos:', {
    removed: removed.length,
    keys: removed,
  });

  return {
    removed,
    totalRemoved: removed.length,
  };
}

/**
 * Retorna informações sobre o estado atual do localStorage
 */
export function getLocalStorageInfo(): {
  totalKeys: number;
  protectedKeys: string[];
  cleanableKeys: string[];
  otherKeys: string[];
} {
  const protectedKeys: string[] = [];
  const cleanableKeys: string[] = [];
  const otherKeys: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;

    if (isProtected(key)) {
      protectedKeys.push(key);
    } else if (isCleanablePattern(key) || isCleanableKey(key)) {
      cleanableKeys.push(key);
    } else {
      otherKeys.push(key);
    }
  }

  return {
    totalKeys: localStorage.length,
    protectedKeys,
    cleanableKeys,
    otherKeys,
  };
}
