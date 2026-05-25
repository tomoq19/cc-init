export interface StackProfile {
  language: Language;
  framework: string;
  packageManager: PackageManager;
  testFramework: string;
  e2eFramework: string;
  database: string;
  orm: string;
  cssTooling: string[];
  ci: string;
  monorepo: string;
  detectedTools: DetectedTools;
}

export type Language = 'typescript' | 'javascript' | 'python' | 'go' | 'rust' | 'java' | 'kotlin' | 'ruby' | 'dart' | 'swift' | 'php' | 'none';

export type PackageManager = 'pnpm' | 'yarn' | 'npm' | 'bun' | 'poetry' | 'pip' | 'uv' | 'go' | 'cargo' | 'gradle' | 'maven' | 'bundler' | 'pub' | 'spm' | 'composer' | 'none';

export interface DetectedTools {
  formatter: string | null;
  linter: string | null;
  typeChecker: string | null;
  bundler: string | null;
}

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface CLIOptions {
  dryRun: boolean;
  yes: boolean;
  force: boolean;
}

export function emptyStackProfile(): StackProfile {
  return {
    language: 'none',
    framework: 'none',
    packageManager: 'none',
    testFramework: 'none',
    e2eFramework: 'none',
    database: 'none',
    orm: 'none',
    cssTooling: [],
    ci: 'none',
    monorepo: 'none',
    detectedTools: {
      formatter: null,
      linter: null,
      typeChecker: null,
      bundler: null,
    },
  };
}
