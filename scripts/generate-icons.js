#!/usr/bin/env node

/**
 * Script to generate PWA icons from logo.png
 * Requires: npm install sharp
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SOURCE_IMAGE = path.join(__dirname, '../public/logo.png');
const OUTPUT_DIR = path.join(__dirname, '../public/icons');

// All icon sizes needed for PWA
const ICON_SIZES = [
  16, 32, 48, 57, 60, 72, 76, 96, 114, 120,
  128, 144, 152, 167, 180, 192, 256, 384, 512, 1024
];

// Special sizes for Microsoft tiles
const TILE_SIZES = [
  { name: '70x70', size: 70 },
  { name: '150x150', size: 150 },
  { name: '310x150', size: 310, height: 150 },
  { name: '310x310', size: 310 }
];

async function generateIcons() {
  console.log('🎨 Generating PWA icons from logo.png...\n');

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Check if source exists
  if (!fs.existsSync(SOURCE_IMAGE)) {
    console.error('❌ Source image not found:', SOURCE_IMAGE);
    process.exit(1);
  }

  const sourceBuffer = fs.readFileSync(SOURCE_IMAGE);

  // Generate standard icons
  for (const size of ICON_SIZES) {
    const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);
    
    try {
      await sharp(sourceBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png({ compressionLevel: 9, quality: 90 })
        .toFile(outputPath);
      
      console.log(`✅ icon-${size}x${size}.png`);
    } catch (err) {
      console.error(`❌ Failed to generate icon-${size}x${size}.png:`, err.message);
    }
  }

  // Generate maskable icons (with padding for safe zone)
  for (const size of [192, 512]) {
    const outputPath = path.join(OUTPUT_DIR, `maskable-icon-${size}x${size}.png`);
    
    try {
      await sharp(sourceBuffer)
        .resize(Math.round(size * 0.8), Math.round(size * 0.8), {
          fit: 'contain',
          background: { r: 0, g: 168, b: 225, alpha: 1 } // #00A8E1 theme color
        })
        .extend({
          top: Math.round(size * 0.1),
          bottom: Math.round(size * 0.1),
          left: Math.round(size * 0.1),
          right: Math.round(size * 0.1),
          background: { r: 0, g: 168, b: 225, alpha: 1 }
        })
        .png({ compressionLevel: 9, quality: 90 })
        .toFile(outputPath);
      
      console.log(`✅ maskable-icon-${size}x${size}.png`);
    } catch (err) {
      console.error(`❌ Failed to generate maskable-icon-${size}x${size}.png:`, err.message);
    }
  }

  // Generate monochrome icons
  for (const size of [192, 512]) {
    const outputPath = path.join(OUTPUT_DIR, `monochrome-icon-${size}x${size}.png`);
    
    try {
      await sharp(sourceBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .greyscale()
        .png({ compressionLevel: 9, quality: 90 })
        .toFile(outputPath);
      
      console.log(`✅ monochrome-icon-${size}x${size}.png`);
    } catch (err) {
      console.error(`❌ Failed to generate monochrome-icon-${size}x${size}.png:`, err.message);
    }
  }

  // Generate Apple touch icons with rounded corners
  for (const size of [57, 60, 72, 76, 114, 120, 144, 152, 167, 180]) {
    const outputPath = path.join(OUTPUT_DIR, `apple-touch-icon-${size}x${size}.png`);
    
    try {
      // Create rounded rectangle mask
      const roundedRect = Buffer.from(
        `<svg width="${size}" height="${size}">
          <rect x="0" y="0" width="${size}" height="${size}" rx="${size * 0.223}" ry="${size * 0.223}" fill="white"/>
        </svg>`
      );

      await sharp(sourceBuffer)
        .resize(size, size, {
          fit: 'cover'
        })
        .composite([{
          input: roundedRect,
          blend: 'dest-in'
        }])
        .png({ compressionLevel: 9, quality: 90 })
        .toFile(outputPath);
      
      console.log(`✅ apple-touch-icon-${size}x${size}.png`);
    } catch (err) {
      console.error(`❌ Failed to generate apple-touch-icon-${size}x${size}.png:`, err.message);
    }
  }

  console.log('\n🎉 All icons generated successfully!');
  console.log(`📁 Output directory: ${OUTPUT_DIR}`);
}

// Run if called directly
if (require.main === module) {
  generateIcons().catch(err => {
    console.error('❌ Error generating icons:', err);
    process.exit(1);
  });
}

module.exports = { generateIcons, ICON_SIZES };
