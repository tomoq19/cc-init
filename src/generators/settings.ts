import type { StackProfile, GeneratedFile } from '../types.js';

interface CommandHook {
  type: 'command';
  command: string;
}

interface HookEntry {
  matcher?: string;
  hooks: CommandHook[];
}

interface Settings {
  permissions: { allow: string[]; deny: string[] };
  hooks: {
    PreToolUse: HookEntry[];
    PostToolUse: HookEntry[];
    Stop: HookEntry[];
  };
  mcpServers: Record<string, unknown>;
}

function buildPermissions(profile: StackProfile): string[] {
  const allow: string[] = [];
  const pm = profile.packageManager;

  if (['pnpm', 'npm', 'yarn', 'bun'].includes(pm)) {
    allow.push(`Bash(${pm} test)`, `Bash(${pm} lint)`, `Bash(${pm} build)`);
    allow.push(`Bash(${pm} run typecheck)`, `Bash(${pm} run dev)`);
  } else if (pm === 'poetry') {
    allow.push('Bash(poetry run pytest)', 'Bash(poetry run ruff check .)', 'Bash(poetry run ruff format .)');
  } else if (pm === 'go') {
    allow.push('Bash(go test ./...)', 'Bash(go build ./...)', 'Bash(go vet ./...)', 'Bash(golangci-lint run)');
  } else if (pm === 'cargo') {
    allow.push('Bash(cargo test)', 'Bash(cargo build)', 'Bash(cargo clippy)', 'Bash(cargo fmt)');
  } else if (pm === 'gradle') {
    allow.push('Bash(./gradlew test)', 'Bash(./gradlew build)');
  } else if (pm === 'maven') {
    allow.push('Bash(mvn test)', 'Bash(mvn package)');
  } else if (pm === 'bundler') {
    allow.push('Bash(bundle exec rspec)', 'Bash(bundle exec rubocop)');
  } else if (pm === 'pub') {
    allow.push('Bash(flutter test)', 'Bash(dart analyze)', 'Bash(dart format .)');
  } else if (pm === 'pip' || pm === 'uv') {
    const run = pm === 'uv' ? 'uv run' : 'python -m';
    allow.push(`Bash(${run} pytest)`);
  } else if (pm === 'composer') {
    allow.push('Bash(./vendor/bin/phpunit)', 'Bash(./vendor/bin/phpcs)');
  }

  allow.push(
    'Bash(git status)',
    'Bash(git diff)',
    'Bash(git log)',
  );

  return allow;
}

function buildPostToolUseHooks(profile: StackProfile): HookEntry[] {
  const entries: HookEntry[] = [];
  const pm = profile.packageManager;

  if (profile.detectedTools.formatter) {
    const formatter = profile.detectedTools.formatter;
    let cmd: string;
    if (['pnpm', 'npm', 'yarn', 'bun'].includes(pm)) {
      if (formatter === 'biome') {
        cmd = `${pm} biome format --write "$FILE_PATH"`;
      } else {
        cmd = `${pm} prettier --write "$FILE_PATH"`;
      }
    } else if (pm === 'poetry') {
      cmd = `poetry run ${formatter} "$FILE_PATH"`;
    } else if (pm === 'go') {
      cmd = `gofmt -w "$FILE_PATH"`;
    } else if (pm === 'cargo') {
      cmd = `cargo fmt -- "$FILE_PATH"`;
    } else if (pm === 'pub') {
      cmd = `dart format "$FILE_PATH"`;
    } else {
      cmd = `${formatter} "$FILE_PATH"`;
    }
    entries.push({ matcher: 'Write|Edit', hooks: [{ type: 'command', command: cmd }] });
  }

  if (profile.detectedTools.linter) {
    const linter = profile.detectedTools.linter;
    let cmd: string;
    if (['pnpm', 'npm', 'yarn', 'bun'].includes(pm)) {
      if (linter === 'biome') {
        cmd = `${pm} biome lint --write "$FILE_PATH"`;
      } else {
        cmd = `${pm} eslint --fix "$FILE_PATH"`;
      }
    } else if (pm === 'poetry') {
      cmd = `poetry run ${linter} check --fix "$FILE_PATH"`;
    } else if (pm === 'go') {
      cmd = `golangci-lint run "$FILE_PATH"`;
    } else if (pm === 'cargo') {
      cmd = `cargo clippy -- -W warnings`;
    } else if (pm === 'pub') {
      cmd = `dart analyze "$FILE_PATH"`;
    } else {
      cmd = `${linter} "$FILE_PATH"`;
    }
    entries.push({ matcher: 'Write|Edit', hooks: [{ type: 'command', command: cmd }] });
  }

  if (profile.detectedTools.typeChecker === 'tsc') {
    entries.push({
      matcher: 'Write|Edit',
      hooks: [{ type: 'command', command: `timeout 60 ${pm} tsc --noEmit --pretty false --incremental --tsBuildInfoFile node_modules/.cache/tsc-hook.tsbuildinfo` }],
    });
  }

  return entries;
}

function buildPreToolUseHooks(): HookEntry[] {
  return [
    {
      matcher: 'Write',
      hooks: [{
        type: 'command',
        command: `node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const i=JSON.parse(d);const c=i.tool_input?.content||'';const lines=c.split('\\\\n').length;if(lines>800){console.error('[Hook] BLOCKED: File exceeds 800 lines ('+lines+' lines)');console.error('[Hook] Split into smaller modules');process.exit(2)}console.log(d)})"`,
      }],
    },
  ];
}

function buildStopHooks(profile: StackProfile): HookEntry[] {
  const pm = profile.packageManager;
  const entries: HookEntry[] = [];

  if (['pnpm', 'npm', 'yarn', 'bun'].includes(pm)) {
    entries.push({ hooks: [{ type: 'command', command: `${pm} build` }] });
  } else if (pm === 'cargo') {
    entries.push({ hooks: [{ type: 'command', command: 'cargo build' }] });
  } else if (pm === 'go') {
    entries.push({ hooks: [{ type: 'command', command: 'go build ./...' }] });
  } else if (pm === 'gradle') {
    entries.push({ hooks: [{ type: 'command', command: './gradlew build' }] });
  }

  return entries;
}

export function generateSettings(profile: StackProfile): GeneratedFile {
  const settings: Settings = {
    permissions: {
      allow: buildPermissions(profile),
      deny: [],
    },
    hooks: {
      PreToolUse: buildPreToolUseHooks(),
      PostToolUse: buildPostToolUseHooks(profile),
      Stop: buildStopHooks(profile),
    },
    mcpServers: {},
  };

  const cleanSettings: Record<string, unknown> = {
    permissions: settings.permissions,
  };

  const cleanHooks: Record<string, unknown> = {};
  if (settings.hooks.PreToolUse.length > 0) cleanHooks.PreToolUse = settings.hooks.PreToolUse;
  if (settings.hooks.PostToolUse.length > 0) cleanHooks.PostToolUse = settings.hooks.PostToolUse;
  if (settings.hooks.Stop.length > 0) cleanHooks.Stop = settings.hooks.Stop;
  if (Object.keys(cleanHooks).length > 0) cleanSettings.hooks = cleanHooks;

  return {
    path: '.claude/settings.json',
    content: JSON.stringify(cleanSettings, null, 2) + '\n',
  };
}
