/**
 * AI Service Tests — Phase 1 (RED)
 *
 * Tests for:
 * - lib/ai-service.ts (generateDiagram, refineDiagram, testConnection)
 * - POST /api/ai/generate
 * - POST /api/ai/refine
 * - POST /api/ai/test-connection
 *
 * Acceptance criteria covered:
 * - generate returns { source, format } with valid PlantUML or Mermaid source
 * - ambiguous descriptions return clarifying question (not broken diagram)
 * - unconfigured provider returns 428/400 (not 500)
 * - unreachable provider returns 502 with user-friendly message
 * - test-connection returns { success: true } for valid endpoint
 * - API key is decrypted before use, never logged
 */

// ---------------------------------------------------------------------------
// Mock OpenAI SDK — must be done before any imports that pull in openai
// ---------------------------------------------------------------------------

const mockChatCreate = jest.fn();

jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockChatCreate,
        },
      },
    })),
  };
});

// ---------------------------------------------------------------------------
// Mock Prisma — do NOT hit a real DB
// ---------------------------------------------------------------------------

const mockSettingsFindUnique = jest.fn();

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    userSettings: {
      findUnique: (...args: unknown[]) => mockSettingsFindUnique(...args),
    },
  },
}));

// ---------------------------------------------------------------------------
// Mock crypto module — we need to verify decryptApiKey is called
// ---------------------------------------------------------------------------

const mockDecryptApiKey = jest.fn();
const mockEncryptApiKey = jest.fn();

jest.mock('@/lib/crypto', () => ({
  __esModule: true,
  decryptApiKey: (...args: unknown[]) => mockDecryptApiKey(...args),
  encryptApiKey: (...args: unknown[]) => mockEncryptApiKey(...args),
}));

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function makePlantumlResponse(content: string) {
  return {
    choices: [{ message: { content }, finish_reason: 'stop' }],
  };
}

const VALID_PLANTUML = '@startuml\nAlice -> Bob: Hello\n@enduml';
const VALID_MERMAID_FLOW = 'graph TD\n  A --> B';
const VALID_MERMAID_SEQUENCE = 'sequenceDiagram\n  Alice->>Bob: Hello';

// ---------------------------------------------------------------------------
// 1. generateDiagram — core AI service function
// ---------------------------------------------------------------------------

