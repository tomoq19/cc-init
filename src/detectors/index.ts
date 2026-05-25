import { scanManifests } from './manifest.js';
import { detectPackageManager } from './lockfile.js';
import { detectNode } from './node.js';
import { detectPython } from './python.js';
import { detectTooling } from './tooling.js';
import { emptyStackProfile, type Language, type StackProfile } from '../types.js';

export async function detectStack(projectDir: string): Promise<StackProfile> {
  const { files, dirs } = await scanManifests(projectDir);
  const profile = emptyStackProfile();

  const nodeResult = detectNode(files);
  const pythonResult = detectPython(files);
  const tooling = await detectTooling(projectDir, files, dirs);

  if (nodeResult) {
    const hasTsConfig = files['tsconfig.json']?.exists ?? false;
    profile.language = (hasTsConfig ? 'typescript' : 'javascript') as Language;
    profile.framework = nodeResult.framework;
    profile.detectedTools = {
      ...profile.detectedTools,
      ...nodeResult.tools,
    };
    profile.packageManager = await detectPackageManager(projectDir, true);
  } else if (pythonResult) {
    profile.language = 'python';
    profile.framework = pythonResult.framework;
    profile.packageManager = pythonResult.packageManager;
    profile.detectedTools.formatter = pythonResult.formatter;
    profile.detectedTools.linter = pythonResult.linter;
  } else if (files['go.mod']?.exists) {
    profile.language = 'go';
    profile.packageManager = 'go';
    profile.detectedTools.formatter = 'gofmt';
    profile.detectedTools.linter = 'golangci-lint';
  } else if (files['Cargo.toml']?.exists) {
    profile.language = 'rust';
    profile.packageManager = 'cargo';
    profile.detectedTools.formatter = 'rustfmt';
    profile.detectedTools.linter = 'clippy';
  } else if (files['build.gradle']?.exists || files['build.gradle.kts']?.exists) {
    const content = files['build.gradle']?.content ?? files['build.gradle.kts']?.content ?? '';
    profile.language = content.includes('kotlin') ? 'kotlin' : 'java';
    profile.packageManager = 'gradle';
  } else if (files['pom.xml']?.exists) {
    profile.language = 'java';
    profile.packageManager = 'maven';
  } else if (files['Gemfile']?.exists) {
    profile.language = 'ruby';
    profile.packageManager = 'bundler';
    profile.detectedTools.linter = 'rubocop';
  } else if (files['pubspec.yaml']?.exists) {
    profile.language = 'dart';
    profile.packageManager = 'pub';
    profile.detectedTools.formatter = 'dart-format';
    profile.detectedTools.linter = 'dart-analyze';
  } else if (files['Package.swift']?.exists) {
    profile.language = 'swift';
    profile.packageManager = 'spm';
    profile.detectedTools.formatter = 'swift-format';
  } else if (files['composer.json']?.exists) {
    profile.language = 'php';
    profile.packageManager = 'composer';
  }

  profile.testFramework = tooling.testFramework;
  profile.e2eFramework = tooling.e2eFramework;
  profile.orm = tooling.orm;
  profile.cssTooling = tooling.cssTooling;
  profile.ci = tooling.ci;
  profile.monorepo = tooling.monorepo;
  profile.database = tooling.database;

  return profile;
}
