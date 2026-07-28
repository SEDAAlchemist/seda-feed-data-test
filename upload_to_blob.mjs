// Upload the freshly generated data.json to Vercel Blob at a STABLE, public URL.
//
// The frontend hardcodes that URL (DATA_URL in index.html), so every run must
// publish to the same pathname — no random suffix — and overwrite in place.
//
// Auth: put() reads process.env.BLOB_READ_WRITE_TOKEN automatically. In CI this
// comes from the repo secret of the same name (see .github/workflows/refresh.yml).
//
//   node upload_to_blob.mjs [inputFile] [blobPathname]
//   defaults: data.json -> data.json

import { readFileSync } from 'node:fs';
import { put } from '@vercel/blob';

const file = process.argv[2] || 'data.json';
const pathname = process.argv[3] || 'data.json';

const raw = readFileSync(file, 'utf8');

// Sanity-check before publishing so a broken/empty run never reaches clients.
let parsed;
try {
  parsed = JSON.parse(raw);
} catch {
  console.error(`Refusing to upload: ${file} is not valid JSON.`);
  process.exit(1);
}
const count = Array.isArray(parsed.assets) ? parsed.assets.length : 0;
if (count < 100) {
  console.error(`Refusing to upload: only ${count} assets (expected 100+). Snapshot looks broken.`);
  process.exit(1);
}

const { url } = await put(pathname, raw, {
  access: 'public',
  addRandomSuffix: false,   // stable URL — the frontend depends on it
  allowOverwrite: true,     // replace the previous snapshot in place
  contentType: 'application/json',
  cacheControlMaxAge: 300,  // 5-min edge/browser cache; manual "Reload" cache-busts
});

console.log(`Uploaded ${count} assets (${raw.length} bytes) -> ${url}`);
