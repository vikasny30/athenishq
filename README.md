---
title: AthenisHQ
emoji: 🦉
colorFrom: indigo
colorTo: blue
sdk: static
pinned: false
license: bsl-1.0
---

# AthenisHQ

Product-portfolio homepage for AthenisHQ — an independent AI product studio.
Single self-contained `index.html`, no build step, no framework.

Products, grouped by vertical:

| Vertical | Product | Status | Links to |
|---|---|---|---|
| AI Infrastructure & Safety | Aletheia | Live | https://carmeai.com |
| Fintech & Capital Markets | OwlScore | Live | https://owlscore.carmeai.com |
| Productivity Tools | OwlNote | In development | mailto notify-me |
| Productivity Tools | CAL-C | In development | mailto notify-me |
| Mobility & Computer Vision | TireScan | Early concept | mailto notify-me |

## Preview locally

```bash
open index.html
# or
python3 -m http.server 8080
```

## Deploy (Hugging Face Spaces)

This repo's `README.md` frontmatter is already set up as an HF Space (`sdk: static`), matching how carmeai.com and owlscore.carmeai.com are hosted.

1. Create a new Space on Hugging Face (Static SDK), e.g. `athenishq`.
2. `git remote add space https://huggingface.co/spaces/<your-username>/athenishq`
3. `git push space main`
4. In the Space's **Settings → Domains**, add the custom domain `athenishq.com` and follow HF's DNS instructions (CNAME/A record at your registrar).
5. Once athenishq.com is live, point carmeai.com's DNS at the same Space (or set up a redirect) if you want it to mirror this site — that's a registrar + HF settings change, not a code change.

## Live OwlScore stats

The OwlScore card fetches `https://owlscore.carmeai.com/api/scores/latest` client-side (see the `<script>` at the bottom of `index.html`) to show real, current numbers — backtest accuracy, active live predictions, today's top score — instead of a static screenshot. **That endpoint doesn't exist in production yet**: it's a new route added at `receipts/apps/web/app/api/scores/latest/route.ts` (public, CORS-open, read-only, reuses the same `loadTrackRecord()`/`getScreener()` the OwlScore homepage already renders from). It needs to ship with `receipts`' next deploy before the live numbers appear here — until then, the fetch fails silently and the static fallback numbers already in the markup are what visitors see, so nothing breaks either way.

## Notes

- CAL-C already has its own polished landing page with a live interactive demo, built in the `owlcalc` repo (`index.html` + `web/`) but not yet deployed. This site's design system (colors, fonts, glass-card treatment) was matched to that page for brand consistency. Once CAL-C's page is deployed, update its card's `href` here from the `mailto:` link to the live URL.
- Same for OwlNote and TireScan — swap their card CTAs to real links once each has something to point to.
