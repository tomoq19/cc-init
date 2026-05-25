## ADDED Requirements

### Requirement: Generate CLAUDE.md
The system SHALL generate a `.claude/CLAUDE.md` file tailored to the detected stack with project-specific content.

#### Scenario: Node.js TypeScript project
- **WHEN** StackProfile has language=`typescript`, framework=`nextjs`, packageManager=`pnpm`, testFramework=`vitest`
- **THEN** CLAUDE.md SHALL include: project overview mentioning Next.js + TypeScript, key commands (`pnpm dev`, `pnpm build`, `pnpm test`, `pnpm lint`), architecture section based on detected directories, and testing section mentioning Vitest

#### Scenario: Python FastAPI project
- **WHEN** StackProfile has language=`python`, framework=`fastapi`, testFramework=`pytest`
- **THEN** CLAUDE.md SHALL include project overview mentioning FastAPI, key commands (`pytest`, `uvicorn`), and Python-specific conventions

#### Scenario: Key commands derived from scripts
- **WHEN** `package.json` contains `scripts` field
- **THEN** CLAUDE.md key commands section SHALL list the actual script names (e.g., `pnpm dev`, `pnpm build`) rather than generic placeholders

### Requirement: Generate settings.json
The system SHALL generate `.claude/settings.json` with permissions, hooks, and MCP servers matching the detected stack.

#### Scenario: Permissions for Node.js project
- **WHEN** StackProfile has packageManager=`pnpm`, testFramework=`vitest`
- **THEN** settings.json SHALL include `"allow"` entries for `"Bash(pnpm test)"`, `"Bash(pnpm lint)"`, `"Bash(pnpm build)"`

#### Scenario: PostToolUse hooks with formatter
- **WHEN** `prettier` is in devDependencies and packageManager=`pnpm`
- **THEN** settings.json SHALL include a PostToolUse hook with matcher `"Write|Edit"` and command `"pnpm prettier --write \"$FILE_PATH\""`

#### Scenario: PostToolUse hooks with linter
- **WHEN** `eslint` is in devDependencies and packageManager=`pnpm`
- **THEN** settings.json SHALL include a PostToolUse hook with matcher `"Write|Edit"` and command `"pnpm eslint --fix \"$FILE_PATH\""`

#### Scenario: PostToolUse hooks with type checker
- **WHEN** `typescript` is in devDependencies and packageManager=`pnpm`
- **THEN** settings.json SHALL include a PostToolUse hook with matcher `"Write|Edit"` and command containing `"timeout 60 pnpm tsc --noEmit --pretty false --incremental"`

#### Scenario: Python formatter hook
- **WHEN** StackProfile has language=`python` and `black` or `ruff` is in dependencies
- **THEN** settings.json SHALL include a PostToolUse hook using the project's Python formatter via the detected package manager

#### Scenario: MCP servers only for detected needs
- **WHEN** StackProfile has orm=`prisma` and e2eFramework=`playwright`
- **THEN** settings.json SHALL include MCP server entries for database and playwright, and SHALL NOT include MCP servers for undetected tools

#### Scenario: PreToolUse file size guard
- **WHEN** any StackProfile is provided
- **THEN** settings.json SHALL include a PreToolUse hook that blocks Write operations exceeding 800 lines

### Requirement: Generate stack-specific agents
The system SHALL create `.claude/agents/` with subagent markdown files appropriate to the detected stack.

#### Scenario: Universal agents always created
- **WHEN** any StackProfile is provided
- **THEN** the system SHALL create `agents/reviewer.md` and `agents/security.md`

#### Scenario: TypeScript project agents
- **WHEN** StackProfile has language=`typescript`
- **THEN** the system SHALL create `agents/ts-reviewer.md` with TypeScript-specific review instructions

#### Scenario: Python project agents
- **WHEN** StackProfile has language=`python`
- **THEN** the system SHALL create `agents/py-reviewer.md` with Python-specific review instructions

#### Scenario: Test framework agent
- **WHEN** StackProfile has testFramework set to any value other than `none`
- **THEN** the system SHALL create `agents/tester.md` referencing the detected test framework

#### Scenario: Database agent
- **WHEN** StackProfile has orm set to any value other than `none`
- **THEN** the system SHALL create `agents/db-reviewer.md` referencing the detected ORM

### Requirement: Generate slash commands
The system SHALL create `.claude/commands/` with project-specific prompt files.

#### Scenario: Dev command
- **WHEN** a dev server command is detected (e.g., `pnpm dev`, `python manage.py runserver`)
- **THEN** the system SHALL create `commands/dev.md` with the appropriate start command

#### Scenario: Check command
- **WHEN** lint and test commands are detected
- **THEN** the system SHALL create `commands/check.md` that runs lint + typecheck + test in sequence

### Requirement: Generate custom skills
The system SHALL create `.claude/skills/` when the stack warrants specialized skills.

#### Scenario: API scaffold skill for Express/FastAPI
- **WHEN** StackProfile has framework=`express` or framework=`fastapi`
- **THEN** the system SHALL create `skills/api-scaffold.md` with instructions for scaffolding new API endpoints with tests

#### Scenario: No unnecessary skills
- **WHEN** the StackProfile does not match any skill trigger
- **THEN** the system SHALL NOT create the `skills/` directory

### Requirement: Output valid JSON
The system SHALL produce syntactically valid JSON for settings.json.

#### Scenario: Parseable output
- **WHEN** settings.json is generated
- **THEN** the file SHALL parse successfully with `JSON.parse()` with no trailing commas or comments

### Requirement: Dry-run mode
The system SHALL support a `--dry-run` flag that previews generated files without writing.

#### Scenario: Dry run output
- **WHEN** user runs `cc-init --dry-run`
- **THEN** the system SHALL print all generated file contents to stdout with file path headers and SHALL NOT write any files to disk
