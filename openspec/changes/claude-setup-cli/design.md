## Context

Developers using Claude Code need a `.claude/` directory with CLAUDE.md, settings.json, agents, skills, hooks, MCP servers, and slash commands. Currently this is hand-authored, requiring deep knowledge of Claude Code internals. Most projects end up with minimal or no configuration, missing out on formatter hooks, type-checker hooks, stack-specific agents, and MCP integrations.

The tool runs as a Node.js CLI (`cc-init`), executed once per project to bootstrap configuration. It reads the filesystem, never modifies source code, and writes only to `.claude/`.

## Goals / Non-Goals

**Goals:**
- Detect tech stack from project manifest files with zero user input when possible
- Generate a complete, production-quality `.claude/` directory tailored to the detected stack
- Support interactive fallback when detection is insufficient
- Handle existing `.claude/` directories safely (merge or replace)
- Ship as a single `npx`-runnable package with minimal dependencies

**Non-Goals:**
- Runtime monitoring or continuous config updates
- IDE-specific integration (VS Code extension, JetBrains plugin)
- Remote/cloud configuration sync
- Generating project source code or boilerplate beyond `.claude/`
- Supporting non-Claude AI tool configurations

## Decisions

### 1. CLI framework: Commander.js

**Rationale**: Lightweight, zero-config, widely adopted. Alternatives considered:
- **yargs**: Heavier, more features than needed for a simple command structure
- **Zero-dep (process.argv)**: Too manual for subcommands and flags
- **oclif**: Over-engineered for a single-purpose tool

### 2. Architecture: Pipeline of detector → planner → generators

The CLI follows a three-stage pipeline:

1. **Detector** — scans project root, returns a `StackProfile` object (language, framework, packageManager, testFramework, database, orm, cssTooling, ci, monorepo)
2. **Planner** — takes a `StackProfile` and determines which generators to invoke and with what parameters
3. **Generators** — one per output type (claude-md, settings, agents, skills, commands), each receives the `StackProfile` and writes files

**Rationale**: Keeps each concern isolated. New stack support = new detector rules. New output = new generator. The planner is the only piece that knows the mapping.

**Alternative considered**: Monolithic generate function. Rejected — becomes unmaintainable as stack combinations grow.

### 3. Template approach: Embedded JS template literals, not external template files

**Rationale**: Templates are tightly coupled to the generator logic (conditionals based on stack). External template files (Handlebars, EJS) add a dependency and split logic across files for no benefit. Template literals keep the conditional generation readable in one place.

**Alternative considered**: YAML/JSON template definitions. Rejected — too rigid for the conditional logic needed (e.g., "add TypeScript hooks only if tsconfig exists").

### 4. Stack detection: Parallel file existence checks + JSON/TOML parsing

Scan for ~15 known manifest files in parallel using `fs.access` + `fs.readFile`. Parse package.json for framework detection (dependencies/devDependencies), pyproject.toml for Python framework, etc.

**Rationale**: Fast (parallel I/O), no external tools needed, covers 95% of projects.

**Alternative considered**: Running `npm ls` / `pip list`. Rejected — requires installed dependencies, slower, fragile.

### 5. Output format: Direct file writes, not a temp directory + copy

**Rationale**: Simpler, fewer edge cases. The merge strategy handles conflicts at the individual file level, so staging in a temp directory adds complexity without benefit.

### 6. Hook commands: Always reference project-local tooling

Hooks in settings.json MUST use the project's own package manager (`pnpm prettier`, `poetry run black`, `cargo fmt`). Never use `npx` or global binaries.

**Rationale**: Ensures hooks work regardless of global tool installation. Matches Claude Code best practices.

## Risks / Trade-offs

- **[Incomplete detection]** → Mitigation: Interactive fallback prompts user to confirm/correct detected stack before generating. Dry-run mode lets users preview.
- **[Generated config becomes stale]** → Mitigation: Out of scope for v1. Users can re-run `cc-init` to regenerate. Document this in the generated CLAUDE.md.
- **[Opinionated agent prompts]** → Mitigation: Agents are markdown files — trivially editable. Generate good defaults, not locked-in config.
- **[Hook commands reference missing tools]** → Mitigation: Detector checks devDependencies/tool presence before generating hooks. Only emit hooks for tools that are actually installed.
- **[Monorepo complexity]** → Mitigation: v1 targets the root workspace. Per-package `.claude/` is a future enhancement.
