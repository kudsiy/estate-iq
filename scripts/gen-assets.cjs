/**
 * gen-assets.cjs — generates favicon.png, apple-touch-icon.png, og-image.png
 * Uses only Node.js built-ins (zlib, fs, Buffer). Zero external dependencies.
 */
"use strict";
const zlib = require("zlib");
const fs = require("fs");
const path = require("path");

// ── PNG helpers ────────────────────────────────────────────────────────────────

function crc32(buf) {
  const table = crc32.table || (crc32.table = buildCrcTable());
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  return (crc ^ 0xffffffff) >>> 0;
}
function buildCrcTable() {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBytes, data]);
  const crcVal = Buffer.alloc(4);
  crcVal.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([len, typeBytes, data, crcVal]);
}

function ihdr(w, h, bitDepth = 8, colorType = 2) {
  const d = Buffer.alloc(13);
  d.writeUInt32BE(w, 0);
  d.writeUInt32BE(h, 4);
  d[8] = bitDepth;
  d[9] = colorType; // 2 = RGB truecolor
  return chunk("IHDR", d);
}

function buildRgbPixels(w, h, pixelFn) {
  // pixelFn(x,y) => [r,g,b]
  const rows = [];
  for (let y = 0; y < h; y++) {
    const row = Buffer.alloc(1 + w * 3);
    row[0] = 0; // filter type: None
    for (let x = 0; x < w; x++) {
      const [r, g, b] = pixelFn(x, y);
      row[1 + x * 3] = r;
      row[1 + x * 3 + 1] = g;
      row[1 + x * 3 + 2] = b;
    }
    rows.push(row);
  }
  return Buffer.concat(rows);
}

function makePng(w, h, pixelFn) {
  const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const raw = buildRgbPixels(w, h, pixelFn);
  const compressed = zlib.deflateSync(raw, { level: 9 });
  const idat = chunk("IDAT", compressed);
  const iend = chunk("IEND", Buffer.alloc(0));
  return Buffer.concat([PNG_SIG, ihdr(w, h), idat, iend]);
}

// ── Drawing primitives ─────────────────────────────────────────────────────────

// Simple bitmap font for uppercase ASCII — 5×7 pixel glyphs
// Each character encoded as 5 columns of 7 bits (bit 6 = top)
const GLYPHS = {
  E: [0b1111111, 0b1000001, 0b1000001, 0b1111001, 0b1000001, 0b1000001, 0b1111111].reverse(),
  Q: [0b0111110, 0b1000001, 0b1000001, 0b1000001, 0b1001001, 0b1000110, 0b0111111].reverse(),
  s: [0b0111110, 0b1000000, 0b1000000, 0b0111110, 0b0000001, 0b0000001, 0b0111110].reverse(),
  t: [0b0010000, 0b0111110, 0b0010000, 0b0010000, 0b0010000, 0b0010000, 0b0001110].reverse(),
  a: [0b0000000, 0b0111110, 0b0000001, 0b0111111, 0b1000001, 0b1000001, 0b0111111].reverse(),
  e: [0b0000000, 0b0111110, 0b1000001, 0b1111111, 0b1000000, 0b1000001, 0b0111110].reverse(),
  I: [0b1111111, 0b0001000, 0b0001000, 0b0001000, 0b0001000, 0b0001000, 0b1111111].reverse(),
  // digits
  "1": [0b0011000, 0b0101000, 0b0001000, 0b0001000, 0b0001000, 0b0001000, 0b0111110].reverse(),
  "2": [0b0111100, 0b1000010, 0b0000010, 0b0001100, 0b0010000, 0b0100000, 0b1111110].reverse(),
};

function drawGlyph(pixels, w, h, glyph, startX, startY, scale, r, g, b) {
  const rows = GLYPH_5x7[glyph];
  if (!rows) return;
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 5; col++) {
      if (rows[row] & (1 << (4 - col))) {
        for (let sy = 0; sy < scale; sy++) {
          for (let sx = 0; sx < scale; sx++) {
            const px = startX + col * scale + sx;
            const py = startY + row * scale + sy;
            if (px >= 0 && px < w && py >= 0 && py < h) {
              pixels[py][px] = [r, g, b];
            }
          }
        }
      }
    }
  }
}

// ── Favicon 32×32 ─────────────────────────────────────────────────────────────
// Simple: solid purple bg, white "EQ" text drawn pixel-by-pixel

