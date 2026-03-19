# Tech Stack: UML Chart AI Website

## Frontend
- **Framework**: Next.js 14 (React, App Router) — SSR + static rendering, large ecosystem, pairs with Vercel deployment
- **Styling**: Tailwind CSS — utility-first, no CSS overhead
- **Code Editor**: Monaco Editor — VS Code-grade editor for PlantUML/Mermaid source editing
- **Diagram Rendering (client)**: Mermaid.js — client-side rendering, no server required
- **State Management**: React Context + SWR — lightweight, sufficient for this scope

## Backend
- **Framework**: Next.js API Routes — single codebase, no separate server needed
- **Database**: PostgreSQL (via Dolt) — relational, supports user accounts + diagram storage; synced to `congcp/landingpage` on DoltHub
- **ORM**: Prisma — type-safe queries, easy migrations
- **Cache**: N/A — not required for MVP
- **Message Queue**: N/A — not required for MVP

## AI Integration
- **SDK**: OpenAI Node.js SDK — configurable `baseURL` supports any OpenAI-compatible proxy
- **Supported providers**: OpenAI, Azure OpenAI, Ollama, LM Studio, any OpenAI-compatible endpoint
- **Config storage**: Per-user encrypted API key + base URL stored in DB

## Diagram Rendering
- **Mermaid**: Mermaid.js (client-side) — sequence, class, state, activity, ER, etc.
- **PlantUML**: PlantUML public server (plantuml.com) or self-hosted — for UML types not covered by Mermaid
- **Export**: html-to-image / svg serialization for PNG/SVG download

## Auth
- **Library**: NextAuth.js — email/password credentials, extensible for OAuth providers later
- **Session**: JWT sessions — stateless, works on Vercel edge

## Infrastructure
- **Hosting**: Vercel — zero-config Next.js deployment, free tier sufficient for MVP
- **Database host**: DoltHub (`congcp/landingpage`) — version-controlled PostgreSQL-compatible DB
- **Container Runtime**: N/A — serverless on Vercel
- **IaC Tool**: N/A — Vercel manages infra via UI/CLI

## CI/CD
- **Pipeline**: GitHub Actions — lint, type-check, test on PR; auto-deploy to Vercel on merge to main
- **Lock-in risk**: Vercel deployment is low lock-in (standard Node/Next.js, portable)

## Monitoring & Logging
- **APM**: Vercel Analytics (built-in) — page performance, basic metrics
- **Logging**: Console logs → Vercel log drain (MVP); upgrade to Axiom/Datadog post-MVP
- **Alerting**: N/A for MVP

## Deployment Strategy
- **Strategy**: Rolling (Vercel handles automatically)
- **Environments**: `main` → production, PR previews → Vercel preview URLs

## Testing
- **Unit**: Vitest — fast, ESM-native
- **Integration**: Playwright — E2E flows (generate diagram, login, save)
- **Coverage threshold**: 80% for MUST requirements
