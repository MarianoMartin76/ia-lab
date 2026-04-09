import { readFileSync } from 'fs';
import { join } from 'path';

const SYSTEM_PROMPT = `You are a senior full-stack developer specializing in fixing test failures.
Your task is to analyze test failures and generate precise code fixes.

Guidelines:
1. Only output JSON with the fix, no explanations
2. Fix should make the test pass
3. Follow existing code patterns in the project
4. Maintain API contracts
5. No security vulnerabilities
6. No new dependencies

Response format:
{
  "file": "path/to/file",
  "changes": "exact code to add/replace",
  "replaceFrom": "optional - code to replace (for replacements)",
  "commitMessage": "fix: description"
}`;

export class GitHubModelsProvider {
  constructor(config = {}) {
    this.model = config.model || 'openai/gpt-4o-mini';
    this.timeout = config.timeout || 60000;
  }

  async generateFix(context) {
    const prompt = this.buildPrompt(context);
    
    try {
      const response = await fetch(
        'https://models.github.ai/inference/chat/completions',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28'
          },
          body: JSON.stringify({
            model: this.model,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: prompt }
            ],
            temperature: 0.2,
            max_tokens: 2000
          }),
          signal: AbortSignal.timeout(this.timeout)
        }
      );

      if (!response.ok) {
        throw new Error(`GitHub Models API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      
      return this.parseFixResponse(content);
    } catch (error) {
      console.error('GitHub Models error:', error.message);
      throw error;
    }
  }

  buildPrompt(context) {
    const { error, sourceCode, testCode, spec } = context;
    
    // Enhanced error analysis
    const errorType = error.errorType || error.type || 'Unknown';
    const errorMessage = error.errorMessage || error.messages?.join('\n') || 'Test failed';
    const stackInfo = error.stack?.[0] || '';
    const testName = error.test || '';
    
    let prompt = `# Test Failure Analysis and Fix

## Error Details
- **Error Type**: ${errorType}
- **Test Name**: ${testName || 'N/A'}
- **Source File**: ${error.file || 'Unknown'}

### Exact Error Message:
\`\`\`
${errorMessage}
\`\`\`

### Stack Trace:
${stackInfo || 'N/A'}

`;

    // Determine if this is a test code issue vs source code issue
    const isLikelyTestIssue = 
      errorType.includes('TestingLibrary') || 
      errorType.includes('AssertionError') ||
      errorMessage.includes('Unable to find') ||
      errorMessage.includes('expected') ||
      errorMessage.includes('received');
    
    if (isLikelyTestIssue) {
      prompt += `## Analysis
This appears to be a TEST CODE issue (not a bug in the application code). 
The test is either:
1. Looking for wrong text (typo in test assertion)
2. Missing element in component being tested
3. Wrong selector/query used
4. Component not rendering expected content

`;
    } else {
      prompt += `## Analysis
This appears to be an APPLICATION CODE issue (the source code has a bug).
The test is correctly catching an error in the production code.
`;
    }

    if (sourceCode) {
      prompt += `## Source Code (${error.file})
\`\`\`
${sourceCode}
\`\`\`
`;
    }
    
    if (testCode) {
      prompt += `## Test Code
\`\`\`
${testCode}
\`\`\`
`;
    }
    
    if (spec) {
      prompt += `## SPEC.md Requirements
\`\`\`
${spec.substring(0, 3000)}
\`\`\`
`;
    }

    prompt += `
## Fix Instructions
1. If this is a TEST CODE issue (like a typo in test text), FIX THE TEST FILE
2. If this is an APPLICATION CODE issue, fix the source file
3. Output ONLY a JSON object with the fix details

Response format:
{
  "file": "path/to/file-to-fix",
  "changes": "exact code replacement or addition",
  "replaceFrom": "optional - exact code to replace (include surrounding context for uniqueness)",
  "commitMessage": "fix: brief description of what was fixed"
}`;
    
    return prompt;
  }

  parseFixResponse(content) {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          file: parsed.file,
          changes: parsed.changes || parsed.code,
          replaceFrom: parsed.replaceFrom,
          commitMessage: parsed.commitMessage || parsed.commit_message || 'fix: test failure'
        };
      }
    } catch (e) {
      console.error('Failed to parse fix response:', e);
    }
    
    return { success: false, error: 'Could not parse fix response' };
  }
}

export default GitHubModelsProvider;