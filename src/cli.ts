import { Command } from 'commander';
import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import { detectStack } from './detectors/index.js';
import { promptMissingFields } from './interactive.js';
import { confirmStack, printStackSummary } from './confirm.js';
import { determineMergeAction } from './merge.js';
import { generateAll } from './generators/index.js';

const pkg = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf-8')
);

const program = new Command()
  .name('cc-init')
  .description('Scan a project and generate best-practice .claude/ configuration for Claude Code')
  .version(pkg.version)
  .argument('[project-dir]', 'Project directory to scan', '.')
  .option('--dry-run', 'Preview generated files without writing', false)
  .option('-y, --yes', 'Skip confirmation prompts', false)
  .option('-f, --force', 'Replace existing .claude/ without prompting', false)
  .action(async (projectDir: string, opts: { dryRun: boolean; yes: boolean; force: boolean }) => {
    const dir = resolve(projectDir);

    console.log(`\n  Scanning ${dir}...\n`);

    let profile = await detectStack(dir);

    if (profile.language === 'none') {
      if (opts.yes) {
        console.error('  Error: No tech stack detected and --yes flag prevents interactive input.');
        process.exit(1);
      }
      console.log('  No tech stack detected from project files.');
      profile = await promptMissingFields(profile);
    }

    if (opts.yes) {
      printStackSummary(profile);
    } else {
      const confirmed = await confirmStack(profile);
      if (!confirmed) {
        profile = await promptMissingFields(profile);
        const reconfirmed = await confirmStack(profile);
        if (!reconfirmed) {
          console.log('  Aborted.');
          process.exit(0);
        }
      }
    }

    const mergeAction = opts.dryRun
      ? 'replace' as const
      : await determineMergeAction(dir, opts.force);

    if (mergeAction === 'skip') {
      console.log('  Skipped. No changes made.');
      process.exit(0);
    }

    await generateAll(dir, profile, mergeAction, opts.dryRun);

    if (!opts.dryRun) {
      console.log('  Done! Your .claude/ directory is ready for Claude Code.\n');
    }
  });

program.parse();