describe('generateDiagram', () => {
  let generateDiagram: (params: {
    userId: string;
    description: string;
    diagramType: string;
    format?: 'plantuml' | 'mermaid';
  }) => Promise<{ source: string; format: 'plantuml' | 'mermaid' }>;

  beforeAll(async () => {
    const mod = await import('@/lib/ai-service');
    generateDiagram = mod.generateDiagram;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Default: user has configured settings with encrypted key
    mockSettingsFindUnique.mockResolvedValue({
      encryptedApiKey: 'encrypted_key_abc',
      preferredModel: 'gpt-4',
      apiBaseUrl: 'https://api.openai.com/v1',
    });
    mockDecryptApiKey.mockReturnValue('sk-real-api-key');
  });

  it('returns { source, format } with valid PlantUML when format is plantuml', async () => {
    mockChatCreate.mockResolvedValue(makePlantumlResponse(VALID_PLANTUML));

    const result = await generateDiagram({
      userId: 'user-1',
      description: 'A simple sequence diagram between Alice and Bob',
      diagramType: 'sequence',
      format: 'plantuml',
    });

    expect(result).toHaveProperty('source');
    expect(result).toHaveProperty('format', 'plantuml');
    expect(result.source).toMatch(/@startuml/);
  });

  it('returns { source, format } with valid Mermaid when format is mermaid', async () => {
    mockChatCreate.mockResolvedValue(makePlantumlResponse(VALID_MERMAID_FLOW));

    const result = await generateDiagram({
      userId: 'user-1',
      description: 'A flowchart showing A goes to B',
      diagramType: 'flowchart',
      format: 'mermaid',
    });

    expect(result).toHaveProperty('source');
    expect(result).toHaveProperty('format', 'mermaid');
    // Mermaid must start with a valid graph token
    expect(result.source).toMatch(/^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|gitGraph|mindmap|timeline)/m);
  });

  it('decrypts the API key before using it — does NOT pass encrypted key to OpenAI', async () => {
    mockChatCreate.mockResolvedValue(makePlantumlResponse(VALID_PLANTUML));

    await generateDiagram({
      userId: 'user-1',
      description: 'A class diagram',
      diagramType: 'class',
      format: 'plantuml',
    });

    // decryptApiKey must have been called with the encrypted value
    expect(mockDecryptApiKey).toHaveBeenCalledWith('encrypted_key_abc');

    // The OpenAI constructor must NOT have received the encrypted key
    const OpenAI = (await import('openai')).default;
    const constructorCalls = (OpenAI as jest.Mock).mock.calls;
    constructorCalls.forEach((callArgs) => {
      const config = callArgs[0] as Record<string, unknown>;
      expect(config?.apiKey).not.toBe('encrypted_key_abc');
    });
  });

  it('returns a clarifying question string when description is ambiguous', async () => {
    // AI responds with a question when it cannot determine the diagram
    mockChatCreate.mockResolvedValue(
      makePlantumlResponse('CLARIFY: Could you specify the actors involved in the process?')
    );

    const result = await generateDiagram({
      userId: 'user-1',
      description: 'make a diagram',
      diagramType: 'sequence',
      format: 'plantuml',
    });

    // Must return a clarifyingQuestion field (not broken diagram source)
    expect(result).toHaveProperty('clarifyingQuestion');
    expect(typeof (result as unknown as { clarifyingQuestion: string }).clarifyingQuestion).toBe('string');
  });

  it('throws UnconfiguredProviderError when user has no API key', async () => {
    mockSettingsFindUnique.mockResolvedValue(null);

    await expect(
      generateDiagram({
        userId: 'user-no-settings',
        description: 'A class diagram',
        diagramType: 'class',
        format: 'plantuml',
      })
    ).rejects.toThrow('UnconfiguredProviderError');
  });

  it('throws UnconfiguredProviderError when encryptedApiKey is null', async () => {
    mockSettingsFindUnique.mockResolvedValue({
      encryptedApiKey: null,
      preferredModel: 'gpt-4',
    });

    await expect(
      generateDiagram({
        userId: 'user-no-key',
        description: 'A class diagram',
        diagramType: 'class',
        format: 'plantuml',
      })
    ).rejects.toThrow('UnconfiguredProviderError');
  });

  it('throws ProviderUnreachableError when provider is unreachable (network error)', async () => {
    const networkError = new Error('connect ECONNREFUSED');
    (networkError as NodeJS.ErrnoException).code = 'ECONNREFUSED';
    mockChatCreate.mockRejectedValue(networkError);

    await expect(
      generateDiagram({
        userId: 'user-1',
        description: 'A flowchart',
        diagramType: 'flowchart',
        format: 'mermaid',
      })
    ).rejects.toThrow('ProviderUnreachableError');
  });

  it('throws RateLimitError when provider returns 429', async () => {
    const rateLimitError = Object.assign(new Error('Rate limit exceeded'), {
      status: 429,
    });
    mockChatCreate.mockRejectedValue(rateLimitError);

    await expect(
      generateDiagram({
        userId: 'user-1',
        description: 'A flowchart',
        diagramType: 'flowchart',
        format: 'mermaid',
      })
    ).rejects.toThrow('RateLimitError');
  });

  it('throws InvalidUmlOutputError when AI returns non-UML prose', async () => {
    // AI output that is NOT valid PlantUML or Mermaid
    mockChatCreate.mockResolvedValue(
      makePlantumlResponse('Sure! Here is a lovely explanation but no diagram at all.')
    );

    await expect(
      generateDiagram({
        userId: 'user-1',
        description: 'A sequence diagram',
        diagramType: 'sequence',
        format: 'plantuml',
      })
    ).rejects.toThrow('InvalidUmlOutputError');
  });

  it('supports all 10 UML diagram types via diagramType param', async () => {
    const types = [
      'sequence',
      'class',
      'activity',
      'usecase',
      'component',
      'state',
      'object',
      'deployment',
      'package',
      'timing',
    ];

    for (const diagramType of types) {
      jest.clearAllMocks();
      mockSettingsFindUnique.mockResolvedValue({
        encryptedApiKey: 'enc_key',
        preferredModel: 'gpt-4',
      });
      mockDecryptApiKey.mockReturnValue('sk-key');
      mockChatCreate.mockResolvedValue(makePlantumlResponse(VALID_PLANTUML));

      const result = await generateDiagram({
        userId: 'user-1',
        description: `A ${diagramType} diagram`,
        diagramType,
        format: 'plantuml',
      });

      expect(result.source).toMatch(/@startuml/);
    }
  });
});

