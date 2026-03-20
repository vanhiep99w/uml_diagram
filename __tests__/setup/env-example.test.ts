import * as fs from 'fs';
import * as path from 'path';

const envExamplePath = path.join(process.cwd(), '.env.example');

describe('.env.example', () => {
  let envContent: string;

  beforeAll(() => {
    if (!fs.existsSync(envExamplePath)) {
      throw new Error(`.env.example does not exist at ${envExamplePath}`);
    }
    envContent = fs.readFileSync(envExamplePath, 'utf-8');
  });

  it('file exists', () => {
    expect(fs.existsSync(envExamplePath)).toBe(true);
  });

  it('contains DATABASE_URL', () => {
    expect(envContent).toContain('DATABASE_URL');
  });

  it('contains NEXTAUTH_SECRET', () => {
    expect(envContent).toContain('NEXTAUTH_SECRET');
  });

  it('contains ENCRYPTION_KEY', () => {
    expect(envContent).toContain('ENCRYPTION_KEY');
  });
});
