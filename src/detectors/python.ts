import type { ManifestMap } from './manifest.js';
import type { PackageManager } from '../types.js';

interface PythonDetectionResult {
  framework: string;
  packageManager: PackageManager;
  formatter: string | null;
  linter: string | null;
}

const FRAMEWORK_PATTERNS: Array<{ pattern: string; framework: string }> = [
  { pattern: 'django', framework: 'django' },
  { pattern: 'fastapi', framework: 'fastapi' },
  { pattern: 'flask', framework: 'flask' },
  { pattern: 'starlette', framework: 'starlette' },
  { pattern: 'tornado', framework: 'tornado' },
  { pattern: 'aiohttp', framework: 'aiohttp' },
];

export function detectPython(files: ManifestMap): PythonDetectionResult | null {
  const pyproject = files['pyproject.toml'];
  const requirements = files['requirements.txt'];
  const setupPy = files['setup.py'];

  if (!pyproject?.exists && !requirements?.exists && !setupPy?.exists) return null;

  const allContent = [
    pyproject?.content ?? '',
    requirements?.content ?? '',
  ].join('\n').toLowerCase();

  let framework = 'none';
  for (const { pattern, framework: fw } of FRAMEWORK_PATTERNS) {
    if (allContent.includes(pattern)) {
      framework = fw;
      break;
    }
  }

  let packageManager: PackageManager = 'pip';
  if (pyproject?.content) {
    if (pyproject.content.includes('[tool.poetry]')) packageManager = 'poetry';
    else if (pyproject.content.includes('[tool.uv]') || pyproject.content.includes('uv.lock')) packageManager = 'uv';
  }

  let formatter: string | null = null;
  if (allContent.includes('black')) formatter = 'black';
  if (allContent.includes('ruff')) formatter = 'ruff';

  let linter: string | null = null;
  if (allContent.includes('ruff')) linter = 'ruff';
  else if (allContent.includes('flake8')) linter = 'flake8';
  else if (allContent.includes('pylint')) linter = 'pylint';

  return { framework, packageManager, formatter, linter };
}
