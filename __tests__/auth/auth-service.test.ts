/**
 * Auth Service Tests — Phase 1 (RED)
 *
 * Tests for:
 * - POST /api/auth/register (register route handler logic)
 * - lib/auth.ts (NextAuth credentials provider config)
 * - middleware.ts (route protection)
 *
 * These tests validate the behaviour described in the acceptance criteria:
 * - Register creates user, rejects duplicate email with 409
 * - Login with correct credentials returns session
 * - Login with wrong password returns 'Invalid email or password'
 * - Unauthenticated users are redirected to /login by middleware
 * - Passwords hashed with bcrypt (12 rounds)
 * - Registration requires min 8 char password
 */

import * as bcrypt from 'bcryptjs';

// ---------------------------------------------------------------------------
// Helpers — mock the prisma client so tests never hit a real database
// ---------------------------------------------------------------------------

const mockFindUnique = jest.fn();
const mockCreate = jest.fn();

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}));

// Mock @prisma/client to provide Prisma namespace (Prisma client not generated in test env)
jest.mock('@prisma/client', () => {
  class PrismaClientKnownRequestError extends Error {
    code: string;
    constructor(message: string, { code }: { code: string }) {
      super(message);
      this.name = 'PrismaClientKnownRequestError';
      this.code = code;
    }
  }
  return {
    Prisma: {
      PrismaClientKnownRequestError,
    },
  };
});

// ---------------------------------------------------------------------------
// 1. Registration route — validate & hash helpers extracted from route handler
// ---------------------------------------------------------------------------

