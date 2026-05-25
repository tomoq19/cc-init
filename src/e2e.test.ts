import { describe, it, expect, afterEach } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, readFile, writeFile, rm, access } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const execFileAsync = promisify(execFile);
const TEST_DIR = join(tmpdir(), 'cc-init-e2e-test-' + Date.now());
const BIN = join(process.cwd(), 'bin', 'cc-init.js');

afterEach(async () => {
  try { await rm(TEST_DIR, { recursive: true }); } catch { /* may not exist */ }
});

async function createNextFixture(): Promise<string> {
  const dir = join(TEST_DIR, 'next-app');
  await mkdir(join(dir, 'prisma'), { recursive: true });
  await mkdir(join(dir, '.github', 'workflows'), { recursive: true });
  await writeFile(join(dir, 'package.json'), JSON.stringify({
    name: 'next-app',
    dependencies: { next: '^14.0.0', react: '^18.0.0' },
    devDependencies: {
      typescript: '^5.0.0',
      prettier: '^3.0.0',
      eslint: '^8.0.0',
      vitest: '^1.0.0',
      '@playwright/test': '^1.40.0',
      prisma: '^5.0.0',
      tailwindcss: '^3.0.0',
    },
    scripts: {
      dev: 'next dev',
      build: 'next build',
      test: 'vitest run',
      lint: 'eslint .',
    },
  }));
  await writeFile(join(dir, 'tsconfig.json'), '{}');
  await writeFile(join(dir, 'pnpm-lock.yaml'), '');
  await writeFile(join(dir, '.github', 'workflows', 'ci.yml'), 'name: CI');
  return dir;
}

describe('CLI e2e', () => {
  it('dry-run does not write files', async () => {
    const dir = await createNextFixture();
    const { stdout } = await execFileAsync('node', [BIN, dir, '--dry-run', '--yes']);

    expect(stdout).toContain('DRY RUN');
    expect(stdout).toContain('FILE: .claude/settings.json');
    await expect(access(join(dir, '.claude'))).rejects.toThrow();
  });

  it('generates files for Next.js fixture', async () => {
    const dir = await createNextFixture();
    await execFileAsync('node', [BIN, dir, '--yes', '--force']);

    const settings = JSON.parse(await readFile(join(dir, '.claude', 'settings.json'), 'utf-8'));
    const claude = await readFile(join(dir, '.claude', 'CLAUDE.md'), 'utf-8');
    const reviewer = await readFile(join(dir, '.claude', 'agents', 'reviewer.md'), 'utf-8');

    expect(settings.permissions.allow).toContain('Bash(pnpm test)');
    expect(settings.hooks.PostToolUse).toEqual(expect.any(Array));
    expect(claude).toContain('nextjs');
    expect(reviewer).toContain('senior code reviewer');
  });

  it('fails in --yes mode when stack cannot be detected', async () => {
    const dir = join(TEST_DIR, 'empty');
    await mkdir(dir, { recursive: true });

    await expect(execFileAsync('node', [BIN, dir, '--yes'])).rejects.toMatchObject({ code: 1 });
  });
});
