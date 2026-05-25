## Why

Setting up a Claude Code project configuration (`.claude/` folder with CLAUDE.md, settings.json, agents, skills, hooks, MCP servers, and commands) is manual, repetitive, and error-prone. Developers must know Claude Code internals to write effective configs. A CLI tool that scans a project's tech stack (or accepts user input) and generates best-practice `.claude/` configuration eliminates this friction and ensures every project starts with production-quality AI tooling.

## What Changes

- New CLI tool (`cc-init`) that detects project tech stack from manifest files (package.json, pyproject.toml, go.mod, Cargo.toml, etc.)
- Fallback to interactive user input when no project files are found
- Generates complete `.claude/` directory structure:
  - `CLAUDE.md` — project-specific instructions, commands, architecture, conventions
  - `settings.json` — permissions, hooks (formatter, linter, type checker), MCP servers
  - `agents/` — stack-appropriate subagent definitions (reviewer, security, tester, etc.)
  - `skills/` — custom skills matching detected patterns (migration, API scaffold, etc.)
  - `commands/` — slash command prompt files (dev, test, check)
- Merge-or-replace behavior when `.claude/` already exists
- Dry-run mode to preview generated config without writing

## Capabilities

### New Capabilities

- `stack-detection`: Scan project root for manifest files and detect language, framework, package manager, test framework, database, CI/CD, and CSS tooling
- `config-generation`: Generate `.claude/` directory contents (CLAUDE.md, settings.json, agents, skills, commands) tailored to the detected stack
- `interactive-input`: Prompt user for tech stack details when auto-detection finds insufficient signals
- `merge-strategy`: Handle existing `.claude/` directories — merge with or replace existing configuration

### Modified Capabilities

_(none — greenfield project)_

## Impact

- **New files**: CLI entry point, stack detector module, config generators (one per output type), templates for agents/skills/commands
- **Dependencies**: Node.js runtime (or standalone binary), a CLI framework (e.g., Commander, yargs, or zero-dep), a prompting library for interactive mode (e.g., inquirer or prompts)
- **No external API calls**: Entirely local filesystem operations
- **Users**: Any developer setting up Claude Code for a new or existing project
