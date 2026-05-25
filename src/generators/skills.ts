import type { StackProfile, GeneratedFile } from '../types.js';

export function generateSkills(profile: StackProfile): GeneratedFile[] {
  const skills: GeneratedFile[] = [];

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
