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
      
      if (fix.replaceFrom) {
        if (originalContent.includes(fix.replaceFrom)) {
          newContent = originalContent.replace(fix.replaceFrom, fix.changes);
        } else {
          newContent = originalContent + '\n' + fix.changes;
        }
      } else if (fix.changes) {
        newContent = originalContent + '\n' + fix.changes;
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
        newLength: newContent.length
      });

      console.log(`✓ Applied fix to ${fix.file}`);
      return { success: true, file: fix.file };
    } catch (error) {
      console.error(`Error applying fix to ${fix.file}:`, error.message);
      return { success: false, reason: error.message };
    }
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