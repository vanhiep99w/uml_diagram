# Design: UML Chart AI Website

## Context

UML diagram creation is friction-heavy today — users must learn PlantUML/Mermaid syntax or use slow drag-and-drop tools. This application removes that friction by allowing users to describe diagrams in natural language and refine them via AI chat. It is a greenfield Next.js web application with user accounts, a diagram library, and a bring-your-own AI provider model using any OpenAI-compatible API.

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│                  Browser                     │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐ │
│  │  Editor  │  │  Chat    │  │  Library  │ │
│  │  Page    │  │  Panel   │  │  Page     │ │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘ │
│       │              │              │        │
│  ┌────▼──────────────▼──────────────▼─────┐ │
│  │         Next.js App Router             │ │
│  └────────────────┬───────────────────────┘ │
└───────────────────│─────────────────────────┘
                    │ API Routes
        ┌───────────┼───────────────┐
        │           │               │
   ┌────▼────┐ ┌────▼────┐  ┌──────▼──────┐
   │  Auth   │ │  AI     │  │  Diagram    │
   │ Service │ │ Service │  │  Service    │
   └────┬────┘ └────┬────┘  └──────┬──────┘
        │           │               │
        │    ┌──────▼──────┐        │
        │    │ OpenAI-compat│        │
        │    │  Provider   │        │
        │    └─────────────┘        │
        │                           │
   ┌────▼───────────────────────────▼────┐
   │         Prisma ORM                  │
   └─────────────────┬───────────────────┘
                     │
              ┌──────▼──────┐
              │ Dolt/Postgres│
              │ (congcp/    │
              │ landingpage)│
              └─────────────┘
```

**Rendering pipeline:**
- Mermaid diagrams → rendered client-side via Mermaid.js
- PlantUML diagrams → encoded and sent to PlantUML server, image returned

## Components

### Component 1: Editor Page
- **Purpose**: Main workspace where users generate, view, and edit diagrams
- **Interface**: Inputs — user description, diagram type selection, chat messages; Outputs — rendered diagram, source code, export files
- **Dependencies**: AI Service, Diagram Renderer, Monaco Editor, Diagram Service

### Component 2: AI Service
- **Purpose**: Interfaces with the user-configured OpenAI-compatible provider to generate and refine diagram source code
- **Interface**: `generateDiagram(description, diagramType, apiConfig)` → `{ source: string, format: "mermaid"|"plantuml" }`; `refineDiagram(currentSource, chatMessage, apiConfig)` → `{ source: string }`
- **Dependencies**: OpenAI Node.js SDK (with configurable baseURL), user AI provider config from DB

### Component 3: Diagram Renderer
- **Purpose**: Converts PlantUML/Mermaid source into visual output (SVG/PNG)
- **Interface**: `render(source, format)` → `SVGElement | ImageURL`; `export(format: "png"|"svg")` → `Blob`
- **Dependencies**: Mermaid.js (client-side), PlantUML HTTP server (server-side proxy)

### Component 4: Auth Service
- **Purpose**: Handles registration, login, session management
- **Interface**: NextAuth.js handlers — `signIn`, `signOut`, `getSession`
- **Dependencies**: Prisma (User model), NextAuth.js, bcrypt

### Component 5: Diagram Service
- **Purpose**: CRUD operations for saved diagrams
- **Interface**: `saveDiagram(userId, data)`, `listDiagrams(userId)`, `getDiagram(id)`, `deleteDiagram(id)`, `renameDiagram(id, name)`
- **Dependencies**: Prisma (Diagram model)

### Component 6: Settings / Provider Config
- **Purpose**: Stores and retrieves per-user AI provider configuration (base URL, API key, model)
- **Interface**: `getProviderConfig(userId)`, `saveProviderConfig(userId, config)`, `testConnection(config)`
- **Dependencies**: Prisma (UserSettings model), AI Service (for connection test)

## Data Model

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // bcrypt hashed
  createdAt DateTime @default(now())
  diagrams  Diagram[]
  settings  UserSettings?
}

model UserSettings {
  id          String  @id @default(cuid())
  userId      String  @unique
  aiBaseUrl   String  // e.g. https://api.openai.com/v1
  aiApiKey    String  // encrypted at rest
  aiModel     String  // e.g. gpt-4o
  user        User    @relation(fields: [userId], references: [id])
}

model Diagram {
  id          String   @id @default(cuid())
  userId      String
  name        String
  diagramType String   // class, sequence, usecase, activity, component, state, deployment, object, communication, timing
  format      String   // mermaid | plantuml
  source      String   // raw PlantUML/Mermaid source
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  user        User     @relation(fields: [userId], references: [id])
}
```

## API Design

### Auth
```
POST /api/auth/register     { email, password } → { userId, token }
POST /api/auth/[...nextauth] — NextAuth.js handler (login, logout, session)
```

