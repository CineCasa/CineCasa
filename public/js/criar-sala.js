/**
 * Função utilitária para criar salas de "Assistir Juntos" (Watch Party)
 * 
 * Funcionalidades:
 * - Gera ID único para sala
 * - Retorna link pronto para compartilhamento
 * - Opcional: Cria sala no servidor via API
 * - Fácil de integrar em qualquer parte do projeto
 */

/**
 * Cria uma nova sala de Watch Party
 * @param {Object} options - Opções para criação da sala
 * @param {string} options.videoUrl - URL do vídeo (opcional)
 * @param {boolean} options.redirect - Se deve redirecionar para a sala após criar (padrão: false)
 * @param {boolean} options.createOnServer - Se deve criar sala no servidor via API (padrão: false)
 * @returns {Promise<Object>} Informações da sala criada
 * 
 * Retorno:
 * - roomId: ID único da sala
 * - roomUrl: URL relativa da sala (/watch.html?room=ID)
 * - fullUrl: URL completa para compartilhamento
 * - videoUrl: URL do vídeo
 * 
 * Exemplo de uso:
 * ```javascript
 * // Criar sala simples
 * const sala = await criarSala();
 * console.log(sala.fullUrl); // Copiar para compartilhar
 * 
 * // Criar sala com vídeo específico e redirecionar
 * const sala = await criarSala({
 *   videoUrl: 'https://exemplo.com/video.mp4',
 *   redirect: true
 * });
 * 
 * // Criar sala no servidor (persistente)
 * const sala = await criarSala({
 *   videoUrl: 'https://exemplo.com/video.mp4',
 *   createOnServer: true
 * });
 * ```
 */
async function criarSala(options = {}) {
  const {
    videoUrl = '',
    redirect = false,
    createOnServer = false
  } = options;
  
  console.log('[WatchParty] Criando nova sala...');
  
  try {
    // Gera ID único para a sala (UUID curto)
    const roomId = generateRoomId();
    
    // Constrói URLs
    const baseUrl = window.location.origin;
    const roomUrl = `/watch.html?room=${roomId}${videoUrl ? '&video=' + encodeURIComponent(videoUrl) : ''}`;
    const fullUrl = `${baseUrl}${roomUrl}`;
    
    // Se solicitado, cria sala no servidor via API
    let serverResponse = null;
    if (createOnServer) {
      try {
        const apiUrl = 'http://localhost:3001/api/create-room';
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoUrl })
        });
        
        if (response.ok) {
          serverResponse = await response.json();
          console.log('[WatchParty] Sala criada no servidor:', serverResponse);
        }
      } catch (error) {
        console.warn('[WatchParty] Erro ao criar sala no servidor:', error);
        console.log('[WatchParty] Continuando com sala local...');
      }
    }
    
    // Monta resultado
    const result = {
      success: true,
      roomId: serverResponse?.roomId || roomId,
      roomUrl: serverResponse?.roomUrl || roomUrl,
      fullUrl: serverResponse?.fullUrl || fullUrl,
      videoUrl,
      createdAt: new Date().toISOString(),
      timestamp: Date.now()
    };
    
    console.log('[WatchParty] Sala criada com sucesso:', result);
    
    // Se solicitado, redireciona para a sala
    if (redirect) {
      window.location.href = result.roomUrl;
    }
    
    return result;
    
  } catch (error) {
    console.error('[WatchParty] Erro ao criar sala:', error);
    return {
      success: false,
      error: error.message,
      roomId: null,
      roomUrl: null,
      fullUrl: null
    };
  }
}

/**
 * Gera ID único para a sala (UUID curto de 12 caracteres)
 * @returns {string} ID único
 */
function generateRoomId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  // Gera 12 caracteres aleatórios
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Adiciona timestamp em base36 para garantir unicidade
  result += Date.now().toString(36).substring(0, 4);
  
  return result;
}

/**
 * Copia link da sala para o clipboard
 * @param {string} link - URL da sala
 * @returns {Promise<boolean>} true se copiou com sucesso
 */
