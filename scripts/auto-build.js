#!/usr/bin/env node
/**
 * Script de build automático - executa build após alterações em arquivos
 * Uso: node scripts/auto-build.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

let isBuilding = false;
let pendingBuild = false;

function log(message) {
  const timestamp = new Date().toLocaleTimeString('pt-BR');
  console.log(`[${timestamp}] ${message}`);
}

function runBuild() {
  if (isBuilding) {
    pendingBuild = true;
    return;
  }

  isBuilding = true;
  log('🔄 Alteração detectada! Executando build...');

  try {
    execSync('npm run build', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    log('✅ Build concluído com sucesso!');
    log('📁 Arquivos atualizados em: dist/');
  } catch (error) {
    log('❌ Erro no build. Verifique os logs acima.');
  } finally {
    isBuilding = false;
    
    if (pendingBuild) {
      pendingBuild = false;
      setTimeout(runBuild, 1000);
    }
  }
}

function watchDirectory(dir, label) {
  if (!fs.existsSync(dir)) {
    log(`⚠️  Diretório não encontrado: ${dir}`);
    return;
  }

  fs.watch(dir, { recursive: true }, (eventType, filename) => {
    if (filename && !filename.includes('node_modules')) {
      log(`📄 ${label} alterado: ${filename}`);
      runBuild();
    }
  });

  log(`👁️  Observando: ${label} (${dir})`);
}

// Iniciar
console.log('\n🔧 AUTO-BUILD CINECASA');
console.log('======================');
console.log('Executando build inicial...\n');

// Build inicial
runBuild();

// Watch mode
console.log('\n👁️  Modo de observação ativado...');
console.log('Alterações em src/ ou public/ disparam build automático.\n');

watchDirectory(SRC_DIR, 'src');
watchDirectory(PUBLIC_DIR, 'public');

// Manter processo vivo
process.stdin.resume();

log('✨ Pronto! Aguardando alterações... (Ctrl+C para sair)');
