## 1. Project Setup

- [x] 1.1 Initialize Node.js package with `package.json` (name: `cc-init`, type: module, bin entry)
- [x] 1.2 Add dependencies: `commander` for CLI, `@inquirer/prompts` for interactive input
- [x] 1.3 Create directory structure: `src/`, `src/detectors/`, `src/generators/`, `src/templates/`
- [x] 1.4 Configure TypeScript with `tsconfig.json` (target: ES2022, module: Node16)
- [x] 1.5 Add build script and `bin/cc-init.js` entry point

## 2. CLI Entry Point

- [x] 2.1 Create `src/cli.ts` with Commander program: `cc-init [project-dir]` with `--dry-run`, `--yes`, `--force` flags
- [x] 2.2 Wire CLI to pipeline: detect → confirm → generate
- [x] 2.3 Add error handling and exit codes (0=success, 1=no stack detected in --yes mode)

## 3. Stack Detection

- [x] 3.1 Create `src/types.ts` with `StackProfile` interface (language, framework, packageManager, testFramework, e2eFramework, database, orm, cssTooling, ci, monorepo)
- [x] 3.2 Create `src/detectors/manifest.ts` — parallel file existence checks for all 15+ manifest files
- [x] 3.3 Create `src/detectors/node.ts` — parse `package.json` for framework detection (Next.js, React, Vue, Angular, Express, Fastify, Nest), devDependencies for tools
- [x] 3.4 Create `src/detectors/python.ts` — parse `pyproject.toml` / `requirements.txt` for framework detection (Django, FastAPI, Flask)
- [x] 3.5 Create `src/detectors/lockfile.ts` — detect package manager from lockfile priority (pnpm > yarn > npm)
- [x] 3.6 Create `src/detectors/tooling.ts` — detect test framework, e2e framework, ORM, CSS tooling, CI, monorepo
- [x] 3.7 Create `src/detectors/index.ts` — orchestrate all detectors, return merged `StackProfile`
- [x] 3.8 Write tests for each detector with fixture project directories

## 4. Interactive Input

- [x] 4.1 Create `src/interactive.ts` — prompt for missing StackProfile fields using @inquirer/prompts
- [x] 4.2 Create `src/confirm.ts` — display StackProfile summary table and ask for confirmation/corrections
- [x] 4.3 Handle `--yes` flag: skip confirmation, error if language=none
- [x] 4.4 Write tests for interactive flows (mock stdin)

## 5. Merge Strategy

- [x] 5.1 Create `src/merge.ts` — detect existing `.claude/`, prompt for merge/replace, handle `--force` flag
- [x] 5.2 Implement backup: rename `.claude/` to `.claude.backup.<timestamp>/`
- [x] 5.3 Implement merge logic for settings.json (deep-merge permissions, deduplicate hooks, merge MCP servers)
- [x] 5.4 Implement merge logic for CLAUDE.md (append with header, preserve existing content)
- [x] 5.5 Implement merge logic for agents/ (skip existing files by name)
- [x] 5.6 Write tests for merge/replace/backup scenarios

## 6. Config Generators

- [x] 6.1 Create `src/generators/claude-md.ts` — generate CLAUDE.md with project overview, key commands (from package.json scripts), architecture, conventions, environment, testing, deployment sections
- [x] 6.2 Create `src/generators/settings.ts` — generate settings.json with permissions (allow test/lint/build commands), PostToolUse hooks (formatter, linter, type checker), PreToolUse guard (800-line limit), MCP servers (only for detected tools)
- [x] 6.3 Create `src/generators/agents.ts` — generate agent .md files: always reviewer.md + security.md; conditionally ts-reviewer/py-reviewer/go-reviewer/rust-reviewer/tester/db-reviewer/ci-helper/a11y based on StackProfile
- [x] 6.4 Create `src/generators/skills.ts` — generate skill .md files conditionally: api-scaffold (Express/FastAPI), migrate (Prisma/Drizzle), component (React/Vue/Angular)
- [x] 6.5 Create `src/generators/commands.ts` — generate slash command .md files: dev.md, test.md, check.md with actual project commands
- [x] 6.6 Create `src/generators/index.ts` — orchestrate all generators, respect dry-run flag
- [x] 6.7 Write tests for each generator with various StackProfile inputs

## 7. Dry-Run Mode

- [x] 7.1 Implement `--dry-run` in generator orchestrator: print file contents to stdout with path headers instead of writing
- [x] 7.2 Write test verifying no filesystem writes occur in dry-run mode

## 8. Integration & Polish

- [x] 8.1 Write end-to-end test: run CLI against a fixture Next.js project, verify all generated files
- [x] 8.2 Write end-to-end test: run CLI against an empty directory, verify interactive mode triggers
- [x] 8.3 Validate generated settings.json is parseable JSON in all test cases
- [x] 8.4 Add `--version` flag and help text
- [x] 8.5 Create README.md with usage examples and supported stacks
