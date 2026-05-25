import { select, input } from '@inquirer/prompts';
import type { Language, PackageManager, StackProfile } from './types.js';

const LANGUAGE_CHOICES = [
  { name: 'TypeScript', value: 'typescript' },
  { name: 'JavaScript', value: 'javascript' },
  { name: 'Python', value: 'python' },
  { name: 'Go', value: 'go' },
  { name: 'Rust', value: 'rust' },
  { name: 'Java', value: 'java' },
  { name: 'Kotlin', value: 'kotlin' },
  { name: 'Ruby', value: 'ruby' },
  { name: 'Dart/Flutter', value: 'dart' },
  { name: 'Swift', value: 'swift' },
  { name: 'PHP', value: 'php' },
] as const;

const PM_CHOICES: Record<string, Array<{ name: string; value: PackageManager }>> = {
  typescript: [
    { name: 'pnpm', value: 'pnpm' },
    { name: 'npm', value: 'npm' },
    { name: 'yarn', value: 'yarn' },
    { name: 'bun', value: 'bun' },
  ],
  javascript: [
    { name: 'pnpm', value: 'pnpm' },
    { name: 'npm', value: 'npm' },
    { name: 'yarn', value: 'yarn' },
    { name: 'bun', value: 'bun' },
  ],
  python: [
    { name: 'pip', value: 'pip' },
    { name: 'poetry', value: 'poetry' },
    { name: 'uv', value: 'uv' },
  ],
  go: [{ name: 'go', value: 'go' }],
  rust: [{ name: 'cargo', value: 'cargo' }],
  java: [
    { name: 'gradle', value: 'gradle' },
    { name: 'maven', value: 'maven' },
  ],
  kotlin: [{ name: 'gradle', value: 'gradle' }],
  ruby: [{ name: 'bundler', value: 'bundler' }],
  dart: [{ name: 'pub', value: 'pub' }],
  swift: [{ name: 'spm', value: 'spm' }],
  php: [{ name: 'composer', value: 'composer' }],
};

export async function promptMissingFields(profile: StackProfile): Promise<StackProfile> {
  const updated = { ...profile };

  if (updated.language === 'none') {
    updated.language = await select({
      message: 'What is the primary language?',
      choices: LANGUAGE_CHOICES,
    }) as Language;
  }

  if (updated.packageManager === 'none') {
    const choices = PM_CHOICES[updated.language];
    if (choices && choices.length > 1) {
      updated.packageManager = await select({
        message: 'Which package manager?',
        choices,
      });
    } else if (choices?.[0]) {
      updated.packageManager = choices[0].value;
    }
  }

  if (updated.framework === 'none') {
    const fw = await input({
      message: 'Framework (or "none"):',
      default: 'none',
    });
    updated.framework = fw.trim() || 'none';
  }

  if (updated.testFramework === 'none') {
    const tf = await input({
      message: 'Test framework (or "none"):',
      default: 'none',
    });
    updated.testFramework = tf.trim() || 'none';
  }

  return updated;
}
