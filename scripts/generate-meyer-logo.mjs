import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const SRC = "scripts/assets/meyer-logo-source.webp";
const OUT_DIR = "public/logo";

await mkdir(OUT_DIR, { recursive: true });

const { data, info } = await sharp(SRC).raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;
const bg = [data[0], data[1], data[2]];

const LOW = 12;
const HIGH = 55;

function bgDistance(i) {
  const dr = data[i] - bg[0];
  const dg = data[i + 1] - bg[1];
  const db = data[i + 2] - bg[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

// Build an RGBA buffer where near-background pixels become transparent,
// with a soft ramp between LOW/HIGH so edges stay anti-aliased.
const rgba = Buffer.alloc(width * height * 4);
for (let p = 0, i = 0; p < width * height; p++, i += channels) {
  const d = bgDistance(i);
  const alpha = d <= LOW ? 0 : d >= HIGH ? 255 : Math.round(((d - LOW) / (HIGH - LOW)) * 255);
  const o = p * 4;
  rgba[o] = data[i];
  rgba[o + 1] = data[i + 1];
  rgba[o + 2] = data[i + 2];
  rgba[o + 3] = alpha;
}

const freshImage = () =>
  sharp(Buffer.from(rgba), { raw: { width, height, channels: 4 } });

// Full logo (emblem + "MEYER" wordmark), transparent background, trimmed.
await freshImage().trim({ threshold: 10 }).png().toFile(`${OUT_DIR}/meyer-logo.png`);

// Emblem-only crop (horse + dachshund, no wordmark), still transparent —
// for compact placements like the app header. Extract and trim are done
// as two separate pipelines: chaining .trim() directly after .extract()
// hits a sharp/libvips "bad extract area" bug.
const EMBLEM_BOX = { left: 190, top: 45, width: 880, height: 900 };
const extractedEmblem = await freshImage().extract(EMBLEM_BOX).png().toBuffer();
await sharp(extractedEmblem)
  .trim({ threshold: 10 })
  .png()
  .toFile(`${OUT_DIR}/meyer-emblem.png`);

// Opaque, square, padded version of the emblem for the PWA icon (icons
// generally want a solid background rather than transparency).
const PAD_FRACTION = 0.16;
const emblemMeta = await sharp(`${OUT_DIR}/meyer-emblem.png`).metadata();
const side = Math.round(Math.max(emblemMeta.width, emblemMeta.height) * (1 + PAD_FRACTION * 2));

await sharp({
  create: {
    width: side,
    height: side,
    channels: 3,
    background: { r: 254, g: 253, b: 249 },
  },
})
  .png()
  .composite([
    {
      input: await sharp(`${OUT_DIR}/meyer-emblem.png`)
        .flatten({ background: { r: 254, g: 253, b: 249 } })
        .toBuffer(),
      left: Math.round((side - emblemMeta.width) / 2),
      top: Math.round((side - emblemMeta.height) / 2),
    },
  ])
  .toFile(`${OUT_DIR}/meyer-icon-square.png`);

console.log("bg color:", bg);
console.log("emblem meta:", emblemMeta);
console.log("icon square side:", side);
console.log("done");