describe('Registration validation schema', () => {
  let validateRegisterInput: (data: unknown) => { success: boolean; error?: unknown; data?: { email: string; password: string; name?: string } };

  beforeAll(async () => {
    // Import the validation schema exported from the register route or a shared lib
    const mod = await import('@/lib/auth-validation');
    validateRegisterInput = mod.validateRegisterInput;
  });

  it('rejects a password shorter than 8 characters', () => {
    const result = validateRegisterInput({ email: 'user@example.com', password: 'short' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid email', () => {
    const result = validateRegisterInput({ email: 'not-an-email', password: 'password123' });
    expect(result.success).toBe(false);
  });

  it('accepts valid email and password >= 8 chars', () => {
    const result = validateRegisterInput({ email: 'user@example.com', password: 'password123' });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 2. Password hashing — must use bcrypt with 12 rounds
// ---------------------------------------------------------------------------

describe('Password hashing', () => {
  let hashPassword: (password: string) => Promise<string>;
  let verifyPassword: (password: string, hash: string) => Promise<boolean>;

  beforeAll(async () => {
    const mod = await import('@/lib/auth-utils');
    hashPassword = mod.hashPassword;
    verifyPassword = mod.verifyPassword;
  });

  it('hashes a password with bcrypt cost factor 12', async () => {
    const hash = await hashPassword('securepassword');
    // bcrypt hashes start with $2b$12$ (or $2a$12$) when rounds = 12
    expect(hash).toMatch(/^\$2[ab]\$12\$/);
  });

  it('verifyPassword returns true for correct password', async () => {
    const hash = await hashPassword('securepassword');
    const result = await verifyPassword('securepassword', hash);
    expect(result).toBe(true);
  });

  it('verifyPassword returns false for wrong password', async () => {
    const hash = await hashPassword('securepassword');
    const result = await verifyPassword('wrongpassword', hash);
    expect(result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 3. Register handler — createUser service function
// ---------------------------------------------------------------------------

describe('createUser service', () => {
  let createUser: (email: string, password: string, name?: string) => Promise<{ id: string; email: string }>;

  beforeAll(async () => {
    const mod = await import('@/lib/auth-service');
    createUser = mod.createUser;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a user and returns id and email', async () => {
    mockFindUnique.mockResolvedValue(null); // no existing user
    mockCreate.mockResolvedValue({ id: 'cuid_1', email: 'user@example.com', name: null, password: 'hashed', createdAt: new Date(), updatedAt: new Date() });

    const user = await createUser('user@example.com', 'password123');
    expect(user).toMatchObject({ id: 'cuid_1', email: 'user@example.com' });
  });

  it('stores a bcrypt hash — not the plain-text password', async () => {
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockImplementation(async ({ data }: { data: { password: string } }) => ({
      id: 'cuid_2',
      email: 'other@example.com',
      password: data.password,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await createUser('other@example.com', 'plainpassword');
    const storedPassword: string = mockCreate.mock.calls[0][0].data.password;
    expect(storedPassword).not.toBe('plainpassword');
    expect(storedPassword).toMatch(/^\$2[ab]\$/);
  });

  it('throws a DuplicateEmailError when email already exists', async () => {
    mockFindUnique.mockResolvedValue({ id: 'existing', email: 'dup@example.com' });

    await expect(createUser('dup@example.com', 'password123')).rejects.toThrow('DuplicateEmailError');
  });
});

// ---------------------------------------------------------------------------
// 4. Auth config — credentials provider
// ---------------------------------------------------------------------------

describe('Auth config credentials provider', () => {
  let getAuthConfig: () => { providers: Array<{ id: string }> };

  beforeAll(async () => {
    const mod = await import('@/lib/auth');
    // next-auth v4 exports default config object; v5 exports { handlers, auth, signIn, signOut }
    // We just need to confirm a credentials provider is configured.
    getAuthConfig = mod.getAuthConfig ?? (() => (mod as unknown as { authOptions: { providers: Array<{ id: string }> } }).authOptions ?? mod.default);
  });

  it('exports an auth config with a credentials provider', async () => {
    const mod = await import('@/lib/auth');
    // Accept multiple export shapes (v4 authOptions or v5 config)
    const config = (mod as unknown as { authOptions?: { providers: Array<{ id: string }> } }).authOptions ?? mod.default;
    expect(config).toBeDefined();
    expect(config.providers).toBeDefined();
    const hasCredentials = config.providers.some(
      (p: { id: string }) => p.id === 'credentials'
    );
    expect(hasCredentials).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 5. Credentials provider authorize — wrong password returns null
// ---------------------------------------------------------------------------

describe('Credentials provider authorize', () => {
  let authorize: (credentials: { email: string; password: string }) => Promise<{ id: string; email: string } | null>;

  beforeAll(async () => {
    const mod = await import('@/lib/auth-service');
    authorize = mod.authorizeCredentials;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when user does not exist', async () => {
    mockFindUnique.mockResolvedValue(null);
    const result = await authorize({ email: 'ghost@example.com', password: 'password123' });
    expect(result).toBeNull();
  });

  it('returns null with wrong password', async () => {
    const realHash = await bcrypt.hash('correctpassword', 12);
    mockFindUnique.mockResolvedValue({ id: 'u1', email: 'user@example.com', password: realHash });

    const result = await authorize({ email: 'user@example.com', password: 'wrongpassword' });
    expect(result).toBeNull();
  });

  it('returns user object with correct password', async () => {
    const realHash = await bcrypt.hash('correctpassword', 12);
    mockFindUnique.mockResolvedValue({ id: 'u1', email: 'user@example.com', password: realHash, name: 'Test' });

    const result = await authorize({ email: 'user@example.com', password: 'correctpassword' });
    expect(result).toMatchObject({ id: 'u1', email: 'user@example.com' });
  });
});

// ---------------------------------------------------------------------------
// 6. Middleware — protected route matching
// ---------------------------------------------------------------------------

describe('Middleware route configuration', () => {
  it('exports a matcher that includes /dashboard routes', async () => {
    // We import the config export from middleware.ts to inspect the matcher
    const mod = await import('@/middleware');
    const { config } = mod;
    expect(config).toBeDefined();
    expect(config.matcher).toBeDefined();

    const matcherStr = JSON.stringify(config.matcher);
    // Matcher must cover /dashboard paths (may be under (dashboard) group)
    expect(matcherStr).toMatch(/dashboard/);
  });
});
