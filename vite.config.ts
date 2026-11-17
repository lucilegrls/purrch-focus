import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  plugins: [
    react(),
    {
      name: "purrch-offline",
      apply: "build",
      async closeBundle() {
        const files = (await readdir("dist", { recursive: true }))
          .filter(
            (x) =>
              /\.(html|css|js|svg|png|woff2|webmanifest|txt)$/.test(x) &&
              x !== "sw.js",
          )
          .map((x) => "./" + x.replaceAll("\\", "/"));
        const hash = createHash("sha256");
        for (const file of files) hash.update(await readFile("dist/" + file));
        const version = hash.digest("hex").slice(0, 12);
        await writeFile(
          "dist/sw.js",
          `const PREFIX='purrch-'+new URL(self.registration.scope).pathname;const CACHE=PREFIX+'-${version}';const ASSETS=${JSON.stringify(files)};self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||!e.request.url.startsWith(self.registration.scope))return;e.respondWith(caches.open(CACHE).then(async c=>{const hit=await c.match(e.request);if(hit)return hit;try{return await fetch(e.request)}catch(error){if(e.request.mode==='navigate')return await c.match('./index.html');throw error;}}));});`,
        );
      },
    },
  ],
});
