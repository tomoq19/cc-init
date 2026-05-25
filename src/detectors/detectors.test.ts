import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { detectStack } from './index.js';

const TEST_DIR = join(tmpdir(), 'cc-init-test-' + Date.now());

async function createFixture(files: Record<string, string>): Promise<string> {
  const dir = join(TEST_DIR, Math.random().toString(36).slice(2));
  await mkdir(dir, { recursive: true });
  for (const [path, content] of Object.entries(files)) {
    const fullPath = join(dir, path);
    await mkdir(join(fullPath, '..'), { recursive: true });
    await writeFile(fullPath, content);
  }
  return dir;
}

afterEach(async () => {
  try { await rm(TEST_DIR, { recursive: true }); } catch { /* may not exist */ }
});

describe('detectStack', () => {
  it('detects Next.js TypeScript project with pnpm', async () => {
    const dir = await createFixture({
      'package.json': JSON.stringify({
        dependencies: { next: '^14.0.0', react: '^18.0.0' },
        devDependencies: { typescript: '^5.0.0', prettier: '^3.0.0', eslint: '^8.0.0', vitest: '^1.0.0' },
      }),
      'tsconfig.json': '{}',
      'pnpm-lock.yaml': '',
    });

    const profile = await detectStack(dir);

    expect(profile.language).toBe('typescript');
    expect(profile.framework).toBe('nextjs');
    expect(profile.packageManager).toBe('pnpm');
    expect(profile.testFramework).toBe('vitest');
    expect(profile.detectedTools.formatter).toBe('prettier');
    expect(profile.detectedTools.linter).toBe('eslint');
    expect(profile.detectedTools.typeChecker).toBe('tsc');
  });

  it('detects Python FastAPI project with poetry', async () => {
    const dir = await createFixture({
      'pyproject.toml': `
[tool.poetry]
name = "myapp"

[tool.poetry.dependencies]
python = "^3.11"
fastapi = "^0.100.0"
ruff = "^0.1.0"
`,
    });

    const profile = await detectStack(dir);

    expect(profile.language).toBe('python');
    expect(profile.framework).toBe('fastapi');
    expect(profile.packageManager).toBe('poetry');
    expect(profile.detectedTools.formatter).toBe('ruff');
    expect(profile.detectedTools.linter).toBe('ruff');
  });

  it('detects Go project', async () => {
    const dir = await createFixture({
      'go.mod': 'module example.com/myapp\n\ngo 1.21',
    });

    const profile = await detectStack(dir);

    expect(profile.language).toBe('go');
    expect(profile.packageManager).toBe('go');
    expect(profile.testFramework).toBe('go-test');
    expect(profile.detectedTools.formatter).toBe('gofmt');
    expect(profile.detectedTools.linter).toBe('golangci-lint');
  });

  it('detects Rust project', async () => {
    const dir = await createFixture({
      'Cargo.toml': '[package]\nname = "myapp"\nversion = "0.1.0"',
    });

    const profile = await detectStack(dir);

    expect(profile.language).toBe('rust');
    expect(profile.packageManager).toBe('cargo');
    expect(profile.testFramework).toBe('cargo-test');
    expect(profile.detectedTools.formatter).toBe('rustfmt');
    expect(profile.detectedTools.linter).toBe('clippy');
  });

  it('detects empty project', async () => {
    const dir = await createFixture({});

    const profile = await detectStack(dir);

    expect(profile.language).toBe('none');
    expect(profile.framework).toBe('none');
    expect(profile.packageManager).toBe('none');
  });

  it('detects npm when no lockfile but package.json exists', async () => {
    const dir = await createFixture({
      'package.json': JSON.stringify({ dependencies: { express: '^4.0.0' } }),
    });

    const profile = await detectStack(dir);

    expect(profile.language).toBe('javascript');
    expect(profile.framework).toBe('express');
    expect(profile.packageManager).toBe('npm');
  });

  it('detects yarn from lockfile', async () => {
    const dir = await createFixture({
      'package.json': JSON.stringify({ dependencies: { react: '^18.0.0' } }),
      'yarn.lock': '',
    });

    const profile = await detectStack(dir);

    expect(profile.packageManager).toBe('yarn');
  });

  it('detects ORM and CSS tooling', async () => {
    const dir = await createFixture({
      'package.json': JSON.stringify({
        dependencies: { next: '^14.0.0' },
        devDependencies: { prisma: '^5.0.0', tailwindcss: '^3.0.0', typescript: '^5.0.0' },
      }),
      'tsconfig.json': '{}',
      'prisma/schema.prisma': '',
    });

    const profile = await detectStack(dir);

    expect(profile.orm).toBe('prisma');
    expect(profile.cssTooling).toContain('tailwind');
  });

  it('detects GitHub Actions CI', async () => {
    const dir = await createFixture({
      'package.json': JSON.stringify({ dependencies: { express: '^4.0.0' } }),
      '.github/workflows/ci.yml': 'name: CI',
    });

    const profile = await detectStack(dir);

    expect(profile.ci).toBe('github-actions');
  });

  it('detects Playwright e2e framework', async () => {
    const dir = await createFixture({
      'package.json': JSON.stringify({
        devDependencies: { '@playwright/test': '^1.40.0' },
      }),
    });

    const profile = await detectStack(dir);

    expect(profile.e2eFramework).toBe('playwright');
  });

  it('detects monorepo with turborepo', async () => {
    const dir = await createFixture({
      'package.json': JSON.stringify({ name: 'monorepo' }),
      'turbo.json': '{}',
      'pnpm-workspace.yaml': '',
    });

    const profile = await detectStack(dir);

    expect(profile.monorepo).toBe('turborepo');
  });
});
