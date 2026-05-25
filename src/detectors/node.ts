import type { ManifestMap } from './manifest.js';
import type { DetectedTools } from '../types.js';

interface NodeDetectionResult {
  framework: string;
  tools: Partial<DetectedTools>;
  scripts: Record<string, string>;
}

const FRAMEWORK_DEPS: Array<{ dep: string; framework: string }> = [
  { dep: 'next', framework: 'nextjs' },
  { dep: 'nuxt', framework: 'nuxt' },
  { dep: '@angular/core', framework: 'angular' },
  { dep: 'vue', framework: 'vue' },
  { dep: 'svelte', framework: 'svelte' },
  { dep: '@sveltejs/kit', framework: 'sveltekit' },
  { dep: 'astro', framework: 'astro' },
  { dep: 'remix', framework: 'remix' },
  { dep: '@remix-run/node', framework: 'remix' },
  { dep: '@nestjs/core', framework: 'nestjs' },
  { dep: 'fastify', framework: 'fastify' },
  { dep: 'express', framework: 'express' },
  { dep: 'hono', framework: 'hono' },
  { dep: 'koa', framework: 'koa' },
];

export function detectNode(files: ManifestMap): NodeDetectionResult | null {
  const pkg = files['package.json'];
  if (!pkg?.exists || !pkg.parsed) return null;

  const parsed = pkg.parsed as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    scripts?: Record<string, string>;
  };

  const allDeps = { ...parsed.dependencies, ...parsed.devDependencies };
  const scripts = parsed.scripts ?? {};

  let framework = 'none';
  for (const { dep, framework: fw } of FRAMEWORK_DEPS) {
    if (allDeps[dep]) {
      framework = fw;
      break;
    }
  }

  const tools: Partial<DetectedTools> = {};
  if (allDeps['prettier']) tools.formatter = 'prettier';
  if (allDeps['eslint']) tools.linter = 'eslint';
  if (allDeps['biome'] || allDeps['@biomejs/biome']) {
    tools.formatter = 'biome';
    tools.linter = 'biome';
  }
  if (allDeps['typescript']) tools.typeChecker = 'tsc';
  if (allDeps['webpack']) tools.bundler = 'webpack';
  if (allDeps['vite']) tools.bundler = 'vite';
  if (allDeps['esbuild']) tools.bundler = 'esbuild';

  return { framework, tools, scripts };
}

export function hasDep(files: ManifestMap, dep: string): boolean {
  const pkg = files['package.json'];
  if (!pkg?.exists || !pkg.parsed) return false;
  const parsed = pkg.parsed as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  const allDeps = { ...parsed.dependencies, ...parsed.devDependencies };
  return dep in allDeps;
}

export function getScripts(files: ManifestMap): Record<string, string> {
  const pkg = files['package.json'];
  if (!pkg?.exists || !pkg.parsed) return {};
  return (pkg.parsed as { scripts?: Record<string, string> }).scripts ?? {};
}
