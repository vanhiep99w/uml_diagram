# Proposal: UML Chart AI Website

## Why

UML diagrams are essential for software design and communication, but creating them is slow and requires learning specialized syntax (PlantUML, Mermaid, draw.io). AI can eliminate this friction by letting users describe what they want in plain language. Existing tools either require manual drawing (Lucidchart, draw.io) or have limited AI that only handles one or two diagram types. Building a focused AI-first UML tool that covers all UML 2.x types fills this gap.

## What Changes

A new web application is introduced. Users can describe software systems, workflows, or interactions in plain text and receive rendered UML diagrams instantly. They can refine diagrams through AI chat, view the underlying PlantUML/Mermaid source, export as PNG/SVG, and save diagrams to their account for future reference.

## Capabilities

### New Capabilities
- `ai-text-to-diagram`: Generate any UML 2.x diagram from natural language description
- `ai-chat-refinement`: Iteratively refine diagrams through conversation with AI
- `ai-provider-config`: Configure AI provider via OpenAI-compatible API (base URL + API key) — supports any proxy or model compatible with the OpenAI API spec (OpenAI, Azure OpenAI, Ollama, LM Studio, custom proxies, etc.)
- `diagram-renderer`: Render PlantUML/Mermaid source into visual diagram (PNG/SVG)
- `source-code-view`: View and manually edit the underlying PlantUML/Mermaid code
- `diagram-export`: Export diagrams as PNG or SVG
- `user-accounts`: Register, login, manage profile
- `diagram-library`: Save, name, organize, and reload saved diagrams
- `uml-type-selector`: Support all major UML 2.x diagram types (class, sequence, use case, activity, component, state, deployment, object, communication, timing)

### Modified Capabilities
- N/A — greenfield application

## Scope

### In Scope
- Natural language → UML diagram generation (all UML 2.x types)
- AI chat refinement of existing diagrams
- OpenAI-compatible API configuration (base URL + API key, user-provided)
- PlantUML/Mermaid source code view + manual edit
- PNG/SVG export
- User registration and login
- Saved diagram library (create, rename, delete, reload)
- All major UML 2.x diagram types

### Out of Scope (Non-Goals)
- Real-time collaboration / shared workspaces
- Built-in AI API key (users must bring their own)
- Diagram version history / diff
- Import existing diagrams from Lucidchart / draw.io
- Mobile app
- Marketing landing page

## Success Criteria
- User can generate a UML diagram from a natural language description in < 10 seconds
- User can refine a diagram through AI chat in < 3 turns to reach desired output
- All 10 major UML 2.x diagram types are supported and render correctly
- User can configure any OpenAI-compatible endpoint and have it work without code changes
- User can export a diagram as PNG or SVG in 1 click
- Saved diagrams load in < 2 seconds from the library
- User registration and login complete in < 30 seconds

## Impact
- **Positioned against**: Lucidchart, draw.io, Mermaid Live Editor, PlantUML Online — differentiates by being AI-first and supporting any OpenAI-compatible provider
- **Dependencies introduced**: OpenAI-compatible API (user-configured), PlantUML/Mermaid rendering library, authentication service
- **No existing systems modified** — greenfield application
