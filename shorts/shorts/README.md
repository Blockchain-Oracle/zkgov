# @zkgov/shorts

Short-form + landscape social videos for ZKGov. Built with [Remotion](https://www.remotion.dev) — every frame is a React render.

## Formats

Three compositions, same scenes, different canvases:

| ID                         | Size       | Use for                                 |
|----------------------------|------------|-----------------------------------------|
| `ZkGovQuickstart`          | 1080×1920  | TikTok · Reels · YouTube Shorts · X     |
| `ZkGovQuickstartWide`      | 1920×1080  | YouTube · landscape X post · embed      |
| `ZkGovQuickstartSquare`    | 1080×1080  | LinkedIn · Instagram feed               |

## Quick start

```bash
cd packages/shorts
npm install

npm run dev           # live preview in Remotion Studio
npm run build         # vertical  → out/quickstart.mp4
npm run build:wide    # landscape → out/quickstart-wide.mp4
npm run build:all     # both
npm run build:hq      # vertical at CRF 18
```

First install pulls a headless Chromium (~150MB). One-time.

## Audio

Music bed + 4 SFX are wired in. **Drop these files into `public/audio/`:**

- `music-bed.mp3` — 30s+ ambient/minimal loop (whole video, vol 0.35)
- `whoosh.mp3` — scene transitions (fires 7×)
- `keytype.mp3` — typewriter sfx for the Semaphore commitment
- `chime.mp3` — tx confirmation
- `success.mp3` — vote submitted

Missing files render silent — no crash — so you can ship with just the
music bed and add SFX later. Sources in `public/audio/README.md`.

## Aesthetic

Pulled from the real ZKGov site (`packages/web/src/app/globals.css`):

- Background `#0a0a0a`, text `#fafafa`, accent `#818cf8` (indigo-400)
- Geist + Geist Mono, loaded from Google Fonts at render time
- All-caps monospace nav pills, 0.1em tracking
- macOS traffic-light code chrome
- Real copy from `src/components/docs/content/Quickstart.tsx`
- Real `register()` solidity snippet

Change tokens in `src/theme/index.ts`.

## Scenes

30 seconds. 900 frames @ 30fps.

| Scene    | Frames   | What happens                                       |
|----------|----------|----------------------------------------------------|
| Hero     | 0–120    | ANONYMOUS ON-CHAIN VOTING title card               |
| Faucet   | 120–240  | HSK balance ticks 0 → 0.250                        |
| Connect  | 240–360  | Wallet connects → `0X7D71…F49C`                    |
| Identity | 360–510  | Semaphore commitment types out char-by-char       |
| Register | 510–660  | `register()` snippet + tx progress → confirmed     |
| Vote     | 660–810  | Proposal #042, picks FOR, Groth16 proof bar        |
| Outro    | 810–900  | "You just voted anonymously." + zkgov.app          |

## Project layout

```
src/
  index.ts                          Remotion entry
  Root.tsx                          registers 3 compositions + loads fonts
  theme/index.ts                    colors, fonts, tracking tokens
  compositions/ZkGovQuickstart/
    index.tsx                       scene sequencing + audio wiring
    TopBar.tsx                      logo + active-section pill + wallet pill
    scenes.tsx                      the 7 scenes (hero → outro)
    ui.tsx                          atoms: Heading, Body, Card, Pill, CodeSnippet
public/audio/                       music bed + SFX (see README)
```

## Changing copy

All user-facing strings live in `scenes.tsx`. Search the step, edit,
re-render.

## Layout note on landscape

Scenes are `AbsoluteFill` + flex-centered, so they reflow to 1920×1080
without a separate template. Typography was tuned for vertical — once
you preview landscape in Studio, we can bump font sizes / reduce max
widths if anything feels cramped or too airy.

## Rendering programmatically

```ts
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

const serveUrl = await bundle({ entryPoint: "./src/index.ts" });
const composition = await selectComposition({
  serveUrl,
  id: "ZkGovQuickstartWide",
});
await renderMedia({
  composition,
  serveUrl,
  codec: "h264",
  outputLocation: "out/auto.mp4",
});
```

## Relocating

To move this out to `/Users/apple/dev/hackathon/Hashkey/shorts`:

```bash
mv packages/web/packages/shorts /Users/apple/dev/hackathon/Hashkey/shorts
```

Nothing inside references the monorepo, so it's drop-in portable.
