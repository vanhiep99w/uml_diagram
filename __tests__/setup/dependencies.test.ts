import * as fs from 'fs';
import * as path from 'path';

const packageJsonPath = path.join(process.cwd(), 'package.json');

describe('package.json dependencies', () => {
  let packageJson: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
  let allDeps: Record<string, string>;

  beforeAll(() => {
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error(`package.json does not exist at ${packageJsonPath}`);
    }
    const content = fs.readFileSync(packageJsonPath, 'utf-8');
    packageJson = JSON.parse(content);
    allDeps = {
      ...(packageJson.dependencies || {}),
      ...(packageJson.devDependencies || {}),
    };
  });

  it('has next-auth dependency', () => {
    expect(allDeps).toHaveProperty('next-auth');
  });

  it('has @prisma/client dependency', () => {
    expect(allDeps).toHaveProperty('@prisma/client');
  });

  it('has openai dependency', () => {
    expect(allDeps).toHaveProperty('openai');
  });

  it('has mermaid dependency', () => {
    expect(allDeps).toHaveProperty('mermaid');
  });

  it('has @monaco-editor/react dependency', () => {
    expect(allDeps).toHaveProperty('@monaco-editor/react');
  });

  it('has bcryptjs dependency', () => {
    expect(allDeps).toHaveProperty('bcryptjs');
  });

  it('has zod dependency', () => {
    expect(allDeps).toHaveProperty('zod');
  });

  it('has prisma devDependency (CLI)', () => {
    const devDeps = packageJson.devDependencies || {};
    expect(devDeps).toHaveProperty('prisma');
  });
});
