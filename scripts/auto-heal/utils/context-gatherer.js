import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

function normalizePath(file) {
  if (!file) return '';
  if (file.startsWith('/home/runner/') || file.startsWith('C:\\')) {
    const match = file.match(/ia-lab\/ia-lab\/(.+)$/);
    if (match) return match[1];
  }
  return file;
}

export class ContextGatherer {
  constructor(rootPath) {
    this.rootPath = rootPath;
  }

  gatherErrorContext(error) {
    const context = {
      sourceCode: null,
      testCode: null,
      spec: null,
      config: {},
      errorFile: error.file,
      isTestError: error.errorType?.includes('TestingLibrary') || error.errorMessage?.includes('Unable to find')
    };

    const errorFile = normalizePath(error.file);
    console.log(`  Error file from parser: ${error.file}`);
    console.log(`  Normalized error file: ${errorFile}`);
    console.log(`  Is test error: ${context.isTestError}`);

    if (context.isTestError && errorFile) {
      const directTestPath = join(this.rootPath, errorFile);
      if (existsSync(directTestPath)) {
        try {
          context.testCode = readFileSync(directTestPath, 'utf-8');
          context.testFile = errorFile;
          context.sourceFile = errorFile;
          context.sourceCode = context.testCode;
          console.log(`  ✓ Direct test file read: ${errorFile}`);
          return context;
        } catch (e) {
          console.log(`  Could not read direct test file: ${e.message}`);
        }
      }
    }

    const testFilePatterns = [
      errorFile.includes('tests/') || errorFile.includes('.test.') ? errorFile : null,
      errorFile.includes('/src/') ? errorFile.replace('/src/', '/tests/') : null,
      errorFile.replace(/\.(js|jsx|ts|tsx)$/, '.test.$1'),
      errorFile.replace(/\.(js|jsx|ts|tsx)$/, '.spec.$1'),
      errorFile.replace('.component.', '.test.'),
      errorFile.startsWith('tests/') ? errorFile : null,
      errorFile.includes('/tests/') ? errorFile : null,
    ].filter(Boolean);

    for (const testPath of testFilePatterns) {
      if (testPath) {
        const fullTestPath = join(this.rootPath, testPath);
        if (existsSync(fullTestPath)) {
          try {
            context.testCode = readFileSync(fullTestPath, 'utf-8');
            context.testFile = testPath;
            console.log(`  Found test file: ${testPath}`);
            break;
          } catch (e) {
            console.log(`  Could not read test file ${testPath}: ${e.message}`);
          }
        }
      }
    }

    if (errorFile) {
      const fullPath = join(this.rootPath, errorFile);
      if (existsSync(fullPath)) {
        try {
          context.sourceCode = readFileSync(fullPath, 'utf-8');
          context.sourceFile = errorFile;
          context.testCode = context.sourceCode;
          console.log(`  ✓ Read source file: ${errorFile}`);
        } catch (e) {
          console.error('Could not read source file:', e.message);
        }
      } else {
        console.log(`  File ${errorFile} not found, searching...`);
      }
    }

    const specPath = join(this.rootPath, 'SPEC.md');
    if (existsSync(specPath)) {
      try {
        context.spec = readFileSync(specPath, 'utf-8').substring(0, 5000);
      } catch (e) {}
    }

    const configFiles = ['backend/package.json', 'frontend/package.json', 'backend/prisma/schema.prisma'];
    for (const configFile of configFiles) {
      const fullPath = join(this.rootPath, configFile);
      if (existsSync(fullPath)) {
        try {
          context.config[configFile] = readFileSync(fullPath, 'utf-8').substring(0, 2000);
        } catch (e) {}
      }
    }

    try {
      context.gitHistory = execSync('git log --oneline -5', { cwd: this.rootPath, encoding: 'utf-8' });
    } catch (e) {}

    return context;
  }
}

export default ContextGatherer;