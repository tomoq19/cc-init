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
        expect.objectContaining({ command: 'pnpm prettier --write "$FILE_PATH"' }),
        expect.objectContaining({ command: 'pnpm eslint --fix "$FILE_PATH"' }),
      ])
    );
  });

  it('generates CLAUDE.md with detected stack', () => {
    const file = generateClaudeMd(nextProfile());

    expect(file.path).toBe('.claude/CLAUDE.md');
    expect(file.content).toContain('nextjs');
    expect(file.content).toContain('typescript');
    expect(file.content).toContain('pnpm test');
    expect(file.content).toContain('vitest');
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

  it('does not generate skills for unsupported stack', () => {
    const files = generateSkills({ ...emptyStackProfile(), language: 'go', packageManager: 'go' });

    expect(files).toHaveLength(0);
  });
});
