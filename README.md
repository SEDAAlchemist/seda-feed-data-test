# SEDA Composite Feed Explorer — Data Pipeline

This repo generates the feed-explorer dataset and publishes it to **Vercel Blob**
on a schedule. It is fully decoupled from the frontend: the frontend never runs
this code and never talks to the venue APIs. It only reads the published snapshot.

```
  ┌─────────────────────┐   twice daily    ┌──────────────┐   fetch    ┌──────────────┐
  │ GitHub Actions cron │ ───────────────▶ │ Vercel Blob  │ ─────────▶ │  Frontend    │
  │ refresh_data.py     │  put(data.json)  │ data.json    │  (public)  │ (static site)│
  └─────────────────────┘                  └──────────────┘            └──────────────┘
```

## What runs

- `refresh_data.py` — queries the public venue APIs (Binance spot/futures,
  Lighter, Hyperliquid), merges and classifies assets, and writes `data.json`.
  Takes several minutes (~1,500 rate-limited order-book calls).
- `upload_to_blob.mjs` — validates `data.json`, then uploads it to Vercel Blob at
  a stable public URL (`data.json`), overwriting the previous snapshot in place.
- `.github/workflows/refresh.yml` — runs both, twice daily (05:00 & 17:00 UTC),
  plus a manual "Run workflow" button.

## One-time setup

1. **Create a Blob store** in Vercel: Project → Storage → Create → Blob, access
   **Public**. Copy the `BLOB_READ_WRITE_TOKEN` it generates.
2. **Add the token as a GitHub Actions secret** in *this* repo:
   Settings → Secrets and variables → Actions → New repository secret →
   name `BLOB_READ_WRITE_TOKEN`, value = the token from step 1.
3. **Grab the public URL.** After the first successful run (trigger it manually
   from the Actions tab), open the Blob store in Vercel and copy the public URL
   of `data.json`. Paste it into the frontend repo's `index.html` as `DATA_URL`.

## Run it manually

```bash
python3 refresh_data.py            # writes data.json (use --quick for a fast, depth-cached run)
BLOB_READ_WRITE_TOKEN=xxx npm install
BLOB_READ_WRITE_TOKEN=xxx node upload_to_blob.mjs data.json data.json
```

## Notes for the company-account handoff

- **Secrets do not transfer when a repo is forked** — re-add `BLOB_READ_WRITE_TOKEN`
  on the company repo.
- **Scheduled workflows are disabled on forks by default.** Open the Actions tab
  on the forked repo and enable workflows, then confirm the schedule is active.
- The Blob store and its token are **per Vercel team** — create a fresh store on
  the company Vercel team and update both the secret (here) and `DATA_URL` (frontend).
