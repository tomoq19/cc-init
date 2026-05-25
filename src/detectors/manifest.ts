import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';

export interface ManifestResult {
  exists: boolean;
  content?: string;
  parsed?: Record<string, unknown>;
}

const MANIFEST_FILES = [
  'package.json',
  'tsconfig.json',
  'pyproject.toml',
  'requirements.txt',
  'setup.py',
  'go.mod',
  'Cargo.toml',
  'build.gradle',
  'build.gradle.kts',
  'pom.xml',
  'Gemfile',
  'pubspec.yaml',
  'Package.swift',
  'composer.json',
  'docker-compose.yml',
  'docker-compose.yaml',
  'Dockerfile',
  'Makefile',
  '.env.example',
  '.env.local',
  'turbo.json',
  'pnpm-workspace.yaml',
  'nx.json',
  'lerna.json',
] as const;

const MANIFEST_DIRS = [
  '.github/workflows',
  'prisma',
] as const;

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function readManifest(projectDir: string, filename: string): Promise<ManifestResult> {
  const filePath = join(projectDir, filename);
  const exists = await fileExists(filePath);
  if (!exists) return { exists: false };

  try {
    const content = await readFile(filePath, 'utf-8');
    const parsed = filename.endsWith('.json') ? JSON.parse(content) : undefined;
    return { exists: true, content, parsed };
  } catch {
    return { exists: true };
  }
}

export type ManifestMap = Record<string, ManifestResult>;
export type DirMap = Record<string, boolean>;

export async function scanManifests(projectDir: string): Promise<{ files: ManifestMap; dirs: DirMap }> {
  const fileResults = await Promise.all(
    MANIFEST_FILES.map(async (f) => [f, await readManifest(projectDir, f)] as const)
  );
  const dirResults = await Promise.all(
    MANIFEST_DIRS.map(async (d) => [d, await fileExists(join(projectDir, d))] as const)
  );

  return {
    files: Object.fromEntries(fileResults),
    dirs: Object.fromEntries(dirResults),
  };
}
