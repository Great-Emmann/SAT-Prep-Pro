const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 table
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[i] = c;
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData), 0);
  return Buffer.concat([len, typeAndData, crc]);
}

function createRGBPNG(w, h, pixelPainter) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // 8 bits per sample
  ihdr[9] = 2; // RGB color type
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const rowSize = 1 + w * 3;
  const raw = Buffer.alloc(h * rowSize);
  for (let y = 0; y < h; y++) {
    const rowOffset = y * rowSize;
    raw[rowOffset] = 0; // No filter
    for (let x = 0; x < w; x++) {
      const [r, g, b] = pixelPainter(x, y, w, h);
      const p = rowOffset + 1 + x * 3;
      raw[p] = r;
      raw[p + 1] = g;
      raw[p + 2] = b;
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

// 1. Icon painter: Beautiful Indigo gradient background with rounded shield/graduation cap & gold stars
function iconPainter(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background: Deep Indigo gradient (#4338ca to #312e81)
  const normY = y / h;
  let r = Math.round(67 - normY * 25);
  let g = Math.round(56 - normY * 20);
  let b = Math.round(202 - normY * 60);

  // Inner rounded card / emblem (radius ~ 42% of width)
  const emblemRadius = w * 0.40;
  const cornerRadius = w * 0.12;
  const boxW = emblemRadius * 1.6;
  const boxH = emblemRadius * 1.6;
  const inBoxX = Math.abs(dx) <= boxW / 2;
  const inBoxY = Math.abs(dy) <= boxH / 2;
  
  // Center logo motif: Graduation Cap / Diamond & Book
  // Diamond top of graduation cap
  // Diamond vertices: (cx, cy - h*0.20), (cx + w*0.28, cy - h*0.06), (cx, cy + h*0.08), (cx - w*0.28, cy - h*0.06)
  const capDy = y - (cy - h * 0.06);
  const capDx = Math.abs(x - cx);
  const inDiamond = (capDx / (w * 0.28) + Math.abs(capDy) / (h * 0.14)) <= 1.0;

  // Cap skull base: ellipse/arc under diamond
  const baseDx = x - cx;
  const baseDy = y - (cy + h * 0.04);
  const inCapBase = (y >= cy && y <= cy + h * 0.14 && (Math.abs(baseDx) <= w * 0.16));

  // Tassel ribbon: line from cap center to right edge, dangling down
  const inTassel = (x >= cx && x <= cx + w * 0.25 && Math.abs(y - (cy - h * 0.04 + (x - cx) * 0.4)) <= (w * 0.02)) ||
                   (Math.abs(x - (cx + w * 0.24)) <= (w * 0.02) && y >= cy + h * 0.05 && y <= cy + h * 0.18);

  // Golden star / 1600 badge under cap
  const inStar = Math.abs(x - (cx + w * 0.24)) <= (w * 0.035) && Math.abs(y - (cy + h * 0.19)) <= (h * 0.035);

  // Border ring
  const ringDist = Math.abs(dist - emblemRadius);
  if (ringDist <= (w * 0.015)) {
    return [245, 158, 11]; // Amber gold border ring
  }

  if (inDiamond) {
    return [255, 255, 255]; // Crisp white cap
  }
  if (inCapBase) {
    return [224, 231, 255]; // Soft indigo/white cap base
  }
  if (inTassel || inStar) {
    return [251, 191, 36]; // Warm golden amber tassel
  }

  return [Math.max(0, Math.min(255, r)), Math.max(0, Math.min(255, g)), Math.max(0, Math.min(255, b))];
}

// 2. Desktop Screenshot painter: 1280 x 720 (Modern Digital SAT Exam UI)
function desktopPainter(x, y, w, h) {
  // Top nav bar: 0 <= y <= 60 (#0f172a / dark slate)
  if (y < 60) {
    // Logo accent on left
    if (x >= 40 && x <= 180 && y >= 20 && y <= 40) {
      return [99, 102, 241]; // Indigo badge
    }
    // Desmos button & Reference button
    if (x >= 800 && x <= 950 && y >= 16 && y <= 44) {
      return [30, 41, 59]; // slate button
    }
    if (x >= 970 && x <= 1100 && y >= 16 && y <= 44) {
      return [217, 119, 6]; // Amber reference button
    }
    // End test button
    if (x >= 1120 && x <= 1240 && y >= 16 && y <= 44) {
      return [225, 29, 72]; // Rose submit button
    }
    return [15, 23, 42]; // Dark slate nav
  }

  // Sub-header / Progress bar: 60 <= y <= 100 (#1e293b)
  if (y < 100) {
    // Timer pill in center
    if (x >= 560 && x <= 720 && y >= 68 && y <= 92) {
      return [245, 158, 11]; // Timer gold
    }
    return [30, 41, 59];
  }

  // Main Canvas Background: #f8fafc (clean soft off-white)
  // Left Column: Reading Passage or Math Problem (x: 40 to 620, y: 120 to 660)
  if (x >= 40 && x <= 620 && y >= 120 && y <= 660) {
    // Card border
    if (x === 40 || x === 620 || y === 120 || y === 660) return [203, 213, 225];
    // Passage header
    if (y >= 140 && y <= 160 && x >= 70 && x <= 300) return [79, 70, 229];
    // Passage text lines simulation
    for (let line = 190; line <= 600; line += 28) {
      if (y >= line && y <= line + 10 && x >= 70 && x <= 580) {
        return [148, 163, 184]; // Slate text line
      }
    }
    return [255, 255, 255]; // Card white
  }

  // Right Column: Question & 4 Multiple Choice Options (x: 660 to 1240, y: 120 to 660)
  if (x >= 660 && x <= 1240 && y >= 120 && y <= 660) {
    // Border
    if (x === 660 || x === 1240 || y === 120 || y === 660) return [203, 213, 225];
    // Question title
    if (y >= 140 && y <= 165 && x >= 690 && x <= 1180) return [30, 41, 59];
    if (y >= 175 && y <= 195 && x >= 690 && x <= 1050) return [71, 85, 105];

    // 4 Options (A, B, C, D)
    const optStarts = [230, 310, 390, 470];
    for (let i = 0; i < optStarts.length; i++) {
      const optY = optStarts[i];
      if (y >= optY && y <= optY + 60 && x >= 690 && x <= 1210) {
        if (i === 1) {
          // Selected Option B: Indigo highlight
          if (x === 690 || x === 1210 || y === optY || y === optY + 60) return [79, 70, 229];
          return [238, 242, 255];
        }
        // Unselected option
        if (x === 690 || x === 1210 || y === optY || y === optY + 60) return [226, 232, 240];
        return [255, 255, 255];
      }
    }

    // Bottom Action Buttons (Next, Mark for Review, Cross-out)
    if (y >= 570 && y <= 615) {
      if (x >= 690 && x <= 820) return [241, 245, 249]; // Flag button
      if (x >= 1050 && x <= 1210) return [79, 70, 229]; // Next Question button (Indigo)
    }

    return [255, 255, 255]; // Card white
  }

  // Footer bar: 680 to 720
  if (y >= 680) {
    return [241, 245, 249];
  }

  return [248, 250, 252]; // Background
}

// 3. Mobile Screenshot painter: 720 x 1280 (Modern Mobile Test Screen)
function mobilePainter(x, y, w, h) {
  // Mobile Status / App bar: 0 <= y <= 90
  if (y < 90) {
    if (x >= 30 && x <= 220 && y >= 35 && y <= 65) return [255, 255, 255]; // SAT Prep Pro title
    if (x >= 520 && x <= 680 && y >= 30 && y <= 70) return [245, 158, 11]; // Timer badge
    return [15, 23, 42]; // Slate-900
  }

  // Section Indicator / Progress Pill: 90 <= y <= 160
  if (y < 160) {
    if (x >= 30 && x <= 690 && y >= 115 && y <= 135) return [226, 232, 240]; // Bar track
    if (x >= 30 && x <= 360 && y >= 115 && y <= 135) return [79, 70, 229]; // Progress fill
    return [255, 255, 255];
  }

  // Main Question Card: x: 30 to 690, y: 180 to 520
  if (x >= 30 && x <= 690 && y >= 180 && y <= 520) {
    if (x === 30 || x === 690 || y === 180 || y === 520) return [226, 232, 240];
    // Question badge
    if (x >= 50 && x <= 180 && y >= 205 && y <= 235) return [238, 242, 255];
    // Text lines
    for (let line = 260; line <= 480; line += 36) {
      if (y >= line && y <= line + 14 && x >= 50 && x <= 660) return [100, 116, 139];
    }
    return [255, 255, 255];
  }

  // 4 Options Cards: y: 550 to 1050
  const optYStarts = [550, 680, 810, 940];
  for (let i = 0; i < optYStarts.length; i++) {
    const oY = optYStarts[i];
    if (x >= 30 && x <= 690 && y >= oY && y <= oY + 100) {
      if (i === 0) {
        // Active selected option
        if (x === 30 || x === 690 || y === oY || y === oY + 100) return [79, 70, 229];
        return [238, 242, 255];
      }
      if (x === 30 || x === 690 || y === oY || y === oY + 100) return [226, 232, 240];
      return [255, 255, 255];
    }
  }

  // Bottom Navigation buttons: y: 1100 to 1220
  if (y >= 1100 && y <= 1200) {
    if (x >= 30 && x <= 250) return [241, 245, 249]; // Back button
    if (x >= 280 && x <= 690) return [79, 70, 229]; // Next Question (Indigo)
  }

  return [248, 250, 252];
}

console.log('Generating PWA Icons & Screenshots...');

const publicDir = path.join(__dirname, '..', 'public');

// Generate icon-192.png
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), createRGBPNG(192, 192, iconPainter));
console.log('✔ Generated icon-192.png');

// Generate icon-512.png
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), createRGBPNG(512, 512, iconPainter));
console.log('✔ Generated icon-512.png');

// Generate apple-touch-icon.png (180x180)
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createRGBPNG(180, 180, iconPainter));
console.log('✔ Generated apple-touch-icon.png');

// Generate screenshot-desktop.png (1280x720)
fs.writeFileSync(path.join(publicDir, 'screenshot-desktop.png'), createRGBPNG(1280, 720, desktopPainter));
console.log('✔ Generated screenshot-desktop.png (1280x720)');

// Generate screenshot-mobile.png (720x1280)
fs.writeFileSync(path.join(publicDir, 'screenshot-mobile.png'), createRGBPNG(720, 1280, mobilePainter));
console.log('✔ Generated screenshot-mobile.png (720x1280)');

console.log('All PWA assets generated successfully!');
