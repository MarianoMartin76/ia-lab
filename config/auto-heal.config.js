export default {
  ai: {
    provider: process.env.AI_PROVIDER || 'github-models',
    fallbackProviders: ['ollama', 'openai'],
    maxRetries: 2,
    timeout: 60000
  },
  retry: {
    maxAttempts: 3,
    backoffMs: 5000,
    stopOnManualReview: true
  },
  scope: {
    backendPaths: ['backend/src/**', 'backend/tests/**'],
    frontendPaths: ['frontend/src/**', 'frontend/tests/**'],
    excludePaths: ['**/node_modules/**', '**/dist/**', '**/*.log']
  },
  safety: {
    requireTests: true,
    blockDestructiveChanges: true,
    maxFileChanges: 10,
    allowedExtensions: ['.js', '.jsx', '.ts', '.tsx', '.json', '.prisma'],
    blockPatterns: ['process\\.env', 'fs\\.writeFile.*outside', 'eval\\(', 'exec\\(']
  },
  logging: {
    level: 'info',
    outputFile: 'auto-heal.log'
  },
  git: {
    branchPrefix: 'auto-heal',
    commitAuthor: 'github-actions[bot]',
    commitEmail: 'github-actions[bot]@users.noreply.github.com'
  }
};