const fs = require('fs');
const path = require('path');

// Simple script to generate icon using canvas (if available) or provide instructions
async function generateIcons() {
  try {
    // Try to use canvas if available
    let canvas;
    try {
      canvas = require('canvas');
    } catch (e) {
      console.log('Canvas module not found. Installing...');
      console.log('Please run: npm install canvas');
      console.log('Or use the generate-icons.html file in your browser to generate icons manually.');
      return;
    }

    const { createCanvas } = canvas;

    function createIcon(size) {
      const canv = createCanvas(size, size);
      const ctx = canv.getContext('2d');

      // Create gradient
      const gradient = ctx.createLinearGradient(0, 0, size, size);
      gradient.addColorStop(0, '#818cf8'); // indigo-400
      gradient.addColorStop(0.5, '#60a5fa'); // blue-400
      gradient.addColorStop(1, '#22d3ee'); // cyan-400

      // Draw background circle
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size * 0.47, 0, Math.PI * 2);
      ctx.fill();

      // Draw "R" letter
      ctx.fillStyle = 'white';
      ctx.font = `bold ${Math.floor(size * 0.625)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('R', size / 2, size / 2);

      return canv;
    }

    // Generate 192x192 icon
    const icon192 = createIcon(192);
    const icon192Buffer = icon192.toBuffer('image/png');
    fs.writeFileSync(
      path.join(__dirname, '../src/app/icon-192.png'),
      icon192Buffer
    );
    console.log('✓ Generated icon-192.png');

    // Generate 512x512 icon
    const icon512 = createIcon(512);
    const icon512Buffer = icon512.toBuffer('image/png');
    fs.writeFileSync(
      path.join(__dirname, '../src/app/icon-512.png'),
      icon512Buffer
    );
    console.log('✓ Generated icon-512.png');

    console.log('\nIcons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    console.log('\nAlternative: Open generate-icons.html in your browser and save the canvas images.');
  }
}

generateIcons();






