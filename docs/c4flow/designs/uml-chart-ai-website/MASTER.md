# MASTER: UML Chart AI Website Design System

## Design Direction

**Aesthetic**: Developer-focused dark terminal with refined precision — deep navy canvas, blue accent, monospace code feel, clean card-based UML rendering. Intentionally technical, not generic dark mode.

**Memorable Element**: The live UML class diagram rendering in the preview panel with color-coded class headers matched to the syntax-highlighted code editor.

## Design Tokens

| Token | Value | Purpose |
|-------|-------|---------|
| `--primary` | `#3B82F6` | CTAs, links, active states |
| `--primary-hover` | `#5B9BFF` | Hover state for primary |
| `--primary-muted` | `#1E3A6E` | Primary backgrounds, badges |
| `--secondary` | `#22D3EE` | Cyan accent, code keywords |
| `--bg` | `#0C1222` | Page background |
| `--bg-elevated` | `#1A2540` | TopBar, panels, elevated surfaces |
| `--bg-surface` | `#131B2E` | Intermediate surfaces |
| `--fg` | `#E8ECF4` | Primary text |
| `--fg-secondary` | `#8896B0` | Secondary text |
| `--fg-muted` | `#576380` | Tertiary/placeholder text |
| `--card` | `#151E33` | Card backgrounds |
| `--border` | `#1F2D47` | Borders, dividers |
| `--border-focus` | `#3B82F6` | Focus rings |
| `--input-bg` | `#0F1829` | Input field backgrounds |
| `--destructive` | `#EF4444` | Errors, delete actions |
| `--destructive-muted` | `#4A1515` | Error backgrounds |
| `--success` | `#22C55E` | Confirmations |
| `--success-muted` | `#14352A` | Success backgrounds |
| `--warning` | `#EAB308` | Warnings |
| `--warning-muted` | `#3D3215` | Warning backgrounds |
| `--overlay` | `#00000080` | Modal overlays |
| `font-heading` | `'Plus Jakarta Sans', sans-serif` | Headings, logos, labels |
| `font-body` | `'Figtree', sans-serif` | Body text, UI elements |
| `font-mono` | `'JetBrains Mono', monospace` | Code, data values |
| `radius-sm` | `4` | Small radius (badges inner) |
| `radius-md` | `8` | Medium radius (buttons, inputs) |
| `radius-lg` | `12` | Large radius (cards, panels) |
| `space-xs` | `4` | Tight spacing |
| `space-sm` | `8` | Small spacing |
| `space-md` | `16` | Medium spacing |
| `space-lg` | `32` | Large spacing |
| `space-xl` | `64` | XL spacing |

## Typography Scale

| Role | Size | Weight | Font |
|------|------|--------|------|
| H1 | 36px | 700 | Plus Jakarta Sans |
| H2 | 28px | 700 | Plus Jakarta Sans |
| H3 | 22px | 600 | Plus Jakarta Sans |
| Body | 16px | 400 | Figtree |
| Small | 14px | 400 | Figtree |
| Caption | 12px | 500 | Figtree |
| Mono | 14px | 400 | JetBrains Mono |

## Reusable Components

| Component | Variants | Frame ID |
|-----------|----------|----------|
| Button | Primary | `fOIP1` |
| Button | Secondary | `PONBJ` |
| Button | Ghost | `kS9fa` |
| Button | Destructive | `MbTSf` |
| Input | Default | `CYVVP` |
| Input | Error | `KjhA9` |
| Badge | Default (blue) | `V8Lqo` |
| Badge | Success | `hCAcE` |
| Badge | Warning | `ryWNf` |
| Badge | Destructive | `ozNzV` |
| TopBar | Default | `KxD1v` |
| DiagramCard | Default | `ad6Z6` |
| ChatBubble | User | `kTSvS` |
| ChatBubble | AI | `m2vcd` |
| Toast | Success | `CPKdx` |
| Toast | Error | `K9cbf` |
| Select | Default | `M6XCl` |
| EmptyState | Default | `hUflz` |

## Screens

| Screen | Frame ID | Status |
|--------|----------|--------|
| Editor (Hero) | `jMCqg` | ✅ Complete |
| Login | `qXIfm` | ✅ Complete |
| Register | `vXPxo` | ✅ Complete |
| Forgot Password | `EWgZZ` | ✅ Complete |
| Library | `Ntk8Z` | ✅ Complete |
| Settings | `EVdcV` | ✅ Complete |

## File

- Pencil file: `docs/c4flow/designs/uml-chart-ai-website/uml-chart-ai-website.pen`
- Design System Frame ID: `64Iby`
- Hero Screen Frame ID: `jMCqg`
