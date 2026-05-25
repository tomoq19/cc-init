import type { StackProfile, GeneratedFile } from '../types.js';

function buildUniversalSkills(profile: StackProfile): GeneratedFile[] {
  const pm = profile.packageManager;
  const testCmd = ['pnpm', 'npm', 'yarn', 'bun'].includes(pm) ? `${pm} test`
    : pm === 'poetry' ? 'poetry run pytest'
    : pm === 'go' ? 'go test ./...'
    : pm === 'cargo' ? 'cargo test'
    : pm === 'gradle' ? './gradlew test'
    : pm === 'maven' ? 'mvn test'
    : pm === 'bundler' ? 'bundle exec rspec'
    : pm === 'pub' ? 'flutter test'
    : pm === 'composer' ? './vendor/bin/phpunit'
    : 'echo "No test command configured"';

  return [
    {
      path: '.claude/skills/tdd.md',
      content: `---
name: tdd
description: Test-driven development workflow — write failing test, implement, refactor
---

When implementing a new feature or fixing a bug:

1. Write a failing test that describes the expected behavior
2. Run tests to confirm it fails: \`${testCmd}\`
3. Write the minimum code to make the test pass
4. Run tests to confirm it passes: \`${testCmd}\`
5. Refactor if needed while keeping tests green
6. Verify no regressions in the full suite

Never write implementation before the test exists.
If the test framework is not set up, set it up first.
`,
    },
    {
      path: '.claude/skills/debug.md',
      content: `---
name: debug
description: Systematic debugging — reproduce, isolate, fix, verify
---

When debugging a reported issue:

1. Reproduce: write a test or minimal script that triggers the bug
2. Isolate: narrow down to the smallest code path that causes it
3. Root cause: identify WHY it fails, not just WHERE
4. Fix: make the minimal change that addresses the root cause
5. Verify: run the reproduction test — it should pass
6. Regression: check that existing tests still pass: \`${testCmd}\`

Do not guess-and-check. Do not fix symptoms without understanding the cause.
`,
    },
    {
      path: '.claude/skills/refactor.md',
      content: `---
name: refactor
description: Safe refactoring — verify tests pass before and after every change
---

When refactoring code:

1. Ensure tests exist for the code being changed. If not, write them first.
2. Run tests to confirm green baseline: \`${testCmd}\`
3. Make one refactoring step at a time
4. Run tests after each step
5. If tests break, revert and take a smaller step
6. Do not change behavior — refactoring preserves external behavior by definition

Common refactors:
- Extract function (>50 lines)
- Extract module (>800 lines)
- Replace magic numbers with named constants
- Flatten deep nesting with early returns
- Remove duplication (3+ occurrences)
`,
    },
    {
      path: '.claude/skills/code-review.md',
      content: `---
name: code-review
description: Review code changes for quality, security, and correctness
---

When reviewing code (own or others'):

1. Check security first:
   - No hardcoded secrets, API keys, or tokens
   - User input validated at system boundaries
   - No injection vulnerabilities (SQL, XSS, command)
2. Check correctness:
   - Error handling at every level — no swallowed errors
   - Edge cases covered (empty, null, boundary values)
   - Async code handles failures properly
3. Check quality:
   - Functions <50 lines, files <800 lines
   - No deep nesting (>4 levels)
   - Clear naming — code reads like prose
   - No mutation of shared state
4. Check tests:
   - New code has corresponding tests
   - Tests cover happy path and failure cases

Rate issues: CRITICAL (block) / HIGH (should fix) / MEDIUM (consider) / LOW (note).
`,
    },
    {
      path: '.claude/skills/plan.md',
      content: `---
name: plan
description: Break down a complex task into a verified implementation plan
---

When starting a non-trivial task:

1. Restate the goal in one sentence
2. List assumptions — ask about any that are uncertain
3. Identify risks and unknowns
4. Break into ordered steps, each with a verification check:

\`\`\`
1. [Step] → verify: [how to confirm it worked]
2. [Step] → verify: [how to confirm it worked]
3. [Step] → verify: [how to confirm it worked]
\`\`\`

5. Identify which steps can be parallelized
6. Flag any steps that are irreversible or affect shared state

Present the plan before implementing. Adjust based on feedback.
Do not start coding until the plan is confirmed.
`,
    },
  ];
}

export function generateSkills(profile: StackProfile): GeneratedFile[] {
  const skills: GeneratedFile[] = [...buildUniversalSkills(profile)];

  if (['express', 'fastapi', 'fastify', 'hono', 'koa', 'nestjs', 'django', 'flask'].includes(profile.framework)) {
    skills.push({
      path: '.claude/skills/api-scaffold.md',
      content: `---
name: api-scaffold
description: Scaffold a new API endpoint with route handler, validation, and tests
---

When the user asks to create a new API endpoint:

1. Ask for: HTTP method, path, request/response shape, auth requirements
2. Create the route handler file following existing patterns in the codebase
3. Add input validation using the project's validation library
4. Create a test file with:
   - Happy path test
   - Validation error test
   - Auth failure test (if authenticated)
5. Register the route in the router/app configuration
6. Update any API documentation if present

Framework: ${profile.framework}
Test framework: ${profile.testFramework}
`,
    });
  }

  if (['prisma', 'drizzle'].includes(profile.orm)) {
    skills.push({
      path: '.claude/skills/migrate.md',
      content: `---
name: migrate
description: Generate and validate database migrations using ${profile.orm}
---

When the user asks to create a migration:

1. Understand the schema change (add table, add column, modify type, etc.)
2. ${profile.orm === 'prisma' ? 'Update schema.prisma with the changes' : 'Create a new migration file'}
3. Generate the migration: ${profile.orm === 'prisma' ? '`npx prisma migrate dev --name <name>`' : 'use the drizzle-kit generate command'}
4. Review the generated SQL for:
   - Data safety (no accidental drops without confirmation)
   - Backward compatibility
   - Index additions for foreign keys
5. Run the migration against the dev database
6. Verify the schema state matches expectations
`,
    });
  }

  if (['nextjs', 'react', 'vue', 'angular', 'svelte', 'sveltekit'].includes(profile.framework)) {
    skills.push({
      path: '.claude/skills/component.md',
      content: `---
name: component
description: Scaffold a new UI component with tests and stories
---

When the user asks to create a new component:

1. Ask for: component name, props interface, parent component (if any)
2. Create the component file following existing patterns:
   - Use semantic HTML
   - Add proper TypeScript types for props
   - Include ARIA attributes where needed
3. Create a test file with:
   - Render test
   - Prop variation tests
   - Interaction tests (click, input, etc.)
4. If Storybook is present, create a story file
5. Export from the appropriate index file

Framework: ${profile.framework}
CSS: ${profile.cssTooling.length > 0 ? profile.cssTooling.join(', ') : 'standard CSS'}
`,
    });
  }

  return skills;
}
