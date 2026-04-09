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
    this.model = config.model || 'gpt-4o-mini';
    this.timeout = config.timeout || 60000;
  }

  async generateFix(context) {
    const prompt = this.buildPrompt(context);
    
    try {
      const response = await fetch(
        'https://models.inference.ai.azure.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
            'Content-Type': 'application/json'
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
    
    let prompt = `TEST FAILURE:
- File: ${error.file}
- Test: ${error.test || 'N/A'}
- Error: ${error.errorMessage || error.messages?.join(' ') || 'Test failed'}
- Stack: ${error.stack?.[0] || 'N/A'}

`;

    if (sourceCode) {
      prompt += `SOURCE CODE:\n\`\`\`javascript\n${sourceCode}\n\`\`\`\n\n`;
    }
    
    if (testCode) {
      prompt += `TEST CODE:\n\`\`\`javascript\n${testCode}\n\`\`\`\n\n`;
    }
    
    if (spec) {
      prompt += `SPEC.md CONTEXT:\n${spec}\n\n`;
    }

    prompt += `Generate a fix in JSON format.`;
    
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