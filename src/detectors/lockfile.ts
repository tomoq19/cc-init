import { access } from 'node:fs/promises';
import { join } from 'node:path';
import type { PackageManager } from '../types.js';

const LOCKFILE_PRIORITY: Array<{ file: string; manager: PackageManager }> = [
  { file: 'bun.lockb', manager: 'bun' },
  { file: 'pnpm-lock.yaml', manager: 'pnpm' },
  { file: 'yarn.lock', manager: 'yarn' },
  { file: 'package-lock.json', manager: 'npm' },
];

export async function detectPackageManager(projectDir: string, hasPackageJson: boolean): Promise<PackageManager> {
  for (const { file, manager } of LOCKFILE_PRIORITY) {
    try {
      await access(join(projectDir, file));
      return manager;
    } catch {
      continue;
    }
  }
  return hasPackageJson ? 'npm' : 'none';
}