async function copiarLinkSala(link) {
  if (!link) {
    console.error('[WatchParty] Link não fornecido');
    return false;
  }
  
  try {
    await navigator.clipboard.writeText(link);
    console.log('[WatchParty] Link copiado com sucesso:', link);
    return true;
  } catch (error) {
    console.error('[WatchParty] Erro ao copiar link:', error);
    
    // Fallback: copia usando método alternativo
    try {
      const textArea = document.createElement('textarea');
      textArea.value = link;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      console.log('[WatchParty] Link copiado via fallback');
      return true;
    } catch (fallbackError) {
      console.error('[WatchParty] Falha no fallback:', fallbackError);
      return false;
    }
  }
}

/**
 * Compartilha sala usando Web Share API (mobile) ou clipboard
 * @param {Object} sala - Objeto retornado por criarSala()
 * @returns {Promise<boolean>} true se compartilhou com sucesso
 */
async function compartilharSala(sala) {
  if (!sala || !sala.fullUrl) {
    console.error('[WatchParty] Objeto sala inválido');
    return false;
  }
  
  // Tenta usar Web Share API (funciona em mobile)
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Assistir Juntos - CineCasa',
        text: `Junte-se a mim para assistir! Sala: ${sala.roomId}`,
        url: sala.fullUrl
      });
      console.log('[WatchParty] Compartilhado via Web Share API');
      return true;
    } catch (error) {
      // Usuário cancelou ou erro - continua para fallback
      console.log('[WatchParty] Web Share API cancelado ou erro:', error);
    }
  }
  
  // Fallback: copia para clipboard
  return await copiarLinkSala(sala.fullUrl);
}

/**
 * Verifica se uma sala existe no servidor
 * @param {string} roomId - ID da sala
 * @returns {Promise<boolean>} true se a sala existe
 */
async function verificarSala(roomId) {
  if (!roomId) return false;
  
  try {
    const apiUrl = `http://localhost:3001/api/room/${roomId}`;
    const response = await fetch(apiUrl);
    
    if (response.ok) {
      const data = await response.json();
      return data.success === true;
    }
    
    return false;
  } catch (error) {
    console.error('[WatchParty] Erro ao verificar sala:', error);
    return false;
  }
}

/**
 * Obtém informações de uma sala existente
 * @param {string} roomId - ID da sala
 * @returns {Promise<Object|null>} Informações da sala ou null se não existir
 */
async function obterInfoSala(roomId) {
  if (!roomId) return null;
  
  try {
    const apiUrl = `http://localhost:3001/api/room/${roomId}`;
    const response = await fetch(apiUrl);
    
    if (response.ok) {
      const data = await response.json();
      return data.success ? data.room : null;
    }
    
    return null;
  } catch (error) {
    console.error('[WatchParty] Erro ao obter info da sala:', error);
    return null;
  }
}

/**
 * Entra em uma sala existente (redireciona para página da sala)
 * @param {string} roomId - ID da sala
 * @param {string} videoUrl - URL do vídeo (opcional)
 */
function entrarSala(roomId, videoUrl = '') {
  if (!roomId) {
    console.error('[WatchParty] Room ID não fornecido');
    return;
  }
  
  const roomUrl = `/watch.html?room=${roomId}${videoUrl ? '&video=' + encodeURIComponent(videoUrl) : ''}`;
  window.location.href = roomUrl;
}

/**
 * Extrai roomId da URL atual
 * @returns {string|null} Room ID ou null se não encontrado
 */
function obterRoomIdDaUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('room');
}

// ============================================
// EXPORTAÇÃO
// ============================================

// Exporta para uso em módulos ES6
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    criarSala,
    copiarLinkSala,
    compartilharSala,
    verificarSala,
    obterInfoSala,
    entrarSala,
    obterRoomIdDaUrl,
    generateRoomId
  };
}

// Expõe funções globalmente para uso via script tag
window.WatchPartyUtils = {
  criarSala,
  copiarLinkSala,
  compartilharSala,
  verificarSala,
  obterInfoSala,
  entrarSala,
  obterRoomIdDaUrl,
  generateRoomId
};

// Também expõe função principal diretamente no window
window.criarSala = criarSala;
window.copiarLinkSala = copiarLinkSala;
window.compartilharSala = compartilharSala;
window.verificarSala = verificarSala;
window.obterInfoSala = obterInfoSala;
window.entrarSala = entrarSala;
window.obterRoomIdDaUrl = obterRoomIdDaUrl;

console.log('[WatchParty] Utilitários de sala carregados');
