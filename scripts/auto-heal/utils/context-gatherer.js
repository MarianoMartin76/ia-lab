import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

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

    console.log(`  Error file from parser: ${error.file}`);
    console.log(`  Is test error: ${context.isTestError}`);

    // Priority: If this is a TestingLibrary error, the test FILE should be read directly
    // The error.file might actually be the test file already in many cases
    if (context.isTestError && error.file) {
      // Direct test file path
      const directTestPath = join(this.rootPath, error.file);
      if (existsSync(directTestPath)) {
        try {
          context.testCode = readFileSync(directTestPath, 'utf-8');
          context.testFile = error.file;
          context.sourceFile = error.file;
          context.sourceCode = context.testCode; // Use test code as source for test errors
          console.log(`  ✓ Direct test file read: ${error.file}`);
          return context;
        } catch (e) {
          console.log(`  Could not read direct test file: ${e.message}`);
        }
      }
    }

    // Enhanced: Better test file detection
    const errorFile = error.file || '';
    const testFilePatterns = [
      // Direct test file from error (most likely)
      errorFile.includes('tests/') || errorFile.includes('.test.') ? errorFile : null,
      // Common patterns for test files
      errorFile.includes('/src/') ? errorFile.replace('/src/', '/tests/') : null,
      errorFile.replace(/\.(js|jsx|ts|tsx)$/, '.test.$1'),
      errorFile.replace(/\.(js|jsx|ts|tsx)$/, '.spec.$1'),
      errorFile.replace('.component.', '.test.'),
      // For frontend/tests/Button.test.jsx case - the test file IS the error file
      errorFile.startsWith('tests/') ? errorFile : null,
    ].filter(Boolean);

    // Try to find and read the test file
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

    // Read the source file (the one mentioned in the error)
    if (error.file) {
      const fullPath = join(this.rootPath, error.file);
      if (existsSync(fullPath)) {
        try {
          context.sourceCode = readFileSync(fullPath, 'utf-8');
          context.sourceFile = error.file;
        } catch (e) {
          console.error('Could not read source file:', e.message);
        }
      } else {
        // File might be in a different location, try common patterns
        console.log(`  File ${error.file} not found directly, searching...`);
      }
    }

    const specPath = join(this.rootPath, 'SPEC.md');
    if (existsSync(specPath)) {
      try {
        const specContent = readFileSync(specPath, 'utf-8');
        context.spec = specContent.substring(0, 5000);
      } catch (e) {}
    }

    const configFiles = ['backend/package.json', 'frontend/package.json', 'backend/prisma/schema.prisma'];
    for (const configFile of configFiles) {
      const fullPath = join(this.rootPath, configFile);
      if (existsSync(fullPath)) {
        try {
          const content = readFileSync(fullPath, 'utf-8');
          context.config[configFile] = content.substring(0, 2000);
        } catch (e) {}
      }
    }

    try {
      const gitLog = execSync('git log --oneline -5', { cwd: this.rootPath, encoding: 'utf-8' });
      context.gitHistory = gitLog;
    } catch (e) {}

    return context;
  }
}

export default ContextGatherer;