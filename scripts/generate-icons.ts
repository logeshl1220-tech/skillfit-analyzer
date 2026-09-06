/**
 * Generates the PWA PNG icons from public/logo.svg.
 * Run with: bun scripts/generate-icons.ts
 */
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const root = join(import.meta.dir, "..");
const outDir = join(root, "public");
mkdirSync(outDir, { recursive: true });

const logo = readFileSync(join(root, "public", "logo.svg"));

// Rasterize the SVG at a high density so downscaling stays crisp.
const rasterize = (size: number) =>
  sharp(logo, { density: 384 }).resize(size, size).png().toBuffer();

// Standard (non-maskable) icons — used as favicon-sized icons, Chrome "any", iOS home screen.
for (const [name, size] of [
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["apple-touch-icon.png", 180],
] as const) {
  await sharp(await rasterize(size)).toFile(join(outDir, name));
  console.log(`wrote ${name} (${size}x${size})`);
}

// Maskable icon: full-bleed app background with the logo inside the 80% safe zone
// (logo occupies ~60% of the canvas) so Android's circular mask never clips it.
const MASKABLE = 512;
const logoSize = Math.round(MASKABLE * 0.6);
const offset = Math.round((MASKABLE - logoSize) / 2);
const logoPng = await rasterize(logoSize);

await sharp({
  create: {
    width: MASKABLE,
    height: MASKABLE,
    channels: 4,
    background: { r: 10, g: 14, b: 22, alpha: 1 }, // #0a0e16 — matches theme/background color
  },
})
  .composite([{ input: logoPng, left: offset, top: offset }])
  .png()
  .toFile(join(outDir, "icon-maskable-512.png"));
console.log(`wrote icon-maskable-512.png (${MASKABLE}x${MASKABLE})`);