# Design Reference: frames.ag

> This document describes the design patterns, layout structures, and UI decisions used by frames.ag — a reference site for ZKGov's frontend. Screenshots are in this same directory.

**URL:** https://frames.ag/
**Type:** Agent tools marketplace with wallet management and activity feed
**Why it's relevant:** Similar product structure to ZKGov — dashboard, tools/proposals listing, activity feed, agent management. Dark-first design. Clean, professional, not flashy.

---

## Screenshots Index

| File | What It Shows |
|------|--------------|
| `01-frames-hero.png` | Landing page hero — nav, headline, code snippet, tabs |
| `01-frames-fullpage.png` | Full landing page (all sections, forced visible) |
| `02-frames-tools.png` | Tools listing page — search, filters, tool cards grid |
| `03-frames-activity.png` | Activity feed — table with agent names, times, events |
| `04-frames-agentwallet.png` | AgentWallet page — hero with instructions, stats bar |
| `05-frames-agent-spec-modal.png` | Agent-readable spec overlay — markdown content in full-screen dark view |
| `06-frames-tool-expanded.png` | Tool card expanded — shows pricing, "PROMPT COPIED" feedback |
| `07-frames-agentwallet-full.png` | Full agentwallet page — hero + stats + activity feed + footer |
| `08-frames-activity-full.png` | Full activity page — table with pagination, filter dropdown, auto-update |

---

## Site Structure

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing | Hero + tabs (If New/Use Tools/Check Balance) + tool marquee + features + footer |
| `/tools` | Tool Listing | Search + filter dropdown + grid of tool cards with RUN buttons |
| `/activity` | Activity Feed | Table of agent events with pagination + filter + auto-update toggle |
| `/agentwallet` | Agent Wallet | Hero with setup instructions + stats bar + recent activity |

---

## Design Patterns to Study

### 1. Navigation (Top Bar)

- Horizontal top nav — NOT a sidebar
- Left: Logo icon (stylized "F" in white square) + nav items as pill-shaped links
- Active nav item has a bordered pill/box around it (e.g., "TOOLS" has a visible border)
- Right: "GET WALLET" button (primary CTA, always visible)
- Nav text is ALL CAPS, monospace font, small size (~12px), generous letter-spacing
- Sticky top bar with border-bottom
- Above the nav: a thin banner bar "AGENT-FRIENDLY INFORMATION" with icon — subtle, informational

### 2. Hero Section (Landing Page)

- Large centered headline: "Outperform regular agents." — big, bold, white on near-black
- Subtitle paragraph below in muted gray — explains the product in one sentence
- Below that: a dark code-block area with TABS (3 tabs: "IF YOU'RE NEW HERE", "USE TOOLS", "CHECK BALANCE")
- The code block has a monospace instruction and a "COPY" button on the right
- Very minimal — just text, no images, no illustrations, no 3D blobs
- Below the hero: two small stats at the bottom edge — "TXS" and "VOLUME" and "ACTIVITY" links

### 3. Tool Cards (/tools)

- Search input at top with placeholder "Search tools..."
- Filter dropdown: "ANY OUTPUT" with chevron
- Grid/list toggle buttons (grid icon, list icon)
- Each tool card shows:
  - Provider icon (Google "G", OpenAI logo) + tool name in bold (e.g., "google/nano-banana-pro")
  - Category badge: "IMAGE" or "VIDEO" in small uppercase pill
  - Price: "$0.18/image" in muted text
  - Max res: "4096x4096"
  - "RUN" button on hover/always visible
- Cards are in a 2-column grid on desktop
- When you click RUN, the card expands inline showing "PROMPT COPIED" feedback — NOT a separate modal
- Very information-dense but readable. Monospace for technical data.

### 4. Activity Feed (/activity)

- Page title "Activity" with auto-update toggle below ("AUTO UPDATE ON")
- Filter dropdown top-right: "ALL ACTIVITY"
- Table layout with columns: AGENT | TIME | EVENT
- Each row shows:
  - Agent name (bold, clickable) + event count badge (e.g., "8 EVENTS")
  - Collapsible rows (triangle/chevron indicates expandable)
  - Time in relative format: "JUST NOW", "2 MIN AGO", "4 MIN AGO"
  - Event type: "WALLET 3", "PAYMENT 10", "WALLET FAILED" (FAILED in red)
