/**
 * Generates Macly brand assets: icon.png, adaptive-icon.png, splash.png, favicon.png
 * Run with: node scripts/generate-assets.js
 */
const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');

if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

const BG = 0x0B1220FF;        // dark navy
const ACCENT = 0x22C55EFF;    // green

/** Draw a filled circle */
function drawCircle(img, cx, cy, r, color) {
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r ** 2) {
        if (x >= 0 && y >= 0 && x < img.bitmap.width && y < img.bitmap.height) {
          img.setPixelColor(color, x, y);
        }
      }
    }
  }
}

/** Draw a thick arc (ring segment) */
function drawArc(img, cx, cy, r, strokeW, startDeg, endDeg, color) {
  const startRad = (startDeg - 90) * (Math.PI / 180);
  const endRad = (endDeg - 90) * (Math.PI / 180);
  const steps = Math.ceil(r * (endDeg - startDeg) * (Math.PI / 180)) * 4;
  for (let i = 0; i <= steps; i++) {
    const angle = startRad + (i / steps) * (endRad - startRad);
    for (let d = -strokeW / 2; d <= strokeW / 2; d++) {
      const px = Math.round(cx + (r + d) * Math.cos(angle));
      const py = Math.round(cy + (r + d) * Math.sin(angle));
      if (px >= 0 && py >= 0 && px < img.bitmap.width && py < img.bitmap.height) {
        img.setPixelColor(color, px, py);
      }
    }
  }
}

async function makeIcon(size, outFile) {
  const img = new Jimp({ width: size, height: size, color: BG });

  const cx = size / 2;
  const cy = size / 2;
  const ringR = Math.round(size * 0.32);
  const stroke = Math.round(size * 0.07);

  // Background ring (dim)
  drawArc(img, cx, cy, ringR, stroke, 0, 360, 0x263247FF);
  // Foreground arc ~270° (green)
  drawArc(img, cx, cy, ringR, stroke, 0, 270, ACCENT);
  // Centre dot
  drawCircle(img, cx, cy, Math.round(size * 0.06), ACCENT);

  await img.write(outFile);
  console.log(`✓ ${outFile} (${size}x${size})`);
}

async function makeSplash(w, h, outFile) {
  const img = new Jimp({ width: w, height: h, color: BG });

  const cx = w / 2;
  const cy = h / 2 - h * 0.06;
  const ringR = Math.round(w * 0.22);
  const stroke = Math.round(w * 0.045);

  drawArc(img, cx, cy, ringR, stroke, 0, 360, 0x263247FF);
  drawArc(img, cx, cy, ringR, stroke, 0, 270, ACCENT);
  drawCircle(img, cx, cy, Math.round(w * 0.04), ACCENT);

  await img.write(outFile);
  console.log(`✓ ${outFile} (${w}x${h})`);
}

async function main() {
  await makeIcon(1024, path.join(ASSETS_DIR, 'icon.png'));
  await makeIcon(1024, path.join(ASSETS_DIR, 'adaptive-icon.png'));
  await makeSplash(1284, 2778, path.join(ASSETS_DIR, 'splash.png'));
  await makeIcon(48, path.join(ASSETS_DIR, 'favicon.png'));
  console.log('\nAll assets generated in assets/');
}

main().catch((err) => { console.error(err); process.exit(1); });
