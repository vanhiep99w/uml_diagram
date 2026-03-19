# Screen Map: UML Chart AI Website

## Auth Flow (3 screens)

### Login — login-screen
- **Components:** Nav, Input×2 (email, password), Button(primary: "Sign In"), Button(ghost: "Forgot Password"), Button(ghost: "Create Account" link)
- **Spec refs:** spec.md#user-registration-and-login
- **Notes:** Centered card layout, light background, brand logo top. Email + password fields, error alert area, link to register and forgot password.

### Register — register-screen
- **Components:** Nav, Input×3 (email, password, confirm password), Button(primary: "Create Account"), Button(ghost: "Sign In" link)
- **Spec refs:** spec.md#user-registration-and-login
- **Notes:** Similar layout to Login. Min 8 chars password validation hint shown inline.

### Forgot Password — forgot-password-screen
- **Components:** Nav, Input×1 (email), Button(primary: "Reset Password"), Button(ghost: "Back to Login")
- **Spec refs:** spec.md#user-registration-and-login (implied)
- **Notes:** Minimal form. Success state shows confirmation message.

## Editor / Main Workspace (1 screen — Hero)

### Editor — editor-screen
- **Components:** TopBar (logo, diagram name, UML type selector, Save button, Export dropdown), CodeEditorFrame (Monaco), DiagramPreview (rendered output), ChatPanel (AI chat sidebar), ChatMessageBubble×N, Input (chat input), Button(primary: "Generate"), Button(secondary: "Send"), Badge (diagram type), Toast/Alert (errors), EmptyState (no diagram yet)
- **Spec refs:** spec.md#ai-text-to-diagram-generation, spec.md#ai-chat-refinement, spec.md#source-code-view-and-manual-edit, spec.md#diagram-rendering, spec.md#diagram-export, spec.md#uml-type-selection
- **Notes:** Three-panel layout: left = code editor, center = diagram preview (resizable), right = AI chat panel. TopBar spans full width with diagram name editable inline. UML type selector is a dropdown in the toolbar. Export button has PNG/SVG sub-options. Chat panel has message history + input at bottom. This is the most complex screen and the hero for design validation.

## Diagram Library (1 screen)

### Library — library-screen
- **Components:** TopBar (logo, "New Diagram" button, user avatar), Card×N (diagram card with name, type badge, date, thumbnail), EmptyState (no diagrams), Dropdown (sort/filter), Button(destructive: delete), Modal (confirm delete)
- **Spec refs:** spec.md#diagram-library
- **Notes:** Grid layout of diagram cards. Each card shows diagram name, type badge, last modified date, and a small thumbnail preview. Click to open in editor. Right-click or hover menu for rename/delete.

## Settings (1 screen)

### Settings — settings-screen
- **Components:** TopBar (logo, back navigation), Input×3 (Base URL, API Key, Model), Button(primary: "Save Settings"), Button(secondary: "Test Connection"), Badge (connection status: success/error), Input×2 (current password, new password), Button(primary: "Change Password"), Toast/Alert (success/error)
- **Spec refs:** spec.md#openai-compatible-provider-configuration, spec.md#user-profile-management
- **Notes:** Single-column form layout. Two sections: "AI Provider" and "Account". AI Provider section has base URL, API key (masked), model selector, test connection button with status indicator. Account section has change password form.

## Shared Components

| Component | Variants |
|-----------|----------|
| TopBar | Editor variant (with diagram controls), Default variant (logo + nav) |
| Button | Primary, Secondary, Ghost, Destructive |
| Input | Default, Error, Disabled, Password (masked) |
| Card | Diagram card (thumbnail + meta) |
| Badge | Diagram type, Connection status |
| Modal | Confirm dialog (delete) |
| Dropdown/Select | UML type selector, Export options, Sort/filter |
| ChatMessageBubble | User message, AI message |
| CodeEditorFrame | Monaco wrapper with syntax highlighting |
| DiagramPreview | Rendered diagram container |
| EmptyState | No diagrams, No diagram generated yet |
| Toast/Alert | Success, Error, Warning, Info |
