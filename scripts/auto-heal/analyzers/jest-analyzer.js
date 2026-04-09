export function parseJestOutput(output) {
  const errors = [];
  const lines = output.split('\n');
  
  let currentError = null;
  let inStackTrace = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    const testFailMatch = line.match(/✕.*|FAIL\s+/);
    if (testFailMatch) {
      if (currentError) errors.push(currentError);
      currentError = { type: 'test_failure', messages: [], stack: [] };
      continue;
    }
    
    const locationMatch = line.match(/at\s+(?:.*?\s+)?\(?(.+?):(\d+):(\d+)\)?/);
    if (locationMatch && currentError) {
      currentError.stack.push({
        file: locationMatch[1],
        line: parseInt(locationMatch[2]),
        column: parseInt(locationMatch[3])
      });
      inStackTrace = true;
      continue;
    }
    
    if (inStackTrace && line.trim() === '') {
      inStackTrace = false;
      continue;
    }
    
    const assertionMatch = line.match(/Expected|Received|Difference|Expected.*to equal|expected/i);
    if (assertionMatch && currentError) {
      currentError.messages.push(line.trim());
    }
    
    const errorMatch = line.match(/Error:|AssertionError|TypeError|SyntaxError/);
    if (errorMatch && currentError && !currentError.errorType) {
      currentError.errorType = line.match(/Error: (.*)/)?.[1] || errorMatch[0];
    }
  }
  
  if (currentError) errors.push(currentError);
  
  const jsonMatch = output.match(/\{[\s\S]*"testResults"[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const json = JSON.parse(jsonMatch[0]);
      for (const suite of json.testResults || []) {
        for (const test of suite.assertionResults || []) {
          if (test.status === 'failed') {
            errors.push({
              type: 'assertion_failure',
              file: suite.name,
              test: test.name,
              errorMessage: test.failureMessages?.[0] || 'Test failed',
              stack: test.failureMessages || []
            });
          }
        }
      }
    } catch (e) {}
  }
  
  return errors;
}

export function parseJestJson(jsonFilePath, fs) {
  try {
    const content = fs.readFileSync(jsonFilePath, 'utf-8');
    const results = JSON.parse(content);
    
    const errors = [];
    for (const suite of results.testResults || []) {
      for (const test of suite.assertionResults || []) {
        if (test.status === 'failed') {
          errors.push({
            type: 'assertion_failure',
            file: suite.name,
            test: test.name,
            errorMessage: test.failureMessages?.[0] || 'Test failed',
            stack: test.failureMessages || []
          });
        }
      }
    }
    return errors;
  } catch (e) {
    return [];
  }
}