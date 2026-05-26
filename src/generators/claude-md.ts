import type { StackProfile, GeneratedFile } from '../types.js';

function buildOverview(profile: StackProfile): string {
  const parts: string[] = [];
  if (profile.framework !== 'none') {
    parts.push(`This is a **${profile.framework}** project`);
  } else {
    parts.push(`This is a **${profile.language}** project`);
  }
  if (profile.language !== 'none' && profile.framework !== 'none') {
    parts.push(`written in **${profile.language}**`);
  }
  if (profile.orm !== 'none') parts.push(`using **${profile.orm}**`);
  if (profile.database !== 'none') parts.push(`with a **${profile.database}** database`);
  return parts.join(' ') + '.';
}

function buildKeyCommands(profile: StackProfile): string {
  const pm = profile.packageManager;
  const lines: string[] = ['## Key Commands', ''];

  const commands: Array<[string, string]> = [];

  if (['pnpm', 'npm', 'yarn', 'bun'].includes(pm)) {
    const runScript = (script: string) => pm === 'npm' ? `npm run ${script}` : `${pm} ${script}`;
    commands.push(['Dev server', runScript('dev')]);
    commands.push(['Build', runScript('build')]);
    commands.push(['Test', runScript('test')]);
    commands.push(['Lint', runScript('lint')]);
    if (profile.detectedTools.typeChecker) {
      commands.push(['Type check', `${pm} run typecheck`]);
    }
  } else if (pm === 'poetry') {
    commands.push(['Dev server', `poetry run uvicorn main:app --reload`]);
    commands.push(['Test', `poetry run pytest`]);
    commands.push(['Lint', `poetry run ruff check .`]);
    commands.push(['Format', `poetry run ruff format .`]);
  } else if (pm === 'pip' || pm === 'uv') {
    const run = pm === 'uv' ? 'uv run' : 'python -m';
    commands.push(['Test', `${run} pytest`]);
    if (profile.detectedTools.linter) {
      commands.push(['Lint', `${run} ${profile.detectedTools.linter} check .`]);
    }
  } else if (pm === 'go') {
    commands.push(['Test', `go test ./...`]);
    commands.push(['Build', `go build ./...`]);
    commands.push(['Lint', `golangci-lint run`]);
    commands.push(['Format', `gofmt -w .`]);
  } else if (pm === 'cargo') {
    commands.push(['Build', `cargo build`]);
    commands.push(['Test', `cargo test`]);
    commands.push(['Lint', `cargo clippy`]);
    commands.push(['Format', `cargo fmt`]);
  } else if (pm === 'gradle') {
    commands.push(['Build', `./gradlew build`]);
    commands.push(['Test', `./gradlew test`]);
  } else if (pm === 'maven') {
    commands.push(['Build', `mvn package`]);
    commands.push(['Test', `mvn test`]);
  } else if (pm === 'bundler') {
    commands.push(['Test', `bundle exec rspec`]);
    commands.push(['Lint', `bundle exec rubocop`]);
  } else if (pm === 'pub') {
    commands.push(['Test', `flutter test`]);
    commands.push(['Analyze', `dart analyze`]);
    commands.push(['Format', `dart format .`]);
  } else if (pm === 'composer') {
    commands.push(['Test', `./vendor/bin/phpunit`]);
    commands.push(['Lint', `./vendor/bin/phpcs`]);
  }

  lines.push('| Action | Command |');
  lines.push('|--------|---------|');
  for (const [action, cmd] of commands) {
    lines.push(`| ${action} | \`${cmd}\` |`);
  }

  return lines.join('\n');
}

function buildTesting(profile: StackProfile): string {
  const lines = ['## Testing', ''];
  if (profile.testFramework !== 'none') {
    lines.push(`- Unit/Integration: **${profile.testFramework}**`);
  }
  if (profile.e2eFramework !== 'none') {
    lines.push(`- E2E: **${profile.e2eFramework}**`);
  }
  if (profile.testFramework === 'none' && profile.e2eFramework === 'none') {
    lines.push('No test framework detected. Consider adding one.');
  }
  return lines.join('\n');
}

function buildEnvironment(profile: StackProfile): string {
  const lines = ['## Environment', ''];
  if (profile.database !== 'none') {
    lines.push(`- Database: **${profile.database}**`);
  }
  if (profile.orm !== 'none') {
    lines.push(`- ORM: **${profile.orm}**`);
  }
  lines.push('- Check `.env.example` for required environment variables');
  return lines.join('\n');
}

function buildConventions(profile: StackProfile): string {
  const lines = ['## Conventions', ''];
  if (profile.detectedTools.formatter) {
    lines.push(`- Formatter: **${profile.detectedTools.formatter}** (auto-runs via hook)`);
  }
  if (profile.detectedTools.linter) {
    lines.push(`- Linter: **${profile.detectedTools.linter}** (auto-runs via hook)`);
  }
  if (profile.cssTooling.length > 0) {
    lines.push(`- CSS: ${profile.cssTooling.join(', ')}`);
  }
  if (profile.monorepo !== 'none') {
    lines.push(`- Monorepo: **${profile.monorepo}**`);
  }
  return lines.join('\n');
}

const BEHAVIORAL_GUIDELINES = `---

## Behavioral Guidelines

Tradeoff: These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
\`\`\`
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
\`\`\`

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.`;

export function generateClaudeMd(profile: StackProfile): GeneratedFile {
  const sections = [
    `# Project\n\n${buildOverview(profile)}`,
    buildKeyCommands(profile),
    buildConventions(profile),
    buildTesting(profile),
    buildEnvironment(profile),
  ];

  if (profile.ci !== 'none') {
    sections.push(`## CI/CD\n\n- Pipeline: **${profile.ci}**`);
  }

  sections.push(BEHAVIORAL_GUIDELINES);

  return {
    path: 'CLAUDE.md',
    content: sections.join('\n\n') + '\n',
  };
}
