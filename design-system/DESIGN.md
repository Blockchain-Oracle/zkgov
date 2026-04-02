# ZKGov Design System

> Professional governance UI for the agent era. Moody dark mode, purposeful motion, zero AI slop.

---

## Brand Identity

**Name:** ZKGov
**Tagline:** "Private governance. Verified results."
**Personality:** Trustworthy, forward-thinking, technically credible, not playful
**Logo:** Geometric shield with ZK circuit pattern. SVG, monochrome variants. Must work at 16x16px (favicon).

---

## Color System

### Dark Mode (Primary — design dark-first)

```css
--bg-deep:        #0C1120;    /* Deep navy — NOT pure black */
--bg-base:        #111827;    /* Main surface */
--bg-elevated:    #1F2937;    /* Cards, dropdowns */
--bg-hover:       #374151;    /* Hover state on surfaces */

--text-primary:   #F9FAFB;    /* Headings, primary content */
--text-secondary: #9CA3AF;    /* Body, descriptions */
--text-muted:     #6B7280;    /* Timestamps, metadata */

--accent:         #3B82F6;    /* Primary blue — actions, links */
--accent-hover:   #2563EB;    /* Darker on hover */
--accent-glow:    rgba(59, 130, 246, 0.15);  /* Subtle glow behind accent elements */

--success:        #10B981;    /* Vote "For", passed proposals */
--danger:         #EF4444;    /* Vote "Against", failed, errors */
--warning:        #F59E0B;    /* Pending, quorum warnings */
--info:           #8B5CF6;    /* Abstain, neutral info */

--border:         rgba(255, 255, 255, 0.08);  /* Subtle borders */
--border-active:  rgba(59, 130, 246, 0.4);    /* Focus/active borders */

--ring:           rgba(59, 130, 246, 0.5);    /* Focus ring */
```

### Light Mode

```css
--bg-deep:        #F8FAFC;
--bg-base:        #FFFFFF;
--bg-elevated:    #F1F5F9;
--bg-hover:       #E2E8F0;

--text-primary:   #0F172A;
--text-secondary: #475569;
--text-muted:     #94A3B8;

--accent:         #2563EB;
--accent-hover:   #1D4ED8;

--success:        #059669;
--danger:         #DC2626;
--warning:        #D97706;
--info:           #7C3AED;

--border:         #E2E8F0;
--border-active:  #3B82F6;
```

### Semantic Tokens (component-level)

```css
--vote-for:       var(--success);
--vote-against:   var(--danger);
--vote-abstain:   var(--info);
--proposal-active: var(--accent);
--proposal-passed: var(--success);
--proposal-failed: var(--danger);
--quorum-met:     var(--success);
--quorum-unmet:   var(--warning);
```

---

## Typography

### Font Stack

**Heading:** Satoshi (Variable) — distinctive, crypto-adjacent, NOT Inter
**Body:** Satoshi (Variable) — clean readability at all sizes
**Mono:** JetBrains Mono — for addresses, tx hashes, proposal IDs, code

Fallback: `"Satoshi", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

If Satoshi unavailable, fallback to **Sora** (decentralized community font) or **Exo 2** (web3/futuristic).

### Type Scale

| Role | Size | Weight | Line Height | Letter Spacing |
|------|------|--------|-------------|---------------|
| Display | 48px / 3rem | 700 | 1.1 | -0.02em |
| H1 | 36px / 2.25rem | 700 | 1.2 | -0.015em |
| H2 | 30px / 1.875rem | 600 | 1.3 | -0.01em |
| H3 | 24px / 1.5rem | 600 | 1.35 | 0 |
| H4 | 20px / 1.25rem | 600 | 1.4 | 0 |
| Body | 16px / 1rem | 400 | 1.6 | 0 |
| Body Small | 14px / 0.875rem | 400 | 1.5 | 0 |
| Caption | 12px / 0.75rem | 500 | 1.4 | 0.01em |
| Mono | 14px / 0.875rem | 400 | 1.5 | 0 |

---

## Border Radius Hierarchy (NOT uniform)

```css
--radius-sm:   4px;    /* Badges, tags, small chips */
--radius-md:   8px;    /* Inputs, buttons */
--radius-lg:   12px;   /* Cards, dropdowns */
--radius-xl:   16px;   /* Modals, featured cards */
--radius-full: 9999px; /* Avatars, pills */
```

---

## Spacing Scale (8dp system)

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
```