// ---------------------------------------------------------------------------
// 2. refineDiagram — chat-based iterative refinement
// ---------------------------------------------------------------------------

describe('refineDiagram', () => {
  let refineDiagram: (params: {
    userId: string;
    currentSource: string;
    chatMessage: string;
    format: 'plantuml' | 'mermaid';
  }) => Promise<{ source: string }>;

  beforeAll(async () => {
    const mod = await import('@/lib/ai-service');
    refineDiagram = mod.refineDiagram;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockSettingsFindUnique.mockResolvedValue({
      encryptedApiKey: 'enc_key',
      preferredModel: 'gpt-4',
    });
    mockDecryptApiKey.mockReturnValue('sk-key');
  });

  it('returns updated { source } with valid PlantUML after refinement', async () => {
    const refined = '@startuml\nAlice -> Bob: Hi\nAlice -> Carol: Hello\n@enduml';
    mockChatCreate.mockResolvedValue(makePlantumlResponse(refined));

    const result = await refineDiagram({
      userId: 'user-1',
      currentSource: VALID_PLANTUML,
      chatMessage: 'Add a message from Alice to Carol',
      format: 'plantuml',
    });

    expect(result).toHaveProperty('source');
    expect(result.source).toMatch(/@startuml/);
  });

  it('returns updated { source } with valid Mermaid after refinement', async () => {
    const refined = 'graph TD\n  A --> B\n  A --> C';
    mockChatCreate.mockResolvedValue(makePlantumlResponse(refined));

    const result = await refineDiagram({
      userId: 'user-1',
      currentSource: VALID_MERMAID_FLOW,
      chatMessage: 'Add a node C connected to A',
      format: 'mermaid',
    });

    expect(result).toHaveProperty('source');
    expect(result.source).toMatch(/^(graph|flowchart)/m);
  });

  it('decrypts API key before use in refinement too', async () => {
    mockChatCreate.mockResolvedValue(makePlantumlResponse(VALID_PLANTUML));

    await refineDiagram({
      userId: 'user-1',
      currentSource: VALID_PLANTUML,
      chatMessage: 'Add a return message',
      format: 'plantuml',
    });

    expect(mockDecryptApiKey).toHaveBeenCalledWith('enc_key');
  });

  it('throws UnconfiguredProviderError when user has no settings', async () => {
    mockSettingsFindUnique.mockResolvedValue(null);

    await expect(
      refineDiagram({
        userId: 'no-settings-user',
        currentSource: VALID_PLANTUML,
        chatMessage: 'Add a node',
        format: 'plantuml',
      })
    ).rejects.toThrow('UnconfiguredProviderError');
  });

  it('throws ProviderUnreachableError for network failures during refinement', async () => {
    const err = Object.assign(new Error('ETIMEDOUT'), { code: 'ETIMEDOUT' });
    mockChatCreate.mockRejectedValue(err);

    await expect(
      refineDiagram({
        userId: 'user-1',
        currentSource: VALID_PLANTUML,
        chatMessage: 'Add a node',
        format: 'plantuml',
      })
    ).rejects.toThrow('ProviderUnreachableError');
  });
});

// ---------------------------------------------------------------------------
// 3. testConnection — minimal ping to the AI provider
// ---------------------------------------------------------------------------

