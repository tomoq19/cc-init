import type { StackProfile, GeneratedFile } from '../types.js';

export function generateCommands(profile: StackProfile): GeneratedFile[] {
  const commands: GeneratedFile[] = [];
  const pm = profile.packageManager;

  const devCmd = getDevCommand(profile);
  if (devCmd) {
    commands.push({
      path: '.claude/commands/dev.md',
      content: `Start the development environment.\n\nRun: \`${devCmd}\`\n`,
    });
  }

  const testCmd = getTestCommand(profile);
  if (testCmd) {
    commands.push({
      path: '.claude/commands/test.md',
      content: `Run the full test suite.\n\nRun: \`${testCmd}\`\n`,
    });
  }

  const checkSteps = getCheckSteps(profile);
  if (checkSteps.length > 0) {
    commands.push({
      path: '.claude/commands/check.md',
      content: `Run all quality checks in sequence.\n\n${checkSteps.map(s => `Run: \`${s}\``).join('\n\n')}\n`,
    });
  }

  return commands;
}

function getDevCommand(profile: StackProfile): string | null {
  const pm = profile.packageManager;
  if (['pnpm', 'npm', 'yarn', 'bun'].includes(pm)) return `${pm} dev`;
  if (pm === 'poetry' && profile.framework === 'fastapi') return `poetry run uvicorn main:app --reload`;
  if (pm === 'poetry' && profile.framework === 'django') return `poetry run python manage.py runserver`;
  if (pm === 'go') return `go run .`;
  if (pm === 'cargo') return `cargo run`;
  if (pm === 'gradle') return `./gradlew bootRun`;
  if (pm === 'pub') return `flutter run`;
  return null;
}

function getTestCommand(profile: StackProfile): string | null {
  const pm = profile.packageManager;
  if (['pnpm', 'npm', 'yarn', 'bun'].includes(pm)) return `${pm} test`;
  if (pm === 'poetry') return `poetry run pytest`;
  if (pm === 'pip') return `python -m pytest`;
  if (pm === 'uv') return `uv run pytest`;
  if (pm === 'go') return `go test ./...`;
  if (pm === 'cargo') return `cargo test`;
  if (pm === 'gradle') return `./gradlew test`;
  if (pm === 'maven') return `mvn test`;
  if (pm === 'bundler') return `bundle exec rspec`;
  if (pm === 'pub') return `flutter test`;
  if (pm === 'composer') return `./vendor/bin/phpunit`;
  return null;
}

function getCheckSteps(profile: StackProfile): string[] {
  const steps: string[] = [];
  const pm = profile.packageManager;

  if (profile.detectedTools.linter) {
    if (['pnpm', 'npm', 'yarn', 'bun'].includes(pm)) {
      steps.push(`${pm} lint`);
    } else if (pm === 'poetry') {
      steps.push(`poetry run ${profile.detectedTools.linter} check .`);
    } else if (pm === 'go') {
      steps.push(`golangci-lint run`);
    } else if (pm === 'cargo') {
      steps.push(`cargo clippy`);
    }
  }

  if (profile.detectedTools.typeChecker === 'tsc') {
    steps.push(`${pm} tsc --noEmit`);
  }

  const testCmd = getTestCommand(profile);
  if (testCmd) steps.push(testCmd);

  return steps;
}
