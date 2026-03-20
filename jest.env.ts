// Environment variables required for tests (runs before test framework is loaded)
process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET ?? 'test-secret-for-jest';
