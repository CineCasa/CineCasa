/**
 * Servidor Node.js para Sistema "Assistir Juntos" (Watch Party)
 * 
 * Funcionalidades:
 * - Gerenciamento de salas em memória
 * - Sincronização de play/pause/seek via Socket.IO
 * - Broadcast para todos na sala exceto remetente
 * - Sincronização periódica a cada 5 segundos
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Configuração do servidor
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Permite conexões de qualquer origem (ajustar para produção)
    methods: ["GET", "POST"]
  }
});

// Porta do servidor
const PORT = process.env.WATCH_PARTY_PORT || 3001;

// ============================================
// GERENCIAMENTO DE SALAS EM MEMÓRIA
// ============================================
/**
 * Estrutura das salas:
 * rooms = {
 *   "room-id-123": {
 *     roomId: "room-id-123",
 *     videoUrl: "https://exemplo.com/video.mp4",
 *     currentTime: 0,
 *     isPlaying: false,
 *     users: ["socket-id-1", "socket-id-2"],
 *     createdAt: timestamp,
 *     lastActivity: timestamp
 *   }
 * }
 */
const rooms = new Map();

// ============================================
// FUNÇÕES UTILITÁRIAS
// ============================================

/**
 * Gera ID único para sala (UUID curto)
 * @returns {string} ID único de 8 caracteres
 */
function generateRoomId() {
  return Math.random().toString(36).substring(2, 10) + 
         Math.random().toString(36).substring(2, 6);
}

/**
 * Cria nova sala com estado inicial
 * @param {string} roomId - ID da sala
 * @param {string} videoUrl - URL do vídeo
 * @returns {Object} Estado inicial da sala
 */
function createRoom(roomId, videoUrl = '') {
  const roomState = {
    roomId,
    videoUrl,
    currentTime: 0,
    isPlaying: false,
    users: [],
    createdAt: Date.now(),
    lastActivity: Date.now()
  };
  rooms.set(roomId, roomState);
  return roomState;
}

/**
 * Obtém ou cria sala
 * @param {string} roomId - ID da sala
 * @returns {Object} Estado da sala
 */
function getOrCreateRoom(roomId) {
  if (!rooms.has(roomId)) {
    return createRoom(roomId);
  }
  return rooms.get(roomId);
}

/**
 * Atualiza estado do vídeo na sala
 * @param {string} roomId - ID da sala
 * @param {Object} state - Novo estado {currentTime, isPlaying}
 */
function updateRoomState(roomId, state) {
  const room = rooms.get(roomId);
  if (room) {
    room.currentTime = state.currentTime !== undefined ? state.currentTime : room.currentTime;
    room.isPlaying = state.isPlaying !== undefined ? state.isPlaying : room.isPlaying;
    room.videoUrl = state.videoUrl !== undefined ? state.videoUrl : room.videoUrl;
    room.lastActivity = Date.now();
  }
}

/**
 * Adiciona usuário à sala
 * @param {string} roomId - ID da sala
 * @param {string} socketId - ID do socket
 */
function addUserToRoom(roomId, socketId) {
  const room = getOrCreateRoom(roomId);
  if (!room.users.includes(socketId)) {
    room.users.push(socketId);
  }
  room.lastActivity = Date.now();
  return room;
}

/**
 * Remove usuário da sala
 * @param {string} roomId - ID da sala
 * @param {string} socketId - ID do socket
 */
function removeUserFromRoom(roomId, socketId) {
  const room = rooms.get(roomId);
  if (room) {
    room.users = room.users.filter(id => id !== socketId);
    room.lastActivity = Date.now();
    
    // Se sala vazia por mais de 10 minutos, remove
    if (room.users.length === 0) {
      setTimeout(() => {
        const currentRoom = rooms.get(roomId);
        if (currentRoom && currentRoom.users.length === 0 && 
            Date.now() - currentRoom.lastActivity > 10 * 60 * 1000) {
          rooms.delete(roomId);
          console.log(`[WatchParty] Sala ${roomId} removida por inatividade`);
        }
      }, 10 * 60 * 1000);
    }
  }
}

// ============================================
// CONFIGURAÇÃO EXPRESS
// ============================================

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint para criar sala via API (opcional)
app.post('/api/create-room', express.json(), (req, res) => {
  const { videoUrl } = req.body;
  const roomId = generateRoomId();
  createRoom(roomId, videoUrl);
  
  res.json({
    success: true,
    roomId,
    roomUrl: `/watch.html?room=${roomId}`,
    fullUrl: `${req.protocol}://${req.get('host')}/watch.html?room=${roomId}`
  });
});

// Endpoint para verificar estado da sala
app.get('/api/room/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId);
  
  if (!room) {
    return res.status(404).json({ success: false, error: 'Sala não encontrada' });
  }
  
  res.json({
    success: true,
    room: {
      roomId: room.roomId,
      videoUrl: room.videoUrl,
      currentTime: room.currentTime,
      isPlaying: room.isPlaying,
      userCount: room.users.length
    }
  });
});

// ============================================
// EVENTOS SOCKET.IO
// ============================================

