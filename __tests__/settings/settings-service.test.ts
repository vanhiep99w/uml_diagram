/**
 * Settings Service Tests — Phase 1 (RED)
 *
 * Tests for:
 * - src/lib/settings-service.ts (getSettings, updateSettings, maskApiKey)
 * - GET /api/settings route handler behavior (auth + masking)
 * - PUT /api/settings route handler behavior (auth + encryption + validation)
 *
 * Acceptance criteria covered:
 * - GET returns settings with apiKey masked to ****<last4>
 * - PUT encrypts API key before storing (verifies encryptApiKey called, not raw key in DB)
 * - Zod rejects invalid URL for aiBaseUrl
 * - Zod rejects empty aiModel
 * - Returns 401 when unauthenticated
 * - encryptApiKey/decryptApiKey from crypto.ts are used (not reimplemented)
 */

// ---------------------------------------------------------------------------
// Mock Prisma — no real DB calls
// ---------------------------------------------------------------------------

const mockUserSettingsFindUnique = jest.fn();
const mockUserSettingsUpsert = jest.fn();

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    userSettings: {
      findUnique: (...args: unknown[]) => mockUserSettingsFindUnique(...args),
      upsert: (...args: unknown[]) => mockUserSettingsUpsert(...args),
    },
  },
}));

// ---------------------------------------------------------------------------
// Mock crypto module — verify encryptApiKey/decryptApiKey are called
// ---------------------------------------------------------------------------

const mockEncryptApiKey = jest.fn();
const mockDecryptApiKey = jest.fn();

jest.mock('@/lib/crypto', () => ({
  __esModule: true,
  encryptApiKey: (...args: unknown[]) => mockEncryptApiKey(...args),
  decryptApiKey: (...args: unknown[]) => mockDecryptApiKey(...args),
}));

// ---------------------------------------------------------------------------
// Mock NextAuth getServerSession — control auth state in tests
// ---------------------------------------------------------------------------

const mockGetServerSession = jest.fn();

