export function parseVitestOutput(output) {
  const errors = [];
  const lines = output.split('\n');
  
  let currentError = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    const testFailMatch = line.match(/FAIL|×|failed/i);
    if (testFailMatch && !currentError) {
      currentError = { type: 'test_failure', messages: [], stack: [] };
      continue;
    }
    
    const locationMatch = line.match(/at\s+(?:.*?\s+)?\(?(.+?):(\d+):(\d+)\)?/);
    if (locationMatch) {
      if (!currentError) {
        currentError = { type: 'test_failure', messages: [], stack: [] };
      }
      currentError.stack.push({
        file: locationMatch[1],
        line: parseInt(locationMatch[2]),
        column: parseInt(locationMatch[3])
      });
      continue;
    }
    
    const assertionMatch = line.match(/Expected|Received|Assertion.*failed|diff/i);
    if (assertionMatch && currentError) {
      currentError.messages.push(line.trim());
    }
    
    if (line.includes('Error:') && currentError && !currentError.errorType) {
      currentError.errorType = line.replace('Error:', '').trim();
    }
    
    if (line.includes('✓') || line.includes('passed')) {
      if (currentError) {
        errors.push(currentError);
        currentError = null;
      }
    }
  }
  
  if (currentError) errors.push(currentError);
  
  const jsonMatch = output.match(/\{[\s\S]*"testResults"[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const json = JSON.parse(jsonMatch[0]);
      if (json.testResults) {
        for (const suite of json.testResults) {
          for (const test of suite.tests || []) {
            if (test.status === 'fail') {
              errors.push({
                type: 'assertion_failure',
                file: suite.file,
                test: test.name,
                errorMessage: test.message,
                stack: test.stack || []
              });
            }
          }
        }
      }
    } catch (e) {}
  }
  
  return errors;
}

export function parseVitestJson(jsonFilePath, fs) {
  try {
    const content = fs.readFileSync(jsonFilePath, 'utf-8');
    const results = JSON.parse(content);
    
    const errors = [];
    const suites = results.testResults || results.suites || [];
    
    for (const suite of suites) {
      for (const test of suite.tests || []) {
        if (test.status === 'fail') {
          errors.push({
            type: 'assertion_failure',
            file: suite.file || test.file,
            test: test.name,
            errorMessage: test.message,
            stack: test.stack || []
          });
        }
      }
    }
    return errors;
  } catch (e) {
    return [];
  }
}