- Pagination at bottom: PREVIOUS [1] 2 3 4 5 NEXT
- Minimal styling — borders are very subtle, near-invisible
- "WALLET FAILED" uses red text for error states — semantic color

### 5. AgentWallet Page

- Split layout hero: left side has headline + numbered steps, right side has code/instruction block
- Headline: "Have the most powerful agent in the room"
- Steps listed as numbered items:
  1. COPY & PASTE IN ANY CLIENT
  2. FUND WALLET WITH AS LITTLE AS $1
  3. AGENT BECOMES SUPERAGENT
- "HIDE" link below steps (collapsible)
- Right side: monospace instruction text + COPY button
- Below hero: Stats bar — "AGENTS 2,118 | TXS 254,778 | VOLUME $62.83K | ACTIVE 24H 29"
  - Stats are horizontally spaced, numbers are BOLD, labels are muted
- Below stats: Activity section (same table format as /activity page but embedded)
- Footer: "MAXIMIZING AGENT POTENTIAL" + social links (GITHUB, TELEGRAM, X)

### 6. Modal/Overlay: Agent Readable Spec

- Full-screen dark overlay (not a centered modal — takes the whole page)
- Content is rendered markdown — headings, paragraphs, lists
- Monospace font throughout
- Sections: Identity, Purpose, Definition, Core capabilities, Tool registry, Policy controls
- Dismissible (though Escape didn't work easily in our testing)
- This is a documentation/spec view, not a form modal

### 7. Footer

- Simple, minimal: brand text "MAXIMIZING AGENT POTENTIAL" on the left
- Social links on the right: GITHUB, TELEGRAM, X — with emoji/icons
- No complex footer with link columns — just one line

---

## Design Principles Observed

1. **Monospace everywhere**: Nav labels, stats, data, buttons — all use monospace or mono-adjacent fonts. This creates a "technical/engineering" feel.

2. **ALL CAPS for labels and nav**: Navigation items, category badges, stat labels — all uppercase with letter-spacing. Body text and headlines are normal case.

3. **Near-black, not pure black**: Background is very dark (#0a0a0a to #111) but not #000000. Cards/surfaces use slightly lighter dark (#1a1a1a range).

4. **Minimal borders**: Borders are barely visible — `rgba(255,255,255,0.06)` range. Separation comes from spacing and subtle background differences, not heavy lines.

5. **Information density done right**: Tool cards pack pricing, resolution, category, and provider into small space without feeling cluttered. Monospace helps with alignment.

6. **No decorative elements**: No gradients, no illustrations, no 3D objects, no hero images. Pure text + data. The product IS the content.

7. **Semantic color only**: Red for "FAILED", green for the accent teal on the logo. No decorative color use.

8. **Inline expansion over modals**: Tool details expand inline rather than opening a modal. Keeps the user in context.

9. **Stats bar pattern**: Horizontal row of key metrics — label in muted text, value in bold white. Used on both the landing page and agentwallet page.

10. **Code-block as hero**: The main CTA is a code snippet you copy — not a "Sign Up" button. Targets developers/technical users directly.

---

## Relevance to ZKGov

| frames.ag Pattern | ZKGov Equivalent |
|-------------------|------------------|
| Tool cards with pricing + category | Proposal cards with vote bars + status |
| Activity feed table | Activity feed (votes cast, proposals created) |
| Stats bar (Agents, TXs, Volume) | Stats bar (Proposals, Votes, Voters, Agents) |
| Top nav with pill-shaped active state | Our nav (sidebar or top) with active indicator |
| "GET WALLET" CTA | "Connect Wallet" CTA |
| Tool RUN → inline expand | Proposal → detail page or inline vote |
| Agent-readable spec overlay | Proposal full description view |
| Filter dropdown (ALL ACTIVITY) | Proposal filter (Active/Passed/Failed) |
| Pagination (PREVIOUS 1 2 3 NEXT) | Proposal list pagination |
| Monospace for technical data | Monospace for wallet addresses, tx hashes, nullifiers |
| Auto-update toggle | Real-time SSE updates |