### AI
```
POST /api/ai/generate
  Body: { description: string, diagramType: string }
  Auth: Required (reads provider config from session userId)
  Response: { source: string, format: "mermaid"|"plantuml" }

POST /api/ai/refine
  Body: { currentSource: string, format: string, message: string }
  Auth: Required
  Response: { source: string }

POST /api/ai/test-connection
  Body: { baseUrl: string, apiKey: string, model: string }
  Auth: Required
  Response: { success: boolean, error?: string }
```

### Diagrams
```
GET    /api/diagrams              → Diagram[]  (user's library)
POST   /api/diagrams              { name, diagramType, format, source } → Diagram
GET    /api/diagrams/:id          → Diagram
PATCH  /api/diagrams/:id          { name?, source? } → Diagram
DELETE /api/diagrams/:id          → 204
```

### Settings
```
GET  /api/settings               → UserSettings (apiKey masked)
PUT  /api/settings               { aiBaseUrl, aiApiKey, aiModel } → UserSettings
```

### PlantUML Proxy
```
POST /api/plantuml/render
  Body: { source: string }
  Response: SVG string (proxied from PlantUML server, avoids CORS)
```

## Error Handling

| Error | HTTP Code | User Message |
|-------|-----------|--------------|
| AI provider unreachable | 502 | "Could not connect to AI provider. Check your base URL and API key." |
| AI returns invalid UML | 422 | "AI generated invalid diagram syntax. Try rephrasing your description." |
| PlantUML server down | 503 | "Diagram rendering is temporarily unavailable. Try the Mermaid format." |
| Unauthenticated request | 401 | Redirect to /login |
| Diagram not found | 404 | "Diagram not found or access denied." |
| Invalid source syntax | 400 | Inline syntax error from Mermaid.js parser |
| Rate limit from AI provider | 429 | "AI provider rate limit reached. Wait a moment and try again." |

## Goals / Non-Goals

**Goals:**
- Any OpenAI-compatible provider works without code changes (just config)
- All 10 UML 2.x types supported and rendered correctly
- Diagrams save/load reliably with full source fidelity
- Source code is always editable by the user

**Non-Goals:**
- Built-in AI API key — users must bring their own
- Real-time collaboration
- Diagram version history
- Mobile-optimized layout

## Decisions

### Decision 1: Mermaid + PlantUML dual rendering
- **Chose**: Use Mermaid.js client-side for Mermaid format; proxy to PlantUML server for PlantUML format
- **Why**: Mermaid.js covers most diagram types with zero server cost. PlantUML server handles types Mermaid can't (detailed UML 2.x features)
- **Alternative considered**: PlantUML-only (server) — rejected because adds server dependency for all renders; Mermaid-only — rejected because incomplete UML 2.x coverage

### Decision 2: Bring-your-own AI provider
- **Chose**: User-configured OpenAI-compatible baseURL + API key, stored encrypted per user
- **Why**: Avoids API cost management, supports Ollama/LM Studio for local privacy, no vendor lock-in
- **Alternative considered**: Bundled API key — rejected due to cost and abuse risk

### Decision 3: Next.js full-stack (no separate backend)
- **Chose**: Next.js API Routes for backend
- **Why**: Single codebase, simpler deployment, Vercel zero-config, sufficient for MVP load
- **Alternative considered**: Separate Express/FastAPI backend — rejected as premature complexity for MVP

### Decision 4: Dolt as database
- **Chose**: Dolt (`congcp/landingpage`) as version-controlled PostgreSQL-compatible database
- **Why**: User requirement; provides git-like version control for data, DoltHub remote sync
- **Alternative considered**: Standard PostgreSQL — viable fallback if Dolt compatibility issues arise

## Risks / Trade-offs

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| PlantUML public server rate limits or downtime | Medium | High | Allow fallback to Mermaid format; consider self-hosting PlantUML |
| AI generates syntactically invalid UML | High | Medium | Validate source with parser before rendering; show error + retry prompt |
| User's AI provider is slow (Ollama on low-end hardware) | Medium | Medium | Show loading indicator; set generous timeout (30s); stream response if provider supports it |
| API key stored in DB compromised | Low | High | Encrypt API keys at rest (AES-256); never return full key in API responses |
| Dolt compatibility gaps with Prisma | Low | High | Test Prisma migrations against Dolt early; fall back to standard Postgres if needed |

## Testing Strategy

| Level | What | Tool |
|-------|------|------|
| Unit | AI Service prompt construction, source validation, error mapping | Vitest |
| Unit | Diagram Service CRUD logic | Vitest |
| Integration | API routes (generate, refine, save, load) with real DB | Vitest + test DB |
| E2E | Full flow: register → configure AI → generate → save → reload | Playwright |
| E2E | Export PNG/SVG download | Playwright |
| Manual | Rendering quality across all 10 UML types | Manual review |
