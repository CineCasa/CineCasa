const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const ICONS_DIR = path.join(PUBLIC_DIR, 'icons');

// Apenas ícones PWA devem ter fundo preto
// O logo.png principal (usado no loading screen) permanece sem fundo (transparente)
const filesToProcess = [];

// Adicionar apenas os ícones da pasta icons (PWA)
const iconFiles = fs.readdirSync(ICONS_DIR).filter(f => f.endsWith('.png'));
iconFiles.forEach(file => {
  const inputPath = path.join(ICONS_DIR, file);
  const outputPath = path.join(ICONS_DIR, file);
  filesToProcess.push({ input: inputPath, output: outputPath });
});

async function addBlackBackground(inputPath, outputPath) {
  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    // Criar imagem com fundo preto
    await sharp({
      create: {
        width: metadata.width,
        height: metadata.height,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 1 }
      }
    })
    .composite([{ input: inputPath }])
    .png()
    .toFile(outputPath + '.tmp');
    
    // Substituir arquivo original
    fs.renameSync(outputPath + '.tmp', outputPath);
    console.log(`✅ Processado: ${path.basename(outputPath)} (${metadata.width}x${metadata.height})`);
  } catch (error) {
    console.error(`❌ Erro ao processar ${inputPath}:`, error.message);
  }
}

async function main() {
  console.log('🎨 Adicionando fundo preto nos ícones PWA (apenas ícones, não no logo principal)...\n');
  console.log('ℹ️  O logo.png permanece sem fundo para o loading screen\n');
  
  for (const file of filesToProcess) {
    await addBlackBackground(file.input, file.output);
  }
  
  console.log('\n✨ Ícones PWA processados com fundo preto!');
  console.log('✅ Logo principal (logo.png) permanece transparente para o loading screen');
}

main().catch(console.error);
