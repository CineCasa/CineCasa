#!/usr/bin/env node

/**
 * Script de inicialização do servidor Watch Party
 * Facilita o start do servidor com logs coloridos
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🎬 CineCasa - Assistir Juntos');
console.log('================================\n');

// Verifica se as dependências estão instaladas
try {
  require('express');
  require('socket.io');
} catch (e) {
  console.log('⚠️  Dependências não encontradas. Instalando...\n');
  const npmInstall = spawn('npm', ['install', 'express', 'socket.io'], {
    stdio: 'inherit',
    shell: true
  });
  
  npmInstall.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ Dependências instaladas!\n');
      startServer();
    } else {
      console.error('\n❌ Erro ao instalar dependências');
      process.exit(1);
    }
  });
} finally {
  startServer();
}

function startServer() {
  const PORT = process.env.WATCH_PARTY_PORT || 3001;
  
  console.log(`🚀 Iniciando servidor na porta ${PORT}...\n`);
  
  const server = spawn('node', ['server.js'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, WATCH_PARTY_PORT: PORT }
  });
  
  server.on('error', (err) => {
    console.error('❌ Erro ao iniciar servidor:', err.message);
  });
  
  // Mensagem de ajuda
  setTimeout(() => {
    console.log('\n📋 Instruções de uso:');
    console.log('   1. Acesse a aplicação principal (geralmente http://localhost:5173)');
    console.log('   2. Clique no ícone 👥 (Assistir Juntos) no header');
    console.log('   3. Ou acesse diretamente: http://localhost:5173/watch.html?room=SALA123');
    console.log('\n💡 Dica: Abra duas abas com o mesmo link para testar!\n');
    console.log('🛑 Pressione Ctrl+C para parar o servidor\n');
  }, 1000);
}
