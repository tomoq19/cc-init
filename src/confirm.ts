import { confirm } from '@inquirer/prompts';
import type { StackProfile } from './types.js';

export function printStackSummary(profile: StackProfile): void {
  console.log('\n┌─────────────────────────────────────┐');
  console.log('│        Detected Stack Profile        │');
  console.log('├──────────────┬──────────────────────┤');

  const rows: Array<[string, string]> = [
    ['Language', profile.language],
    ['Framework', profile.framework],
    ['Pkg Manager', profile.packageManager],
    ['Test', profile.testFramework],
    ['E2E', profile.e2eFramework],
    ['Database', profile.database],
    ['ORM', profile.orm],
    ['CSS', profile.cssTooling.length > 0 ? profile.cssTooling.join(', ') : 'none'],
    ['CI/CD', profile.ci],
    ['Monorepo', profile.monorepo],
    ['Formatter', profile.detectedTools.formatter ?? 'none'],
    ['Linter', profile.detectedTools.linter ?? 'none'],
    ['Type Check', profile.detectedTools.typeChecker ?? 'none'],
  ];

  for (const [label, value] of rows) {
    const l = label.padEnd(12);
    const v = value.padEnd(20);
    console.log(`│ ${l} │ ${v} │`);
  }

  console.log('└──────────────┴──────────────────────┘\n');
}

export async function confirmStack(profile: StackProfile): Promise<boolean> {
  printStackSummary(profile);
  return confirm({
    message: 'Proceed with this stack profile?',
    default: true,
  });
}
