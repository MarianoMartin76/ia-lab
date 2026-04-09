#!/usr/bin/env node

import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseJestOutput, parseJestJson } from './analyzers/jest-analyzer.js';
import { parseVitestOutput, parseVitestJson } from './analyzers/vitest-analyzer.js';
import GitHubModelsProvider from './ai-providers/github-models.js';
import ContextGatherer from './utils/context-gatherer.js';
import FixApplier from './applier/fix-applier.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const defaultConfig = {
  ai: {
    provider: 'github-models',
    fallbackProviders: ['ollama', 'openai'],
    maxRetries: 2,
    timeout: 60000
  },
  safety: {
    allowedExtensions: ['.js', '.jsx', '.ts', '.tsx', '.json', '.prisma', '.css'],
    blockPatterns: [/process\.env.*secret/i, /eval\s*\(/, /exec\s*\(/, /require\s*\(['"]/],
    maxFileChanges: 10
  }
};

const args = process.argv.slice(2);
const options = {
  testResults: './test-results',
  contextRoot: '.',
  aiProvider: 'github-models',
  maxAttempts: 3,
  currentAttempt: 1
};

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--test-results' && args[i + 1]) options.testResults = args[i + 1];
  if (args[i] === '--context-root' && args[i + 1]) options.contextRoot = args[i + 1];
  if (args[i] === '--ai-provider' && args[i + 1]) options.aiProvider = args[i + 1];
  if (args[i] === '--max-attempts' && args[i + 1]) options.maxAttempts = parseInt(args[i + 1]);
  if (args[i] === '--current-attempt' && args[i + 1]) options.currentAttempt = parseInt(args[i + 1]);
}

const config = defaultConfig;

console.log('🤖 Auto-Heal Starting...');
console.log(`Attempt: ${options.currentAttempt}/${options.maxAttempts}`);
console.log(`Test results: ${options.testResults}`);
console.log(`Context root: ${options.contextRoot}`);
console.log(`AI Provider: ${options.aiProvider}`);
console.log('');

// Debug: Show what files exist
console.log('📁 Checking test results files...');
console.log(`  test-results exists: ${existsSync(options.testResults)}`);
console.log(`  backend-results.json exists: ${existsSync(join(options.testResults, 'backend-results.json'))}`);
console.log(`  frontend-results.json exists: ${existsSync(join(options.testResults, 'frontend-results.json'))}`);
console.log('');

let allErrors = [];

console.log('📊 Analyzing Backend Tests...');
try {
  const backendLogPath = join(options.testResults, 'backend-output.log');
  const backendJsonPath = join(options.testResults, 'backend-results.json');
  
  if (existsSync(backendJsonPath)) {
    const errors = parseJestJson(backendJsonPath, { readFileSync });
    console.log(`  Found ${errors.length} backend test failures`);
    allErrors.push(...errors.map(e => ({ ...e, backend: true })));
  } else if (existsSync(backendLogPath)) {
    const log = readFileSync(backendLogPath, 'utf-8');
    const errors = parseJestOutput(log);
    console.log(`  Found ${errors.length} backend test failures`);
    allErrors.push(...errors.map(e => ({ ...e, backend: true })));
  }
} catch (e) {
  console.log('  Could not analyze backend tests:', e.message);
}

console.log('📊 Analyzing Frontend Tests...');
try {
  const frontendLogPath = join(options.testResults, 'frontend-output.log');
  const frontendJsonPath = join(options.testResults, 'frontend-results.json');
  
  if (existsSync(frontendJsonPath)) {
    const errors = parseVitestJson(frontendJsonPath, { readFileSync });
    console.log(`  Found ${errors.length} frontend test failures`);
    allErrors.push(...errors.map(e => ({ ...e, backend: false })));
  } else if (existsSync(frontendLogPath)) {
    const log = readFileSync(frontendLogPath, 'utf-8');
    const errors = parseVitestOutput(log);
    console.log(`  Found ${errors.length} frontend test failures`);
    allErrors.push(...errors.map(e => ({ ...e, backend: false })));
  }
} catch (e) {
  console.log('  Could not analyze frontend tests:', e.message);
}

if (allErrors.length === 0) {
  console.log('\n✅ No test failures detected!');
  writeFileSync('heal-result.json', JSON.stringify({ healed: true, attempts: options.currentAttempt }));
  process.exit(0);
}

console.log(`\n📋 Found ${allErrors.length} errors to fix`);
console.log(`Processing first error: ${allErrors[0].file}`);

const contextGatherer = new ContextGatherer(options.contextRoot);
const errorContext = contextGatherer.gatherErrorContext(allErrors[0]);

console.log('🤖 Sending to AI...');
const aiProvider = new GitHubModelsProvider(config.ai);

let fixResult;
try {
  fixResult = await aiProvider.generateFix({
    error: allErrors[0],
    ...errorContext
  });
} catch (e) {
  console.log('❌ AI failed:', e.message);
  fixResult = { success: false, error: e.message };
}

if (!fixResult.success) {
  console.log('❌ Could not generate fix');
  writeFileSync('heal-result.json', JSON.stringify({ 
    healed: false, 
    attempts: options.currentAttempt,
    reason: fixResult.error
  }));
  process.exit(1);
}

console.log('✓ Generated fix:', fixResult.commitMessage || fixResult.commit_message);

const applier = new FixApplier(options.contextRoot, config.safety);
const applyResult = applier.applyFix(fixResult);

if (!applyResult.success) {
  console.log('❌ Could not apply fix:', applyResult.reason);
  writeFileSync('heal-result.json', JSON.stringify({ 
    healed: false, 
    attempts: options.currentAttempt,
    reason: applyResult.reason
  }));
  process.exit(1);
}

console.log('✅ Fix applied successfully!');
console.log('\n📝 Changes:');
console.log(applier.getChangesSummary());

writeFileSync('heal-result.json', JSON.stringify({ 
  healed: true, 
  attempts: options.currentAttempt,
  changes: applier.getChangesSummary(),
  commitMessage: fixResult.commitMessage
}));

console.log('\n✅ Auto-heal completed successfully!');