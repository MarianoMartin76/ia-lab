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
      config: {}
    };

    if (error.file) {
      const fullPath = join(this.rootPath, error.file);
      if (existsSync(fullPath)) {
        try {
          context.sourceCode = readFileSync(fullPath, 'utf-8');
          context.sourceFile = error.file;
        } catch (e) {
          console.error('Could not read source file:', e.message);
        }
      }
    }

    const testPatterns = [
      error.file?.replace('/src/', '/tests/'),
      error.file?.replace('.js', '.test.js'),
      error.file?.replace('.jsx', '.test.jsx'),
    ];
    
    for (const testPath of testPatterns || []) {
      if (testPath && existsSync(join(this.rootPath, testPath))) {
        try {
          context.testCode = readFileSync(join(this.rootPath, testPath), 'utf-8');
          context.testFile = testPath;
          break;
        } catch (e) {}
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