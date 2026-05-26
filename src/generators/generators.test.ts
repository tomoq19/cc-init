import { describe, it, expect } from 'vitest';
import { generateSettings } from './settings.js';
import { generateAgents } from './agents.js';
import { generateSkills } from './skills.js';
import { generateCommands } from './commands.js';
import { generateClaudeMd } from './claude-md.js';
import { emptyStackProfile, type StackProfile } from '../types.js';

function nextProfile(): StackProfile {
  return {
    ...emptyStackProfile(),
    language: 'typescript',
    framework: 'nextjs',
    packageManager: 'pnpm',
    testFramework: 'vitest',
    e2eFramework: 'playwright',
    orm: 'prisma',
    cssTooling: ['tailwind'],
    ci: 'github-actions',
    detectedTools: {
      formatter: 'prettier',
      linter: 'eslint',
      typeChecker: 'tsc',
      bundler: 'vite',
    },
  };
}

describe('generators', () => {
  it('generates parseable settings.json', () => {
    const file = generateSettings(nextProfile());
    const parsed = JSON.parse(file.content);

    expect(file.path).toBe('.claude/settings.json');
    expect(parsed.permissions.allow).toContain('Bash(pnpm test)');
    expect(parsed.hooks.PostToolUse).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ matcher: 'Write|Edit', hooks: [{ type: 'command', command: 'pnpm prettier --write "$FILE_PATH"' }] }),
        expect.objectContaining({ matcher: 'Write|Edit', hooks: [{ type: 'command', command: 'pnpm eslint --fix "$FILE_PATH"' }] }),
      ])
    );
  });

  it('generates CLAUDE.md with detected stack', () => {
    const file = generateClaudeMd(nextProfile());

    expect(file.path).toBe('CLAUDE.md');
    expect(file.content).toContain('nextjs');
    expect(file.content).toContain('typescript');
    expect(file.content).toContain('pnpm test');
    expect(file.content).toContain('vitest');
    expect(file.content).toContain('Behavioral Guidelines');
    expect(file.content).toContain('Think Before Coding');
    expect(file.content).toContain('Simplicity First');
    expect(file.content).toContain('Surgical Changes');
    expect(file.content).toContain('Goal-Driven Execution');
  });

  it('generates universal and conditional agents', () => {
    const files = generateAgents(nextProfile());
    const paths = files.map(f => f.path);

    expect(paths).toContain('.claude/agents/reviewer.md');
    expect(paths).toContain('.claude/agents/security.md');
    expect(paths).toContain('.claude/agents/ts-reviewer.md');
    expect(paths).toContain('.claude/agents/tester.md');
    expect(paths).toContain('.claude/agents/db-reviewer.md');
    expect(paths).toContain('.claude/agents/a11y.md');
  });

  it('generates skills for frontend and ORM stack', () => {
    const files = generateSkills(nextProfile());
    const paths = files.map(f => f.path);

    expect(paths).toContain('.claude/skills/tdd.md');
    expect(paths).toContain('.claude/skills/debug.md');
    expect(paths).toContain('.claude/skills/refactor.md');
    expect(paths).toContain('.claude/skills/code-review.md');
    expect(paths).toContain('.claude/skills/plan.md');
    expect(paths).toContain('.claude/skills/migrate.md');
    expect(paths).toContain('.claude/skills/component.md');
  });

  it('generates API scaffold skill for API framework', () => {
    const profile = {
      ...nextProfile(),
      framework: 'fastapi',
      language: 'python' as const,
    };
    const files = generateSkills(profile);
    const paths = files.map(f => f.path);

    expect(paths).toContain('.claude/skills/api-scaffold.md');
  });

  it('generates slash commands', () => {
    const files = generateCommands(nextProfile());
    const paths = files.map(f => f.path);

    expect(paths).toContain('.claude/commands/dev.md');
    expect(paths).toContain('.claude/commands/test.md');
    expect(paths).toContain('.claude/commands/check.md');
  });

  it('uses npx for npm hooks instead of npm <binary>', () => {
    const npmProfile: StackProfile = {
      ...emptyStackProfile(),
      language: 'typescript',
      packageManager: 'npm',
      detectedTools: { formatter: 'prettier', linter: 'eslint', typeChecker: 'tsc', bundler: null },
    };
    const file = generateSettings(npmProfile);
    const parsed = JSON.parse(file.content);
    const postHookCmds = parsed.hooks.PostToolUse.flatMap((e: { hooks: { command: string }[] }) => e.hooks.map((h: { command: string }) => h.command));
    const stopHookCmds = parsed.hooks.Stop.flatMap((e: { hooks: { command: string }[] }) => e.hooks.map((h: { command: string }) => h.command));

    expect(postHookCmds).toContain('npx prettier --write "$FILE_PATH"');
    expect(postHookCmds).toContain('npx eslint --fix "$FILE_PATH"');
    expect(postHookCmds.find((c: string) => c.includes('tsc'))).toContain('npx tsc');
    expect(stopHookCmds).toContain('npm run build');
    expect(postHookCmds.every((c: string) => !c.startsWith('npm '))).toBe(true);
  });

  it('generates universal skills for any stack', () => {
    const files = generateSkills({ ...emptyStackProfile(), language: 'go', packageManager: 'go' });
    const paths = files.map(f => f.path);

    expect(paths).toContain('.claude/skills/tdd.md');
    expect(paths).toContain('.claude/skills/debug.md');
    expect(paths).toContain('.claude/skills/refactor.md');
    expect(paths).toContain('.claude/skills/code-review.md');
    expect(paths).toContain('.claude/skills/plan.md');
    expect(files.find(f => f.path === '.claude/skills/tdd.md')!.content).toContain('go test ./...');
  });
});
