import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
for (const size of [192, 512])
  await sharp("public/icon.svg")
    .resize(size)
    .png()
    .toFile(`public/icon-${size}.png`);
for (const [density, size] of Object.entries({
  mdpi: 48,
  hdpi: 72,
  xhdpi: 96,
  xxhdpi: 144,
  xxxhdpi: 192,
})) {
  const dir = `android/app/src/main/res/mipmap-${density}`;
  await mkdir(dir, { recursive: true });
  for (const name of [
    "ic_launcher",
    "ic_launcher_round",
    "ic_launcher_foreground",
  ])
    await sharp("public/icon.svg")
      .resize(size)
      .png()
      .toFile(`${dir}/${name}.png`);
}
// Use the complete illustration on all Android versions, including adaptive launchers.
for (const name of ["ic_launcher", "ic_launcher_round"])
  await writeFile(
    `android/app/src/main/res/mipmap-anydpi-v26/${name}.xml`,
    `<?xml version="1.0" encoding="utf-8"?><adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android"><background android:drawable="@color/ic_launcher_background"/><foreground android:drawable="@mipmap/ic_launcher_foreground"/></adaptive-icon>`,
  );
console.log("Purrch icons generated.");
