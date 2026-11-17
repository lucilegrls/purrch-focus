import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
for (const size of [192, 512])
  await sharp("artwork/originals/app-icon.png")
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
    await sharp("artwork/originals/app-icon.png")
      .resize(
        name === "ic_launcher_foreground" ? Math.round(size * 2.25) : size,
      )
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
await mkdir("android/app/src/main/res/drawable-nodpi", { recursive: true });
await sharp("src/assets/painted/tabby-sleeping.webp")
  .resize(600)
  .webp({ quality: 90 })
  .toFile("android/app/src/main/res/drawable-nodpi/sleeping_tabby.webp");