function makeFavicon(size) {
  const bg = [0x7c, 0x3a, 0xed]; // #7C3AED
  const fg = [255, 255, 255];

  // Pre-draw pixel array
  const px = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => [...bg])
  );

  // Draw rounded square background with slight darker border
  const radius = Math.floor(size * 0.2);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // corner rounding
      const cx = Math.min(x, size - 1 - x);
      const cy = Math.min(y, size - 1 - y);
      if (cx < radius && cy < radius) {
        const dist = Math.sqrt((radius - cx) ** 2 + (radius - cy) ** 2);
        if (dist > radius) px[y][x] = [0x0f, 0x11, 0x17]; // outside = dark bg
      }
    }
  }

  // Draw "EQ" — simple pixel font using manually drawn bitmaps
  // Scale to fit: for 32×32 use 2px per bit with 5×7 glyph => 10×14 per char
  // Two chars + gap: 10+2+10=22 wide, centered: (32-22)/2=5 start
  const scale = size <= 32 ? 2 : 6;
  const glyphW = 5 * scale;
  const glyphH = 7 * scale;
  const gap = scale;
  const totalW = glyphW * 2 + gap;
  const startX = Math.floor((size - totalW) / 2);
  const startY = Math.floor((size - glyphH) / 2);

  // 5×7 pixel bitmaps — rows top to bottom, bits left to right (MSB=left)
  const FONT = {
    E: [0b11111, 0b10001, 0b10000, 0b11110, 0b10000, 0b10001, 0b11111],
    Q: [0b01110, 0b10001, 0b10001, 0b10001, 0b10101, 0b10010, 0b01111],
  };

  for (const [charIdx, letter] of ["E", "Q"].entries()) {
    const bitmap = FONT[letter];
    const ox = startX + charIdx * (glyphW + gap);
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 5; col++) {
        if (bitmap[row] & (1 << (4 - col))) {
          for (let sy = 0; sy < scale; sy++) {
            for (let sx = 0; sx < scale; sx++) {
              const fx = ox + col * scale + sx;
              const fy = startY + row * scale + sy;
              if (fx >= 0 && fx < size && fy >= 0 && fy < size) {
                px[fy][fx] = [...fg];
              }
            }
          }
        }
      }
    }
  }

  return makePng(size, size, (x, y) => px[y][x]);
}

// ── OG Image 1200×630 ──────────────────────────────────────────────────────────
// Dark bg (#0f1117), centered text rendered via pixel font scaled up

