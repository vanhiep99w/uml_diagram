import * as fs from 'fs';
import * as path from 'path';

const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');

describe('prisma/schema.prisma', () => {
  let schemaContent: string;

  beforeAll(() => {
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`prisma/schema.prisma does not exist at ${schemaPath}`);
    }
    schemaContent = fs.readFileSync(schemaPath, 'utf-8');
  });

  it('file exists', () => {
    expect(fs.existsSync(schemaPath)).toBe(true);
  });

  it('contains User model', () => {
    expect(schemaContent).toMatch(/model\s+User\s*\{/);
  });

  it('contains UserSettings model', () => {
    expect(schemaContent).toMatch(/model\s+UserSettings\s*\{/);
  });

  it('contains Diagram model', () => {
    expect(schemaContent).toMatch(/model\s+Diagram\s*\{/);
  });

  it('uses mysql provider', () => {
    expect(schemaContent).toMatch(/provider\s*=\s*"mysql"/);
  });
});