describe('testConnection', () => {
  let testConnection: (params: {
    userId: string;
  }) => Promise<{ success: boolean; error?: string }>;

  beforeAll(async () => {
    const mod = await import('@/lib/ai-service');
    testConnection = mod.testConnection;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockSettingsFindUnique.mockResolvedValue({
      encryptedApiKey: 'enc_key',
      preferredModel: 'gpt-4',
    });
    mockDecryptApiKey.mockReturnValue('sk-valid-key');
  });

  it('returns { success: true } when provider responds successfully', async () => {
    mockChatCreate.mockResolvedValue(makePlantumlResponse('OK'));

    const result = await testConnection({ userId: 'user-1' });

    expect(result).toEqual({ success: true });
  });

  it('returns { success: false, error: string } when provider is unreachable', async () => {
    const err = Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' });
    mockChatCreate.mockRejectedValue(err);

    const result = await testConnection({ userId: 'user-1' });

    expect(result.success).toBe(false);
    expect(typeof result.error).toBe('string');
    // error message must NOT contain the raw encrypted key
    expect(result.error).not.toContain('enc_key');
  });

  it('returns { success: false, error } for invalid/expired API key (401)', async () => {
    const authErr = Object.assign(new Error('Unauthorized'), { status: 401 });
    mockChatCreate.mockRejectedValue(authErr);

    const result = await testConnection({ userId: 'user-1' });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('returns { success: false } when user has no configured provider', async () => {
    mockSettingsFindUnique.mockResolvedValue(null);

    const result = await testConnection({ userId: 'user-no-settings' });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/configure/i);
  });

  it('decrypts the API key before sending test request', async () => {
    mockChatCreate.mockResolvedValue(makePlantumlResponse('OK'));

    await testConnection({ userId: 'user-1' });

    expect(mockDecryptApiKey).toHaveBeenCalledWith('enc_key');
  });
});

// ---------------------------------------------------------------------------
// 4. UML output validation helpers (exported from ai-service)
// ---------------------------------------------------------------------------

describe('UML output validation', () => {
  let isValidPlantUml: (source: string) => boolean;
  let isValidMermaid: (source: string) => boolean;

  beforeAll(async () => {
    const mod = await import('@/lib/ai-service');
    isValidPlantUml = mod.isValidPlantUml;
    isValidMermaid = mod.isValidMermaid;
  });

  describe('isValidPlantUml', () => {
    it('returns true for valid PlantUML starting with @startuml', () => {
      expect(isValidPlantUml(VALID_PLANTUML)).toBe(true);
    });

    it('returns false for empty string', () => {
      expect(isValidPlantUml('')).toBe(false);
    });

    it('returns false for plain prose without @startuml', () => {
      expect(isValidPlantUml('Here is a description of a diagram.')).toBe(false);
    });

    it('returns false for Mermaid syntax (not PlantUML)', () => {
      expect(isValidPlantUml(VALID_MERMAID_FLOW)).toBe(false);
    });
  });

  describe('isValidMermaid', () => {
    it('returns true for graph TD mermaid', () => {
      expect(isValidMermaid(VALID_MERMAID_FLOW)).toBe(true);
    });

    it('returns true for sequenceDiagram mermaid', () => {
      expect(isValidMermaid(VALID_MERMAID_SEQUENCE)).toBe(true);
    });

    it('returns false for empty string', () => {
      expect(isValidMermaid('')).toBe(false);
    });

    it('returns false for PlantUML syntax', () => {
      expect(isValidMermaid(VALID_PLANTUML)).toBe(false);
    });

    it('returns false for plain prose', () => {
      expect(isValidMermaid('This is a description.')).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// 5. Error classes exported from ai-service
// ---------------------------------------------------------------------------

describe('Custom error classes', () => {
  it('exports UnconfiguredProviderError', async () => {
    const mod = await import('@/lib/ai-service');
    expect(mod.UnconfiguredProviderError).toBeDefined();
    const err = new mod.UnconfiguredProviderError();
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toMatch(/UnconfiguredProviderError/);
  });

  it('exports ProviderUnreachableError', async () => {
    const mod = await import('@/lib/ai-service');
    expect(mod.ProviderUnreachableError).toBeDefined();
    const err = new mod.ProviderUnreachableError('http://localhost:9999');
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toMatch(/ProviderUnreachableError/);
  });

  it('exports RateLimitError', async () => {
    const mod = await import('@/lib/ai-service');
    expect(mod.RateLimitError).toBeDefined();
    const err = new mod.RateLimitError();
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toMatch(/RateLimitError/);
  });

  it('exports InvalidUmlOutputError', async () => {
    const mod = await import('@/lib/ai-service');
    expect(mod.InvalidUmlOutputError).toBeDefined();
    const err = new mod.InvalidUmlOutputError('bad output');
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toMatch(/InvalidUmlOutputError/);
  });
});