function makeOgImage() {
  const W = 1200, H = 630;
  const BG = [0x0f, 0x11, 0x17];
  const WHITE = [255, 255, 255];
  const PURPLE = [0xa7, 0x8b, 0xfa]; // #A78BFA

  // Pixel array
  const px = Array.from({ length: H }, () =>
    Array.from({ length: W }, () => [...BG])
  );

  // Gradient band
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const t = Math.sqrt(((x - W / 2) ** 2 + (y - H / 2) ** 2)) / (W * 0.6);
      const glow = Math.max(0, 0.06 - t * 0.06);
      px[y][x] = [
        Math.min(255, BG[0] + Math.floor(0x7c * glow)),
        Math.min(255, BG[1] + Math.floor(0x3a * glow)),
        Math.min(255, BG[2] + Math.floor(0xed * glow)),
      ];
    }
  }

  // 5×7 font — scale 10 for "Estate IQ" title, scale 5 for subtitle
  const FONT5x7 = {
    E: [0b11111,0b10000,0b10000,0b11110,0b10000,0b10000,0b11111],
    s: [0b01111,0b10000,0b10000,0b01110,0b00001,0b00001,0b11110],
    t: [0b11111,0b00100,0b00100,0b00100,0b00100,0b00100,0b00100],
    a: [0b00000,0b01110,0b00001,0b01111,0b10001,0b10011,0b01101],
    e: [0b00000,0b01110,0b10001,0b11111,0b10000,0b10001,0b01110],
    ' ':[0,0,0,0,0,0,0],
    I: [0b11111,0b00100,0b00100,0b00100,0b00100,0b00100,0b11111],
    Q: [0b01110,0b10001,0b10001,0b10001,0b10101,0b10010,0b01101],
    F: [0b11111,0b10000,0b10000,0b11110,0b10000,0b10000,0b10000],
    o: [0b00000,0b01110,0b10001,0b10001,0b10001,0b10001,0b01110],
    r: [0b00000,0b10110,0b11001,0b10000,0b10000,0b10000,0b10000],
    i: [0b00100,0b00000,0b00100,0b00100,0b00100,0b00100,0b00100],
    h: [0b10000,0b10000,0b10000,0b11110,0b10001,0b10001,0b10001],
    p: [0b00000,0b11110,0b10001,0b10001,0b11110,0b10000,0b10000],
    n: [0b00000,0b11110,0b10001,0b10001,0b10001,0b10001,0b10001],
    A: [0b01110,0b10001,0b10001,0b11111,0b10001,0b10001,0b10001],
    g: [0b00000,0b01111,0b10001,0b10001,0b01111,0b00001,0b01110],
    l: [0b01100,0b00100,0b00100,0b00100,0b00100,0b00100,0b01110],
    d: [0b00001,0b00001,0b00001,0b01101,0b10011,0b10001,0b01101],
    T: [0b11111,0b00100,0b00100,0b00100,0b00100,0b00100,0b00100],
    R: [0b11110,0b10001,0b10001,0b11110,0b10100,0b10010,0b10001],
    L: [0b10000,0b10000,0b10000,0b10000,0b10000,0b10001,0b11111],
    G: [0b01110,0b10001,0b10000,0b10111,0b10001,0b10001,0b01110],
    B: [0b11110,0b10001,0b10001,0b11110,0b10001,0b10001,0b11110],
    u: [0b00000,0b10001,0b10001,0b10001,0b10001,0b10011,0b01101],
    y: [0b00000,0b10001,0b10001,0b01111,0b00001,0b10001,0b01110],
    f: [0b00111,0b00100,0b00100,0b01110,0b00100,0b00100,0b00100],
    k: [0b10000,0b10010,0b10100,0b11000,0b10100,0b10010,0b10001],
    w: [0b00000,0b10001,0b10001,0b10101,0b10101,0b11011,0b10001],
    ':' :[0,0b00100,0,0,0b00100,0,0],
    '-' :[0,0,0,0b11111,0,0,0],
  };

  function drawText(text, ox, oy, scale, color) {
    const charW = 5 * scale + scale; // glyph + 1 gap
    for (let ci = 0; ci < text.length; ci++) {
      const ch = text[ci];
      const bitmap = FONT5x7[ch] || FONT5x7[' '];
      const cx = ox + ci * charW;
      for (let row = 0; row < 7; row++) {
        for (let col = 0; col < 5; col++) {
          if (bitmap[row] & (1 << (4 - col))) {
            for (let sy = 0; sy < scale; sy++) {
              for (let sx = 0; sx < scale; sx++) {
                const fx = cx + col * scale + sx;
                const fy = oy + row * scale + sy;
                if (fx >= 0 && fx < W && fy >= 0 && fy < H) {
                  px[fy][fx] = [...color];
                }
              }
            }
          }
        }
      }
    }
    return charW * text.length;
  }

  function textWidth(text, scale) {
    return (5 * scale + scale) * text.length;
  }

  // Draw house icon (12×10 grid, scale 8) centered above title
  const HOUSE = [
    [0,0,0,0,0,1,0,0,0,0,0,0],
    [0,0,0,0,1,1,1,0,0,0,0,0],
    [0,0,0,1,1,1,1,1,0,0,0,0],
    [0,0,1,1,1,1,1,1,1,0,0,0],
    [0,1,1,1,1,1,1,1,1,1,0,0],
    [1,1,1,1,1,1,1,1,1,1,1,0],
    [0,0,1,1,0,0,0,0,1,1,0,0],
    [0,0,1,1,0,0,0,0,1,1,0,0],
    [0,0,1,1,1,1,1,1,1,1,0,0],
    [0,0,1,1,1,1,1,1,1,1,0,0],
  ];
  const iconScale = 6;
  const iconW = 12 * iconScale, iconH = 10 * iconScale;
  const iconX = Math.floor((W - iconW) / 2);
  const iconY = 130;
  for (let r = 0; r < HOUSE.length; r++) {
    for (let c = 0; c < HOUSE[r].length; c++) {
      if (HOUSE[r][c]) {
        for (let sy = 0; sy < iconScale; sy++)
          for (let sx = 0; sx < iconScale; sx++) {
            const fx = iconX + c * iconScale + sx;
            const fy = iconY + r * iconScale + sy;
            if (fx >= 0 && fx < W && fy >= 0 && fy < H) px[fy][fx] = [0x7c, 0x3a, 0xed];
          }
      }
    }
  }

  // Title: "Estate IQ" — scale 12
  const title = "Estate IQ";
  const titleScale = 12;
  const titleW = textWidth(title, titleScale);
  drawText(title, Math.floor((W - titleW) / 2), 230, titleScale, WHITE);

  // Subtitle: "For Ethiopian Real Estate Agents" — scale 5
  const sub = "For Ethiopian Real Estate Agents";
  const subScale = 5;
  const subW = textWidth(sub, subScale);
  drawText(sub, Math.floor((W - subW) / 2), 340, subScale, PURPLE);

  // Separator line
  const lineY = 320;
  for (let x = W * 0.25; x < W * 0.75; x++) {
    px[lineY][Math.floor(x)] = [0x7c, 0x3a, 0xed];
  }

  return makePng(W, H, (x, y) => px[y][x]);
}

// ── Write files ────────────────────────────────────────────────────────────────

const OUT = path.resolve(__dirname, "../client/public");

console.log("Generating favicon 32×32...");
const fav32 = makeFavicon(32);
fs.writeFileSync(path.join(OUT, "favicon.png"), fav32);
console.log(`  favicon.png: ${fav32.length} bytes`);

console.log("Generating apple-touch-icon 180×180...");
const fav180 = makeFavicon(180);
fs.writeFileSync(path.join(OUT, "apple-touch-icon.png"), fav180);
console.log(`  apple-touch-icon.png: ${fav180.length} bytes`);

console.log("Generating og-image 1200×630...");
const og = makeOgImage();
fs.writeFileSync(path.join(OUT, "og-image.png"), og);
console.log(`  og-image.png: ${og.length} bytes`);

console.log("Done.");
