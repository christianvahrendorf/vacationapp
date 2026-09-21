import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const svgPath = fileURLToPath(new URL("../public/logo/meyer-icon-square.png", import.meta.url));

const targets = [
  { out: "public/icons/icon-192.png", size: 192 },
  { out: "public/icons/icon-512.png", size: 512 },
  { out: "src/app/icon.png", size: 192 },
  { out: "src/app/apple-icon.png", size: 180 },
];

await mkdir(new URL("../public/icons/", import.meta.url), { recursive: true });

for (const { out, size } of targets) {
  await sharp(svgPath)
    .resize(size, size)
    .png()
    .toFile(fileURLToPath(new URL(`../${out}`, import.meta.url)));
  console.log(`wrote ${out} (${size}x${size})`);
}
