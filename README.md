# cc-init

A CLI that scans a project and generates best-practice `.claude/` configuration for Claude Code.

## What it creates

```text
.claude/
├── CLAUDE.md
├── settings.json
├── agents/
├── skills/
└── commands/
```

Generated configuration is tailored to the detected stack:

- `CLAUDE.md` with project overview, commands, conventions, testing, environment notes, and [Karpathy behavioral guidelines](https://github.com/multica-ai/andrej-karpathy-skills)
- `settings.json` with safe permissions and project-local hooks (valid [ECC](https://github.com/affaan-m/ECC) hook schema)
- Subagents for review, security, testing, database, accessibility, and language-specific review
- Universal skills (tdd, debug, refactor, code-review, plan) for all stacks, plus framework-specific skills (API scaffolding, migrations, components) where relevant
- Slash commands for dev, test, and check workflows

## Usage

```bash
cc-init
```

Scan a specific directory:

```bash
cc-init ./my-project
```

Preview without writing files:

```bash
cc-init --dry-run
```

Skip confirmation prompts:

```bash
cc-init --yes
```

Replace an existing `.claude/` directory after backing it up:

```bash
cc-init --force
```

## Supported detection

### Languages

- TypeScript / JavaScript
- Python
- Go
- Rust
- Java / Kotlin
- Ruby
- Dart / Flutter
- Swift
- PHP

### Frameworks and tooling

- Next.js, Nuxt, Angular, Vue, SvelteKit, Astro, Remix
- Express, Fastify, NestJS, Hono, Koa
- Django, FastAPI, Flask
- Vitest, Jest, Playwright, Cypress, pytest
- Prisma, Drizzle, TypeORM, Sequelize, Knex, Mongoose, SQLAlchemy
- Tailwind, PostCSS, Sass, styled-components, Emotion
- GitHub Actions, GitLab CI, Jenkins, CircleCI
- Turborepo, pnpm workspaces, Nx, Lerna

## Development

```bash
npm install
npm run build
npm test
npm run typecheck
```

Run locally:

```bash
node bin/cc-init.js --dry-run --yes
```

## Referenced projects

- **[Andrej Karpathy Skills](https://github.com/multica-ai/andrej-karpathy-skills)** — Four behavioral principles (Think Before Coding, Simplicity First, Surgical Changes, Goal-Driven Execution) included in every generated `CLAUDE.md`.
- **[ECC (Enhanced Claude Code)](https://github.com/affaan-m/ECC)** — Agent harness providing 60 agents, 232 skills, 75+ commands, and 19 rule sets. The generated hook schema, skills structure, and agent patterns follow ECC conventions.