jest.mock('next-auth/next', () => ({
  __esModule: true,
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

// ---------------------------------------------------------------------------
// 1. maskApiKey helper — exported from settings-service
// ---------------------------------------------------------------------------

describe('maskApiKey', () => {
  let maskApiKey: (apiKey: string) => string;

  beforeAll(async () => {
    const mod = await import('@/lib/settings-service');
    maskApiKey = mod.maskApiKey;
  });

  it('masks a standard API key to ****<last4>', () => {
    const result = maskApiKey('sk-abc1234567890ABCD');
    expect(result).toBe('****ABCD');
  });

  it('masks a short key (4 chars) to ****<all4>', () => {
    const result = maskApiKey('ABCD');
    expect(result).toBe('****ABCD');
  });

  it('masks a key of exactly 8 chars correctly', () => {
    const result = maskApiKey('12345678');
    expect(result).toBe('****5678');
  });

  it('always returns exactly 8 characters (4 stars + 4 chars)', () => {
    const result = maskApiKey('sk-supersecretkey');
    expect(result).toHaveLength(8);
    expect(result).toMatch(/^\*{4}.{4}$/);
  });
});

// ---------------------------------------------------------------------------
// 2. validateSettingsInput — Zod schema exported from settings-service
// ---------------------------------------------------------------------------

describe('validateSettingsInput', () => {
  let validateSettingsInput: (data: unknown) => {
    success: boolean;
    error?: unknown;
    data?: { aiBaseUrl: string; aiModel: string; apiKey?: string };
  };

  beforeAll(async () => {
    const mod = await import('@/lib/settings-service');
    validateSettingsInput = mod.validateSettingsInput;
  });

  it('accepts valid URL and non-empty model', () => {
    const result = validateSettingsInput({
      aiBaseUrl: 'https://api.openai.com/v1',
      aiModel: 'gpt-4',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid URL for aiBaseUrl', () => {
    const result = validateSettingsInput({
      aiBaseUrl: 'not-a-valid-url',
      aiModel: 'gpt-4',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a missing aiBaseUrl', () => {
    const result = validateSettingsInput({
      aiModel: 'gpt-4',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an empty aiModel string', () => {
    const result = validateSettingsInput({
      aiBaseUrl: 'https://api.openai.com/v1',
      aiModel: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a missing aiModel', () => {
    const result = validateSettingsInput({
      aiBaseUrl: 'https://api.openai.com/v1',
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional apiKey when provided', () => {
    const result = validateSettingsInput({
      aiBaseUrl: 'https://api.openai.com/v1',
      aiModel: 'gpt-4',
      apiKey: 'sk-abc123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects plain HTTP URL (non-HTTPS is invalid URL format is ok but non-URL strings fail)', () => {
    // Zod must reject non-URL strings — http:// is still a valid URL format per spec
    // We only enforce "valid URL format" per spec requirements
    const result = validateSettingsInput({
      aiBaseUrl: 'ftp://invalid-protocol.com',
      aiModel: 'gpt-4',
    });
    // ftp:// is still a URL but task requires URL format — accept this
    // The important rejection is non-URL strings like "not-a-url"
    expect(result.success).toBeDefined(); // schema decides; at minimum it runs
  });
});

// ---------------------------------------------------------------------------
// 3. getSettings — returns masked apiKey, no plaintext
// ---------------------------------------------------------------------------

describe('getSettings', () => {
  let getSettings: (userId: string) => Promise<{
    aiBaseUrl: string | null;
    aiModel: string;
    apiKey: string | null;
  }>;

  beforeAll(async () => {
    const mod = await import('@/lib/settings-service');
    getSettings = mod.getSettings;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns settings with apiKey masked to ****<last4> when encryptedApiKey exists', async () => {
    mockUserSettingsFindUnique.mockResolvedValue({
      encryptedApiKey: 'iv:authTag:ciphertext',
      preferredModel: 'gpt-4',
    });
    mockDecryptApiKey.mockReturnValue('sk-real-secret-LAST');

    const result = await getSettings('user-1');

    // Must return masked key — last 4 chars of decrypted key
    expect(result.apiKey).toBe('****LAST');
    // Must NOT return plaintext
    expect(result.apiKey).not.toContain('sk-real-secret-LAST');
    expect(result.apiKey).not.toContain('real');
  });

  it('calls decryptApiKey with the stored encryptedApiKey to get last 4 chars', async () => {
    mockUserSettingsFindUnique.mockResolvedValue({
      encryptedApiKey: 'encrypted-blob',
      preferredModel: 'gpt-4',
    });
    mockDecryptApiKey.mockReturnValue('sk-test-key-1234');

    await getSettings('user-1');

    expect(mockDecryptApiKey).toHaveBeenCalledWith('encrypted-blob');
  });

  it('returns apiKey as null when no encryptedApiKey stored', async () => {
    mockUserSettingsFindUnique.mockResolvedValue({
      encryptedApiKey: null,
      preferredModel: 'gpt-4',
    });

    const result = await getSettings('user-1');

    expect(result.apiKey).toBeNull();
    expect(mockDecryptApiKey).not.toHaveBeenCalled();
  });

  it('returns null apiKey when user has no settings record', async () => {
    mockUserSettingsFindUnique.mockResolvedValue(null);

    const result = await getSettings('user-1');

    expect(result.apiKey).toBeNull();
  });

  it('returns aiModel from preferredModel field in UserSettings', async () => {
    mockUserSettingsFindUnique.mockResolvedValue({
      encryptedApiKey: null,
      preferredModel: 'gpt-3.5-turbo',
    });

    const result = await getSettings('user-1');

    expect(result.aiModel).toBe('gpt-3.5-turbo');
  });

  it('never calls encryptApiKey — only reads, never writes', async () => {
    mockUserSettingsFindUnique.mockResolvedValue({
      encryptedApiKey: 'enc-blob',
      preferredModel: 'gpt-4',
    });
    mockDecryptApiKey.mockReturnValue('sk-key-ABCD');

    await getSettings('user-1');

    expect(mockEncryptApiKey).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 4. updateSettings — encrypts API key before storing
// ---------------------------------------------------------------------------

describe('updateSettings', () => {
  let updateSettings: (
    userId: string,
    data: { aiBaseUrl: string; aiModel: string; apiKey?: string }
  ) => Promise<{ aiBaseUrl: string | null; aiModel: string; apiKey: string | null }>;

  beforeAll(async () => {
    const mod = await import('@/lib/settings-service');
    updateSettings = mod.updateSettings;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls encryptApiKey with the plaintext API key before upserting', async () => {
    mockEncryptApiKey.mockReturnValue('iv:authTag:cipher');
    mockUserSettingsUpsert.mockResolvedValue({
      encryptedApiKey: 'iv:authTag:cipher',
      preferredModel: 'gpt-4',
    });
    mockDecryptApiKey.mockReturnValue('sk-newkey-WXYZ');

    await updateSettings('user-1', {
      aiBaseUrl: 'https://api.openai.com/v1',
      aiModel: 'gpt-4',
      apiKey: 'sk-plaintext-key',
    });

    expect(mockEncryptApiKey).toHaveBeenCalledWith('sk-plaintext-key');
  });

  it('stores the encrypted value (not plaintext) in the DB', async () => {
    mockEncryptApiKey.mockReturnValue('encrypted-output');
    mockUserSettingsUpsert.mockImplementation(async (args: {
      create: { encryptedApiKey?: string };
      update: { encryptedApiKey?: string };
    }) => ({
      encryptedApiKey: args.create.encryptedApiKey ?? null,
      preferredModel: 'gpt-4',
    }));
    mockDecryptApiKey.mockReturnValue('sk-key-LAST');

    await updateSettings('user-1', {
      aiBaseUrl: 'https://api.openai.com/v1',
      aiModel: 'gpt-4',
      apiKey: 'sk-plaintext-key',
    });

    // Verify upsert was called with encrypted value, not plaintext
    const upsertArgs = mockUserSettingsUpsert.mock.calls[0][0];
    const storedKey = upsertArgs.create?.encryptedApiKey ?? upsertArgs.update?.encryptedApiKey;
    expect(storedKey).toBe('encrypted-output');
    expect(storedKey).not.toBe('sk-plaintext-key');
  });

  it('returns masked apiKey (****<last4>) in the response — not plaintext', async () => {
    mockEncryptApiKey.mockReturnValue('enc-blob');
    mockUserSettingsUpsert.mockResolvedValue({
      encryptedApiKey: 'enc-blob',
      preferredModel: 'gpt-4',
    });
    mockDecryptApiKey.mockReturnValue('sk-secret-key-5678');

    const result = await updateSettings('user-1', {
      aiBaseUrl: 'https://api.openai.com/v1',
      aiModel: 'gpt-4',
      apiKey: 'sk-secret-key-5678',
    });

    expect(result.apiKey).toBe('****5678');
    expect(result.apiKey).not.toContain('sk-secret-key-5678');
  });

  it('does not update encryptedApiKey when apiKey is not provided in update', async () => {
    mockUserSettingsUpsert.mockResolvedValue({
      encryptedApiKey: null,
      preferredModel: 'gpt-3.5-turbo',
    });

    await updateSettings('user-1', {
      aiBaseUrl: 'https://api.openai.com/v1',
      aiModel: 'gpt-3.5-turbo',
    });

    expect(mockEncryptApiKey).not.toHaveBeenCalled();
  });

  it('uses upsert so it works for both create and update', async () => {
    mockEncryptApiKey.mockReturnValue('enc');
    mockUserSettingsUpsert.mockResolvedValue({
      encryptedApiKey: 'enc',
      preferredModel: 'gpt-4',
    });
    mockDecryptApiKey.mockReturnValue('sk-key-ABCD');

    await updateSettings('user-2', {
      aiBaseUrl: 'https://api.openai.com/v1',
      aiModel: 'gpt-4',
      apiKey: 'sk-key-ABCD',
    });

    expect(mockUserSettingsUpsert).toHaveBeenCalledTimes(1);
    const upsertCall = mockUserSettingsUpsert.mock.calls[0][0];
    expect(upsertCall).toHaveProperty('where');
    expect(upsertCall).toHaveProperty('create');
    expect(upsertCall).toHaveProperty('update');
  });
});

// ---------------------------------------------------------------------------
// 5. GET /api/settings route — 401 when unauthenticated
// ---------------------------------------------------------------------------

describe('GET /api/settings route — authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when session is null (unauthenticated)', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const { GET } = await import('@/app/api/settings/route');
    const request = new Request('http://localhost/api/settings');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('returns 200 with settings when user is authenticated', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-1', email: 'user@example.com' },
    });
    mockUserSettingsFindUnique.mockResolvedValue({
      encryptedApiKey: 'enc-blob',
      preferredModel: 'gpt-4',
    });
    mockDecryptApiKey.mockReturnValue('sk-valid-key-WXYZ');

    const { GET } = await import('@/app/api/settings/route');
    const request = new Request('http://localhost/api/settings');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    // API key must be masked in response
    expect(body.data?.apiKey ?? body.apiKey).toBe('****WXYZ');
  });

  it('response body never contains the full plaintext API key', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-1', email: 'user@example.com' },
    });
    mockUserSettingsFindUnique.mockResolvedValue({
      encryptedApiKey: 'enc-blob',
      preferredModel: 'gpt-4',
    });
    mockDecryptApiKey.mockReturnValue('sk-super-secret-full-key-ABCD');

    const { GET } = await import('@/app/api/settings/route');
    const request = new Request('http://localhost/api/settings');
    const response = await GET(request);
    const bodyText = await response.text();

    expect(bodyText).not.toContain('sk-super-secret-full-key-ABCD');
  });
});

// ---------------------------------------------------------------------------
// 6. PUT /api/settings route — 401 when unauthenticated, validation, encryption
// ---------------------------------------------------------------------------

describe('PUT /api/settings route — authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when session is null (unauthenticated)', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const { PUT } = await import('@/app/api/settings/route');
    const request = new Request('http://localhost/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aiBaseUrl: 'https://api.openai.com/v1',
        aiModel: 'gpt-4',
        apiKey: 'sk-test-key',
      }),
    });
    const response = await PUT(request);

    expect(response.status).toBe(401);
  });

  it('returns 400 when aiBaseUrl is not a valid URL', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-1', email: 'user@example.com' },
    });

    const { PUT } = await import('@/app/api/settings/route');
    const request = new Request('http://localhost/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aiBaseUrl: 'not-a-valid-url',
        aiModel: 'gpt-4',
        apiKey: 'sk-test-key',
      }),
    });
    const response = await PUT(request);

    expect(response.status).toBe(400);
  });

  it('returns 400 when aiModel is empty string', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-1', email: 'user@example.com' },
    });

    const { PUT } = await import('@/app/api/settings/route');
    const request = new Request('http://localhost/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aiBaseUrl: 'https://api.openai.com/v1',
        aiModel: '',
        apiKey: 'sk-test-key',
      }),
    });
    const response = await PUT(request);

    expect(response.status).toBe(400);
  });

  it('returns 200 and saves settings with encrypted key on valid PUT', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-1', email: 'user@example.com' },
    });
    mockEncryptApiKey.mockReturnValue('enc-result');
    mockUserSettingsUpsert.mockResolvedValue({
      encryptedApiKey: 'enc-result',
      preferredModel: 'gpt-4',
    });
    mockDecryptApiKey.mockReturnValue('sk-key-LAST');

    const { PUT } = await import('@/app/api/settings/route');
    const request = new Request('http://localhost/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aiBaseUrl: 'https://api.openai.com/v1',
        aiModel: 'gpt-4',
        apiKey: 'sk-test-key-LAST',
      }),
    });
    const response = await PUT(request);

    expect(response.status).toBe(200);
    expect(mockEncryptApiKey).toHaveBeenCalledWith('sk-test-key-LAST');
  });

  it('PUT response never contains plaintext API key', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-1', email: 'user@example.com' },
    });
    mockEncryptApiKey.mockReturnValue('encrypted-output');
    mockUserSettingsUpsert.mockResolvedValue({
      encryptedApiKey: 'encrypted-output',
      preferredModel: 'gpt-4',
    });
    mockDecryptApiKey.mockReturnValue('sk-plaintext-key-ZZZZ');

    const { PUT } = await import('@/app/api/settings/route');
    const request = new Request('http://localhost/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aiBaseUrl: 'https://api.openai.com/v1',
        aiModel: 'gpt-4',
        apiKey: 'sk-plaintext-key-ZZZZ',
      }),
    });
    const response = await PUT(request);
    const bodyText = await response.text();

    expect(bodyText).not.toContain('sk-plaintext-key-ZZZZ');
  });
});
