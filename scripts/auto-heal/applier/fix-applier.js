import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

export class FixApplier {
  constructor(rootPath, safetyConfig = {}) {
    this.rootPath = rootPath;
    this.safety = {
      allowedExtensions: ['.js', '.jsx', '.ts', '.tsx', '.json', '.prisma', '.css'],
      blockPatterns: [/process\.env.*secret/i, /eval\s*\(/, /exec\s*\(/, /require\s*\(['"]/],
      maxFileChanges: 10,
      ...safetyConfig
    };
    this.changes = [];
  }

  validateFix(fix) {
    if (!fix.file) {
      return { valid: false, reason: 'No file specified' };
    }

    const ext = fix.file.substring(fix.file.lastIndexOf('.'));
    if (!this.safety.allowedExtensions.includes(ext)) {
      return { valid: false, reason: `Extension ${ext} not allowed` };
    }

    for (const pattern of this.safety.blockPatterns) {
      if (pattern.test(fix.changes || '')) {
        return { valid: false, reason: `Pattern ${pattern} blocked for security` };
      }
    }

    const fullPath = join(this.rootPath, fix.file);
    if (!existsSync(fullPath)) {
      return { valid: false, reason: `File ${fix.file} does not exist` };
    }

    return { valid: true };
  }

  applyFix(fix) {
    const validation = this.validateFix(fix);
    if (!validation.valid) {
      console.log(`Skipping ${fix.file}: ${validation.reason}`);
      return { success: false, reason: validation.reason };
    }

    try {
      const fullPath = join(this.rootPath, fix.file);
      const originalContent = readFileSync(fullPath, 'utf-8');
      
      let newContent;
      
      // Enhanced logic for handling test file fixes
      const isTestFile = fix.file.includes('.test.') || fix.file.includes('.spec.');
      
      if (fix.replaceFrom) {
        // Try exact match first
        if (originalContent.includes(fix.replaceFrom)) {
          newContent = originalContent.replace(fix.replaceFrom, fix.changes);
        } else {
          // Try normalized (remove extra whitespace for matching)
          const normalizedReplace = fix.replaceFrom.replace(/\s+/g, ' ').trim();
          const normalizedContent = originalContent.replace(/\s+/g, ' ');
          if (normalizedContent.includes(normalizedReplace)) {
            newContent = originalContent.replace(
              new RegExp(this.escapeRegex(fix.replaceFrom), 'g'),
              fix.changes
            );
          } else {
            // Last resort: append
            console.log(`Warning: replaceFrom not found exactly, appending to file`);
            newContent = originalContent + '\n' + fix.changes;
          }
        }
      } else if (fix.changes) {
        // For test files, try to insert in appropriate location
        if (isTestFile) {
          // For test files, check if we need to add import or fix assertion
          newContent = this.insertTestFix(originalContent, fix.changes);
        } else {
          // For source files, append at end or insert after last export
          newContent = this.insertSourceFix(originalContent, fix.changes);
        }
      } else {
        return { success: false, reason: 'No changes specified' };
      }

      const dir = dirname(fullPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      writeFileSync(fullPath, newContent, 'utf-8');
      
      this.changes.push({
        file: fix.file,
        originalLength: originalContent.length,
        newLength: newContent.length,
        isTestFile
      });

      console.log(`✓ Applied fix to ${fix.file}${isTestFile ? ' (test file)' : ''}`);
      return { success: true, file: fix.file };
    } catch (error) {
      console.error(`Error applying fix to ${fix.file}:`, error.message);
      return { success: false, reason: error.message };
    }
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  insertTestFix(originalContent, newCode) {
    // For test fixes, analyze what kind of fix it is
    
    // Case 1: Adding new test case - insert before closing of last describe/test
    if (newCode.includes('test(') || newCode.includes('it(') || newCode.includes('describe(')) {
      // Find the last test block and insert before its closing
      const lastTestMatch = originalContent.match(/(test|it|describe)\([^)]+\)[^{]*\{[^}]*$/m);
      if (lastTestMatch) {
        // Insert after the last test/describe block
        const insertPos = originalContent.lastIndexOf('}');
        if (insertPos > 0) {
          return originalContent.substring(0, insertPos) + '\n' + newCode + originalContent.substring(insertPos);
        }
      }
    }
    
    // Case 2: Fixing existing assertion - try to find and replace getByText
    if (newCode.includes('getByText') || newCode.includes('findByText')) {
      // Look for incorrect getByText call
      const textMatch = newCode.match(/getByText\(['"]([^'"]+)['"]\)/);
      if (textMatch) {
        const wrongText = textMatch[1];
        const pattern = new RegExp(`getByText\\(['"]${this.escapeRegex(wrongText)}['"]\\)`);
        if (pattern.test(originalContent)) {
          return originalContent.replace(pattern, newCode.match(/getByText\([^)]+\)/)?.[0] || newCode);
        }
      }
    }
    
    // Default: append at end
    return originalContent + '\n' + newCode;
  }

  insertSourceFix(originalContent, newCode) {
    // For source code, try to add after last export or at end
    const lastExport = originalContent.match(/export\s+(default\s+)?(?:function|class|const|let|var)/);
    if (lastExport) {
      // Find end of last export
      const exportEnd = originalContent.lastIndexOf('}');
      if (exportEnd > 0) {
        return originalContent.substring(0, exportEnd + 1) + '\n' + newCode + '\n' + originalContent.substring(exportEnd + 1);
      }
    }
    return originalContent + '\n' + newCode;
  }

  verifySyntax(file) {
    try {
      const ext = file.substring(file.lastIndexOf('.'));
      
      if (ext === '.js' || ext === '.jsx') {
        require('child_process').execSync(
          `node --check "${join(this.rootPath, file)}"`,
          { cwd: this.rootPath, stdio: 'pipe' }
        );
      }
      
      return { valid: true };
    } catch (error) {
      return { valid: false, reason: error.message };
    }
  }

  getChangesSummary() {
    return {
      totalFiles: this.changes.length,
      files: this.changes.map(c => c.file)
    };
  }
}

export default FixApplier;