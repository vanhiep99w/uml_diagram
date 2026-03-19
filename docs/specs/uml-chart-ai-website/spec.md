# Spec: UML Chart AI Website

## ADDED Requirements

### Requirement: AI Text-to-Diagram Generation
Users can describe a UML diagram in plain language and receive a rendered diagram with source code.

**Priority**: MUST

#### Scenario: Generate a class diagram from description
- **GIVEN** a logged-in user on the editor page with AI provider configured
- **WHEN** the user types "Create a class diagram for an e-commerce system with Product, Order, and Customer" and clicks Generate
- **THEN** a PlantUML/Mermaid class diagram is rendered and the source code is shown in the editor

#### Scenario: Ambiguous description
- **GIVEN** a logged-in user on the editor page
- **WHEN** the user submits a description that is too vague (e.g., "make a diagram")
- **THEN** the AI responds with a clarifying question rather than generating an incorrect diagram

#### Scenario: AI provider not configured
- **GIVEN** a logged-in user who has not configured an AI provider
- **WHEN** the user attempts to generate a diagram
- **THEN** the app prompts the user to configure their AI provider settings before proceeding

---

### Requirement: AI Chat Refinement
Users can iteratively refine an existing diagram by chatting with AI.

**Priority**: MUST

#### Scenario: Add element via chat
- **GIVEN** a user has a rendered diagram on screen
- **WHEN** the user types "Add a payment service that connects to Order" in the chat
- **THEN** the diagram updates with the new element and the source code reflects the change

#### Scenario: Remove element via chat
- **GIVEN** a user has a rendered diagram via chat
- **WHEN** the user types "Remove the PaymentService class"
- **THEN** the diagram updates with the element removed

#### Scenario: Undo AI change via chat
- **GIVEN** a user has refined a diagram via chat
- **WHEN** the user types "Undo the last change"
- **THEN** the diagram reverts to the previous state

---

### Requirement: OpenAI-Compatible Provider Configuration
Users can configure their own AI provider using any OpenAI-compatible endpoint.

**Priority**: MUST

#### Scenario: Configure custom endpoint
- **GIVEN** a logged-in user on the settings page
- **WHEN** the user enters a base URL (e.g., `http://localhost:11434/v1`) and API key, selects a model, and saves
- **THEN** subsequent AI requests use the configured endpoint and model

#### Scenario: Invalid endpoint
- **GIVEN** a user has entered an unreachable or invalid base URL
- **WHEN** they attempt to generate a diagram
- **THEN** the app shows a clear error: "Could not connect to AI provider. Check your base URL and API key."

#### Scenario: Test connection
- **GIVEN** a user is on the settings page
- **WHEN** the user clicks "Test Connection"
- **THEN** the app sends a minimal request and shows success or failure with a specific error message

---

### Requirement: UML Type Selection
Users can select from all major UML 2.x diagram types before generating.

**Priority**: MUST

#### Scenario: Select diagram type before generating
- **GIVEN** a user on the editor page
- **WHEN** the user selects "Sequence Diagram" from the type selector and enters a description
- **THEN** the AI generates a sequence diagram (not a default class diagram)

#### Scenario: All 10 types available
- **GIVEN** a user on the editor page
- **WHEN** the user opens the diagram type selector
- **THEN** all 10 types are listed: Class, Sequence, Use Case, Activity, Component, State, Deployment, Object, Communication, Timing

---

### Requirement: Source Code View and Manual Edit
Users can view and manually edit the PlantUML/Mermaid source code of their diagram.

**Priority**: MUST

#### Scenario: View source after generation
- **GIVEN** a diagram has been generated
- **WHEN** the user switches to the Source tab
- **THEN** the raw PlantUML/Mermaid code is shown in the Monaco editor

#### Scenario: Manual edit updates diagram
- **GIVEN** a user is viewing source code in the Monaco editor
- **WHEN** the user edits the source and clicks Render (or auto-renders on change)
- **THEN** the visual diagram updates to reflect the manual edit

#### Scenario: Invalid source code
- **GIVEN** a user has entered invalid PlantUML/Mermaid syntax
- **WHEN** the diagram attempts to render
- **THEN** a syntax error message is shown and the previous valid diagram remains visible

---

### Requirement: Diagram Export
Users can export diagrams as PNG or SVG.

**Priority**: MUST

#### Scenario: Export as PNG
- **GIVEN** a user has a rendered diagram
- **WHEN** the user clicks "Export PNG"
- **THEN** a PNG file is downloaded with the diagram name as filename

#### Scenario: Export as SVG
- **GIVEN** a user has a rendered diagram
- **WHEN** the user clicks "Export SVG"
- **THEN** an SVG file is downloaded preserving vector quality

---

### Requirement: User Registration and Login
Users can create accounts and log in with email and password.

**Priority**: MUST

#### Scenario: Register new account
- **GIVEN** an unauthenticated visitor on the register page
- **WHEN** the user enters a valid email, password (min 8 chars), and submits
- **THEN** an account is created and the user is redirected to the editor

#### Scenario: Login with valid credentials
- **GIVEN** a registered user on the login page
- **WHEN** the user enters correct email and password
- **THEN** the user is authenticated and redirected to their diagram library

#### Scenario: Login with invalid credentials
- **GIVEN** a user on the login page
- **WHEN** the user enters incorrect email or password
- **THEN** an error message is shown: "Invalid email or password"

---

### Requirement: Diagram Library
Users can save, name, rename, delete, and reload diagrams.

**Priority**: MUST

#### Scenario: Save a diagram
- **GIVEN** a logged-in user with a rendered diagram
- **WHEN** the user clicks "Save" and enters a name
- **THEN** the diagram (source + type + metadata) is saved to their library

#### Scenario: Load a saved diagram
- **GIVEN** a logged-in user on the library page
- **WHEN** the user clicks a saved diagram
- **THEN** the editor opens with the diagram rendered and source code loaded in < 2 seconds

#### Scenario: Rename a diagram
- **GIVEN** a saved diagram in the library
- **WHEN** the user clicks rename and enters a new name
- **THEN** the diagram name updates in the library

#### Scenario: Delete a diagram
- **GIVEN** a saved diagram in the library
- **WHEN** the user clicks delete and confirms
- **THEN** the diagram is permanently removed from the library

---

### Requirement: Diagram Rendering
PlantUML/Mermaid source is rendered into a visual diagram.

**Priority**: MUST

#### Scenario: Mermaid diagram renders client-side
- **GIVEN** valid Mermaid source code is in the editor
- **WHEN** the diagram renders
- **THEN** the visual diagram appears without a server round-trip

#### Scenario: PlantUML diagram renders via server
- **GIVEN** valid PlantUML source code is in the editor
- **WHEN** the diagram renders
- **THEN** the app fetches the rendered image from the PlantUML server and displays it

#### Scenario: Large diagram performance
- **GIVEN** a diagram with 50+ nodes
- **WHEN** the diagram renders
- **THEN** rendering completes in < 5 seconds with no UI freeze

---

### Requirement: User Profile Management
Users can update their profile and manage AI provider settings.

**Priority**: SHOULD

#### Scenario: Update AI provider settings
- **GIVEN** a logged-in user on the settings page
- **WHEN** the user updates their base URL, API key, or model and saves
- **THEN** changes take effect immediately for subsequent AI requests

#### Scenario: Change password
- **GIVEN** a logged-in user on the profile page
- **WHEN** the user enters current password and new password and saves
- **THEN** the password is updated and the user remains logged in

---

## MODIFIED Requirements
N/A — greenfield application

## REMOVED Requirements
N/A — greenfield application