---

## Motion System

**Library:** Motion (motion/react) — NOT framer-motion (same lib, new name)

### Duration Tokens
```css
--duration-fast:   150ms;  /* Hover, focus, press feedback */
--duration-normal: 250ms;  /* State transitions, dropdowns */
--duration-slow:   400ms;  /* Page transitions, modals */
```

### Easing
```css
--ease-out:  cubic-bezier(0.16, 1, 0.3, 1);   /* Enter animations */
--ease-in:   cubic-bezier(0.55, 0, 1, 0.45);   /* Exit animations */
--ease-spring: spring({ damping: 20, stiffness: 90 });  /* Natural bounce */
```

### Animation Principles
- Exit animations = 60-70% of enter duration (feel snappier)
- Stagger list items by 30-50ms each
- Scale feedback: 0.97 on press, 1.0 on release
- Fade + translate for enter (opacity 0→1, y 8→0)
- Always respect `prefers-reduced-motion`
- Max 1-2 animated elements per viewport

---

## Component Patterns

### Proposal Card
- `--radius-lg` corners
- Subtle border (`--border`)
- Vote progress bars (for/against/abstain with semantic colors)
- Status badge (Active/Passed/Failed/Cancelled)
- Time remaining in relative format ("2d 14h left")
- Comment count
- Hover: border color transitions to `--border-active`

### Vote Form
- Three large buttons: For (green), Against (red), Abstain (purple)
- Loading state with ZK proof animation (shield/circuit motif)
- Success state with checkmark animation
- Scale feedback on press (0.97)

### Quorum Bar
- Progress bar from 0 to quorum target
- Color transitions: `--warning` below quorum, `--success` at/above
- Current count / target count label

### Navigation
- Sidebar on desktop (collapsible)
- Bottom nav on mobile (max 4-5 items)
- Items: Dashboard, Proposals, Agents, Profile
- Active state: accent background pill + text color change
- Wallet connect button in top-right (always visible)

### Activity Feed
- Vertical timeline with event cards
- Event types: vote_cast, proposal_created, comment_added, proposal_tallied
- Agent events show agent avatar + name
- Human events show truncated address
- Real-time updates via SSE (new items fade + slide in from top)

---

## Icons

**Library:** Lucide React — consistent stroke width, clean, NOT emoji
- Custom icons for: ZK shield, vote/ballot, proposal, agent

---

## Logo Spec

**Mark:** A geometric shield composed of intersecting circuit-like lines, suggesting both protection (governance) and zero-knowledge (circuits/proofs)
- Must work as: full color, monochrome white, monochrome dark
- Sizes: favicon (16x16), nav (24x24), hero (48x48+)
- Format: SVG with clean paths, no raster
- Color: Uses `--accent` blue as primary mark color

---

## Anti-Patterns (What NOT to Do)

1. **No purple-to-blue gradients** — biggest AI slop signal
2. **No Inter font** — it's the default of every AI tool
3. **No uniform border-radius** — vary by component importance
4. **No abstract 3D blobs** — use real product screenshots or minimal illustrations
5. **No vague headlines** — "Private governance. Verified results." not "Build the future of web3"
6. **No emoji icons** — SVG only (Lucide)
7. **No pure black (#000)** — use deep navy (#0C1120)
8. **No decorative-only animation** — every motion communicates state
9. **No fade-in on every element** — animate 1-2 key elements per view
10. **No Material default components** — customize everything

---

## Reference Sites

- **Snapshot** (snapshot.org) — content-first governance, warm near-black dark mode
- **Tally** (tally.xyz) — card-based governance with rich data
- **Linear** (linear.app) — best-in-class dark mode SaaS, motion design
- **Uniswap** (uniswap.org) — iconic accent color, warm dark grays
- **shadcn-admin** (github.com/satnaing/shadcn-admin) — best open-source shadcn dashboard

---

## Key Libraries

| Library | Purpose |
|---------|---------|
| `next` (v15) | Framework |
| `tailwindcss` | Utility CSS |
| shadcn/ui components | Base components (customized) |
| `motion` (motion/react) | Animations |
| `@fontsource/satoshi` or Google Fonts | Typography |
| `lucide-react` | Icons |
| `recharts` or `tremor` | Charts (if analytics needed) |
| `@reown/appkit` | Wallet connection |
| `@telegram-apps/sdk-react` | Telegram Mini App |
