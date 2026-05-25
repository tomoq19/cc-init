import { access, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { ManifestMap, DirMap } from './manifest.js';
import { hasDep } from './node.js';

export interface ToolingResult {
  testFramework: string;
  e2eFramework: string;
  orm: string;
  cssTooling: string[];
  ci: string;
  monorepo: string;
  database: string;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function hasConfigFile(projectDir: string, pattern: string): Promise<boolean> {
  try {
    const files = await readdir(projectDir);
    return files.some((f: string) => f.startsWith(pattern));
  } catch {
    return false;
  }
}

function detectTestFramework(files: ManifestMap, projectDir: string): string {
  if (hasDep(files, 'vitest')) return 'vitest';
  if (hasDep(files, 'jest')) return 'jest';
  if (hasDep(files, 'mocha')) return 'mocha';

  const pyproject = files['pyproject.toml'];
  const requirements = files['requirements.txt'];
  const allPython = [pyproject?.content ?? '', requirements?.content ?? ''].join('\n').toLowerCase();
  if (allPython.includes('pytest')) return 'pytest';
  if (allPython.includes('unittest')) return 'unittest';

  const goMod = files['go.mod'];
  if (goMod?.exists) return 'go-test';

  const cargo = files['Cargo.toml'];
  if (cargo?.exists) return 'cargo-test';

  return 'none';
}

function detectE2eFramework(files: ManifestMap): string {
  if (hasDep(files, '@playwright/test')) return 'playwright';
  if (hasDep(files, 'playwright')) return 'playwright';
  if (hasDep(files, 'cypress')) return 'cypress';
  if (hasDep(files, 'puppeteer')) return 'puppeteer';
  return 'none';
}

function detectOrm(files: ManifestMap, dirs: DirMap): string {
  if (dirs['prisma'] || hasDep(files, 'prisma')) return 'prisma';
  if (hasDep(files, 'drizzle-orm')) return 'drizzle';
  if (hasDep(files, 'typeorm')) return 'typeorm';
  if (hasDep(files, 'sequelize')) return 'sequelize';
  if (hasDep(files, 'knex')) return 'knex';
  if (hasDep(files, 'mongoose')) return 'mongoose';

  const pyContent = [
    files['pyproject.toml']?.content ?? '',
    files['requirements.txt']?.content ?? '',
  ].join('\n').toLowerCase();
  if (pyContent.includes('sqlalchemy')) return 'sqlalchemy';
  if (pyContent.includes('django')) return 'django-orm';
  if (pyContent.includes('tortoise')) return 'tortoise-orm';

  return 'none';
}

function detectCssTooling(files: ManifestMap): string[] {
  const tools: string[] = [];
  if (hasDep(files, 'tailwindcss')) tools.push('tailwind');
  if (hasDep(files, 'postcss')) tools.push('postcss');
  if (hasDep(files, 'sass') || hasDep(files, 'node-sass')) tools.push('sass');
  if (hasDep(files, 'styled-components')) tools.push('styled-components');
  if (hasDep(files, '@emotion/react')) tools.push('emotion');
  if (hasDep(files, 'stylelint')) tools.push('stylelint');
  return tools;
}

async function detectCi(projectDir: string, dirs: DirMap): Promise<string> {
  if (dirs['.github/workflows']) {
    try {
      const entries = await readdir(join(projectDir, '.github/workflows'));
      if (entries.some((f: string) => f.endsWith('.yml') || f.endsWith('.yaml'))) return 'github-actions';
    } catch { /* empty */ }
  }
  if (await fileExists(join(projectDir, '.gitlab-ci.yml'))) return 'gitlab-ci';
  if (await fileExists(join(projectDir, 'Jenkinsfile'))) return 'jenkins';
  if (await fileExists(join(projectDir, '.circleci/config.yml'))) return 'circleci';
  return 'none';
}

function detectMonorepo(files: ManifestMap): string {
  if (files['turbo.json']?.exists) return 'turborepo';
  if (files['pnpm-workspace.yaml']?.exists) return 'pnpm-workspaces';
  if (files['nx.json']?.exists) return 'nx';
  if (files['lerna.json']?.exists) return 'lerna';
  return 'none';
}

function detectDatabase(files: ManifestMap): string {
  const allDepsCheck = (dep: string) => hasDep(files, dep);
  if (allDepsCheck('pg') || allDepsCheck('postgres') || allDepsCheck('@neondatabase/serverless')) return 'postgresql';
  if (allDepsCheck('mysql2') || allDepsCheck('mysql')) return 'mysql';
  if (allDepsCheck('better-sqlite3') || allDepsCheck('sqlite3')) return 'sqlite';
  if (allDepsCheck('mongodb') || allDepsCheck('mongoose')) return 'mongodb';
  if (allDepsCheck('redis') || allDepsCheck('ioredis')) return 'redis';

  const pyContent = [
    files['pyproject.toml']?.content ?? '',
    files['requirements.txt']?.content ?? '',
  ].join('\n').toLowerCase();
  if (pyContent.includes('psycopg') || pyContent.includes('asyncpg')) return 'postgresql';
  if (pyContent.includes('pymongo')) return 'mongodb';

  return 'none';
}

export async function detectTooling(
  projectDir: string,
  files: ManifestMap,
  dirs: DirMap,
): Promise<ToolingResult> {
  const [ci] = await Promise.all([
    detectCi(projectDir, dirs),
  ]);

  return {
    testFramework: detectTestFramework(files, projectDir),
    e2eFramework: detectE2eFramework(files),
    orm: detectOrm(files, dirs),
    cssTooling: detectCssTooling(files),
    ci,
    monorepo: detectMonorepo(files),
    database: detectDatabase(files),
  };
}
