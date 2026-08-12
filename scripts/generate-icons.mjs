/**
 * Generates the original app icons.
 *
 * Everything is drawn from geometry and encoded with Node's built-in zlib, so
 * there are no image dependencies and no placeholder art anywhere in the build.
 */

import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(here, '..', 'public');
const iconsDir = resolve(publicDir, 'icons');

const BASE = [0x12, 0x10, 0x0e];
const SURFACE = [0x1c, 0x19, 0x17];
const GOLD = [0xc9, 0xa2, 0x27];
const LINE = [0x3a, 0x33, 0x2c];

/* ------------------------------------------------------------------ */
/* PNG encoding                                                        */
/* ------------------------------------------------------------------ */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) c = CRC_TABLE[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

function encodePng(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ------------------------------------------------------------------ */
/* Geometry                                                            */
/* ------------------------------------------------------------------ */

function insideRoundedRect(x, y, left, top, right, bottom, radius) {
  if (x < left || x > right || y < top || y > bottom) return false;
  const cx = Math.min(Math.max(x, left + radius), right - radius);
  const cy = Math.min(Math.max(y, top + radius), bottom - radius);
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= radius * radius;
}

function insideTriangle(px, py, ax, ay, bx, by, cx, cy) {
  const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by);
  const d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy);
  const d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

/** A spade in normalised coordinates centred on (0, 0), y pointing down. */
function insideSpade(nx, ny) {
  if (insideTriangle(nx, ny, 0, -0.62, -0.52, 0.1, 0.52, 0.1)) return true;
  const lobeR = 0.3;
  if ((nx + 0.28) ** 2 + (ny - 0.05) ** 2 <= lobeR * lobeR) return true;
  if ((nx - 0.28) ** 2 + (ny - 0.05) ** 2 <= lobeR * lobeR) return true;
  /* Stem: a trapezoid widening towards the base. */
  if (ny >= 0.18 && ny <= 0.56) {
    const t = (ny - 0.18) / (0.56 - 0.18);
    const halfWidth = 0.05 + t * 0.19;
    if (Math.abs(nx) <= halfWidth) return true;
  }
  return false;
}

/**
 * @param size pixel size of the square icon
 * @param options.fullBleed true for maskable and Apple icons
 * @param options.contentScale spade size relative to the icon
 */
function drawIcon(size, { fullBleed, contentScale, opaque }) {
  const samples = 4;
  const rgba = Buffer.alloc(size * size * 4);
  const radius = fullBleed ? 0 : size * 0.22;
  const inset = fullBleed ? 0 : size * 0.02;
  const ringOuter = size * (fullBleed ? 0.38 : 0.36);
  const ringInner = ringOuter - size * 0.022;
  const cx = size / 2;
  const cy = size / 2;
  const spadeSize = size * contentScale;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < samples; sy += 1) {
        for (let sx = 0; sx < samples; sx += 1) {
          const px = x + (sx + 0.5) / samples;
          const py = y + (sy + 0.5) / samples;
          let colour = null;
          let alpha = 0;

          if (insideRoundedRect(px, py, inset, inset, size - inset, size - inset, radius)) {
            colour = BASE;
            alpha = 255;
            const dist = Math.hypot(px - cx, py - cy);
            /* A soft raised disc lifts the mark off the background. */
            if (dist <= ringOuter) colour = SURFACE;
            if (dist <= ringOuter && dist >= ringInner) colour = LINE;
            if (insideSpade((px - cx) / spadeSize, (py - cy) / spadeSize)) colour = GOLD;
          } else if (opaque) {
            colour = BASE;
            alpha = 255;
          }

          if (colour) {
            r += colour[0];
            g += colour[1];
            b += colour[2];
            a += alpha;
          }
        }
      }
      const total = samples * samples;
      const index = (y * size + x) * 4;
      rgba[index] = Math.round(r / total);
      rgba[index + 1] = Math.round(g / total);
      rgba[index + 2] = Math.round(b / total);
      rgba[index + 3] = Math.round(a / total);
    }
  }
  return encodePng(size, size, rgba);
}

const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="بنت السبيت">
  <rect x="1" y="1" width="62" height="62" rx="14" fill="#12100e"/>
  <circle cx="32" cy="32" r="23" fill="#1c1917" stroke="#3a332c" stroke-width="1.4"/>
  <g fill="#c9a227">
    <polygon points="32,11.5 15.4,34.4 48.6,34.4"/>
    <circle cx="24.1" cy="33.6" r="9.6"/>
    <circle cx="39.9" cy="33.6" r="9.6"/>
    <polygon points="30.4,37.8 33.6,37.8 39.7,50 24.3,50"/>
  </g>
</svg>
`;

mkdirSync(iconsDir, { recursive: true });

writeFileSync(
  resolve(iconsDir, 'icon-192.png'),
  drawIcon(192, { fullBleed: false, contentScale: 0.34, opaque: false }),
);
writeFileSync(
  resolve(iconsDir, 'icon-512.png'),
  drawIcon(512, { fullBleed: false, contentScale: 0.34, opaque: false }),
);
writeFileSync(
  resolve(iconsDir, 'icon-maskable-512.png'),
  drawIcon(512, { fullBleed: true, contentScale: 0.24, opaque: true }),
);
writeFileSync(
  resolve(publicDir, 'apple-touch-icon.png'),
  drawIcon(180, { fullBleed: true, contentScale: 0.3, opaque: true }),
);
writeFileSync(resolve(publicDir, 'favicon.svg'), FAVICON_SVG);

console.log('icons written to public/');
