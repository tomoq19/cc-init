import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import type { StackProfile, GeneratedFile } from '../types.js';
import { generateClaudeMd } from './claude-md.js';
import { generateSettings } from './settings.js';
import { generateAgents } from './agents.js';
import { generateSkills } from './skills.js';
import { generateCommands } from './commands.js';
import {
  type MergeAction,
  backupClaudeDir,
  mergeSettingsJson,
  mergeClaudeMd,
  getExistingAgents,
  filterNewFiles,
} from '../merge.js';

export async function generateAll(
  projectDir: string,
  profile: StackProfile,
  mergeAction: MergeAction,
  dryRun: boolean,
): Promise<void> {
  const files: GeneratedFile[] = [
    generateClaudeMd(profile),
    generateSettings(profile),
    ...generateAgents(profile),
    ...generateSkills(profile),
    ...generateCommands(profile),
  ];

  if (dryRun) {
    printDryRun(files);
    return;
  }

  if (mergeAction === 'replace') {
    try {
      const backup = await backupClaudeDir(projectDir);
      console.log(`  Backed up existing .claude/ to ${backup}`);
    } catch {
      // No existing directory to back up
    }
  }

  let filesToWrite = files;

  if (mergeAction === 'merge') {
    const existingAgents = await getExistingAgents(projectDir);
    filesToWrite = filterNewFiles(files, existingAgents);

    for (let i = 0; i < filesToWrite.length; i++) {
      const file = filesToWrite[i];
      if (file.path === '.claude/settings.json') {
        filesToWrite[i] = {
          ...file,
          content: await mergeSettingsJson(projectDir, file.content),
        };
      } else if (file.path === 'CLAUDE.md') {
        filesToWrite[i] = {
          ...file,
          content: await mergeClaudeMd(projectDir, file.content),
        };
      }
    }
  }

  for (const file of filesToWrite) {
    const fullPath = join(projectDir, file.path);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, file.content, 'utf-8');
  }

  printSummary(filesToWrite);
}

function printDryRun(files: GeneratedFile[]): void {
  console.log('\n--- DRY RUN ---\n');
  for (const file of files) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`FILE: ${file.path}`);
    console.log('='.repeat(60));
    console.log(file.content);
  }
  console.log('\n--- END DRY RUN (no files written) ---\n');
}

function printSummary(files: GeneratedFile[]): void {
  console.log('\n  Generated files:');
  for (const file of files) {
    console.log(`    ${file.path}`);
  }
  console.log(`\n  Total: ${files.length} files\n`);
}