io.on('connection', (socket) => {
  console.log(`[WatchParty] Novo usuário conectado: ${socket.id}`);
  
  let currentRoom = null;
  
  // ------------------------------------------
  // EVENTO: Entrar na sala
  // ------------------------------------------
  socket.on('join-room', (data) => {
    const { roomId, videoUrl } = data;
    
    // Sai da sala anterior se estiver em uma
    if (currentRoom) {
      socket.leave(currentRoom);
      removeUserFromRoom(currentRoom, socket.id);
    }
    
    // Entra na nova sala
    currentRoom = roomId;
    socket.join(roomId);
    
    // Obtém ou cria sala
    const room = addUserToRoom(roomId, socket.id);
    
    // Se URL do vídeo foi fornecida, atualiza
    if (videoUrl) {
      room.videoUrl = videoUrl;
    }
    
    console.log(`[WatchParty] Usuário ${socket.id} entrou na sala ${roomId}`);
    console.log(`[WatchParty] Total de usuários na sala: ${room.users.length}`);
    
    // Envia estado atual do vídeo para o novo usuário
    socket.emit('room-joined', {
      success: true,
      roomId,
      videoUrl: room.videoUrl,
      currentTime: room.currentTime,
      isPlaying: room.isPlaying,
      userCount: room.users.length
    });
    
    // Notifica outros usuários que alguém entrou
    socket.to(roomId).emit('user-joined', {
      userId: socket.id,
      userCount: room.users.length
    });
  });
  
  // ------------------------------------------
  // EVENTO: Play no vídeo
  // ------------------------------------------
  socket.on('video-play', (data) => {
    if (!currentRoom) return;
    
    const { currentTime } = data;
    updateRoomState(currentRoom, { currentTime, isPlaying: true });
    
    console.log(`[WatchParty] Play na sala ${currentRoom} - tempo: ${currentTime}s`);
    
    // Broadcast para todos na sala EXCETO remetente
    socket.to(currentRoom).emit('video-play', {
      currentTime,
      timestamp: Date.now()
    });
  });
  
  // ------------------------------------------
  // EVENTO: Pause no vídeo
  // ------------------------------------------
  socket.on('video-pause', (data) => {
    if (!currentRoom) return;
    
    const { currentTime } = data;
    updateRoomState(currentRoom, { currentTime, isPlaying: false });
    
    console.log(`[WatchParty] Pause na sala ${currentRoom} - tempo: ${currentTime}s`);
    
    // Broadcast para todos na sala EXCETO remetente
    socket.to(currentRoom).emit('video-pause', {
      currentTime,
      timestamp: Date.now()
    });
  });
  
  // ------------------------------------------
  // EVENTO: Seek (mudança de tempo)
  // ------------------------------------------
  socket.on('video-seek', (data) => {
    if (!currentRoom) return;
    
    const { currentTime } = data;
    updateRoomState(currentRoom, { currentTime });
    
    console.log(`[WatchParty] Seek na sala ${currentRoom} - novo tempo: ${currentTime}s`);
    
    // Broadcast para todos na sala EXCETO remetente
    socket.to(currentRoom).emit('video-seek', {
      currentTime,
      timestamp: Date.now()
    });
  });
  
  // ------------------------------------------
  // EVENTO: Solicitar sincronização
  // ------------------------------------------
  socket.on('sync-request', () => {
    if (!currentRoom) return;
    
    const room = rooms.get(currentRoom);
    if (room) {
      socket.emit('sync-response', {
        currentTime: room.currentTime,
        isPlaying: room.isPlaying,
        videoUrl: room.videoUrl
      });
    }
  });
  
  // ------------------------------------------
  // EVENTO: Broadcast de sincronização (cada 5s)
  // ------------------------------------------
  socket.on('sync-broadcast', (data) => {
    if (!currentRoom) return;
    
    const { currentTime, isPlaying } = data;
    updateRoomState(currentRoom, { currentTime, isPlaying });
    
    // Broadcast para todos na sala EXCETO remetente
    socket.to(currentRoom).emit('sync-update', {
      currentTime,
      isPlaying,
      timestamp: Date.now()
    });
  });
  
  // ------------------------------------------
  // EVENTO: Desconexão
  // ------------------------------------------
  socket.on('disconnect', () => {
    console.log(`[WatchParty] Usuário desconectado: ${socket.id}`);
    
    if (currentRoom) {
      removeUserFromRoom(currentRoom, socket.id);
      
      // Notifica outros usuários
      const room = rooms.get(currentRoom);
      if (room) {
        socket.to(currentRoom).emit('user-left', {
          userId: socket.id,
          userCount: room.users.length
        });
      }
    }
  });
});

// ============================================
// SINCRONIZAÇÃO PERIÓDICA (Servidor)
// ============================================

// A cada 5 segundos, sincroniza todos na sala
setInterval(() => {
  rooms.forEach((room, roomId) => {
    if (room.users.length > 1 && room.isPlaying) {
      // Envia estado atual para todos na sala
      io.to(roomId).emit('server-sync', {
        currentTime: room.currentTime,
        isPlaying: room.isPlaying,
        timestamp: Date.now()
      });
      
      // Incrementa tempo estimado (aproximação)
      room.currentTime += 5;
    }
  });
}, 5000);

// ============================================
// INICIAR SERVIDOR
// ============================================

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║  🎬  SISTEMA ASSISTIR JUNTOS (Watch Party)             ║
║                                                        ║
║  Servidor rodando na porta: ${PORT}                      ║
║  Socket.IO: ws://localhost:${PORT}                      ║
║                                                        ║
║  Endpoint criar sala: POST /api/create-room            ║
║  Endpoint ver sala:   GET  /api/room/:roomId          ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
  `);
});

module.exports = { app, server, io };
