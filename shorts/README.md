# @zkgov/shorts

Short-form social videos for ZKGov. Built with [Remotion](https://www.remotion.dev) — every frame is a React render.

Lives next to `packages/web` and `packages/mcp`. Does not touch the app.

## Aesthetic

Pulled directly from the real ZKGov site (`packages/web/src/app/globals.css`):

- Background `#0a0a0a`, text `#fafafa`, accent `#818cf8` (indigo-400)
- Fonts: Geist + Geist Mono (loaded from Google Fonts at render time)
- All-caps monospace nav pills, 0.1em tracking
- Solidity code block with macOS-style traffic-light chrome
- Real copy lifted from `src/components/docs/content/Quickstart.tsx`

If the site's palette moves, update `src/theme/index.ts` and re-render.

## Compositions

### `ZkGovQuickstart`

30 seconds, 1080×1920 vertical. Walks through the 5 quickstart steps:

| Scene    | Frames   | What happens                                       |
|----------|----------|----------------------------------------------------|
| Hero     | 0–120    | Big "ANONYMOUS ON-CHAIN VOTING" title card         |
| Faucet   | 120–240  | HSK balance ticks up from 0 → 0.250                |
| Connect  | 240–360  | Wallet avatar connects → shows `0X7D71…F49C`       |
| Identity | 360–510  | Semaphore commitment types out char-by-char        |
| Register | 510–660  | Real `register()` solidity snippet + tx progress   |
| Vote     | 660–810  | Proposal #042, picks FOR, Groth16 proof bar        |
| Outro    | 810–900  | "You just voted anonymously." + zkgov.app outro    |

## Quick start

```bash
cd packages/shorts
npm install

# Live-preview in the browser
npm run dev

# Render to out/quickstart.mp4
npm run build

# Higher quality (CRF 18 instead of default)
npm run build:hq
```

First install pulls a headless Chromium (~150MB) for rendering. One-time.

## Project layout

```
src/
  index.ts                          Remotion entry
  Root.tsx                          registers the composition + loads fonts
  theme/index.ts                    colors, fonts, letter-spacing tokens
  compositions/ZkGovQuickstart/
    index.tsx                       scene sequencing
    TopBar.tsx                      logo + active-section pill + wallet pill
    scenes.tsx                      the 7 scenes (hero → outro)
    ui.tsx                          atoms: Heading, Body, Card, Pill, CodeSnippet
```

## Changing copy

All user-facing strings live in `scenes.tsx`. Search for the step you want
and edit the text — no build step beyond the next render.

## Next things worth building

- **`ProposalClip` composition** — one proposal → one 15-second short with
  title, For/Against split, and tally.
- **`DailyGov` composition** — a cron-friendly daily recap: new proposals,
  closing votes, top commenters.
- **Claude-driven script** — read today's governance state via the ZKGov
  MCP server, pass it to a Remotion composition as props, render an MP4.
  The MCP server is right next door at `packages/mcp`.

## Rendering programmatically (for the above)

```ts
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

const serveUrl = await bundle({ entryPoint: "./src/index.ts" });
const composition = await selectComposition({
  serveUrl,
  id: "ZkGovQuickstart",
});
await renderMedia({
  composition,
  serveUrl,
  codec: "h264",
  outputLocation: "out/auto.mp4",
});
```
