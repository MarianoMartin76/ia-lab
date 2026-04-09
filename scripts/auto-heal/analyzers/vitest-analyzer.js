export function parseVitestOutput(output) {
  const errors = [];
  const lines = output.split('\n');
  
  let currentError = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Enhanced: Detect TestingLibrary errors specifically
    const testingLibMatch = line.match(/TestingLibraryElementError:|Unable to find|Vue Testing Library/);
    if (testingLibMatch) {
      currentError = { 
        type: 'testing_library_error', 
        errorType: 'TestingLibraryElementError',
        messages: [line.trim()],
        stack: [] 
      };
      continue;
    }
    
    const testFailMatch = line.match(/FAIL|×|failed/i);
    if (testFailMatch && !currentError) {
      currentError = { type: 'test_failure', messages: [], stack: [] };
      continue;
    }
    
    // Enhanced: Capture full error message for TestingLibrary
    if (currentError?.type === 'testing_library_error' && line.trim()) {
      // Get lines until we hit the stack or blank line
      if (!line.match(/^\s*(at|✓|×|passed|failed)/)) {
        currentError.messages.push(line.trim());
      }
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
    
    const assertionMatch = line.match(/Expected|Received|Assertion.*failed|diff/);
    if (assertionMatch && currentError) {
      currentError.messages.push(line.trim());
    }
    
    // Enhanced: More comprehensive error type detection
    const errorMatch = line.match(/Error:|AssertionError|TypeError|SyntaxError|ReferenceError/);
    if (errorMatch && currentError && !currentError.errorType) {
      currentError.errorType = line.match(/Error: (.*)/)?.[1] || errorMatch[0];
    }
    
    if (line.includes('✓') || line.includes('passed')) {
      if (currentError && currentError.type !== 'testing_library_error') {
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
                errorType: test.message?.includes('Unable to find') ? 'TestingLibraryElementError' : 'AssertionError',
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
    
    console.log('  Parsing Vitest JSON, keys:', Object.keys(results));
    
    const errors = [];
    
    // Handle Jest/Vitest JSON format - testResults at root level
    if (results.testResults && Array.isArray(results.testResults)) {
      console.log(`  Found ${results.testResults.length} test suites`);
      
      for (const suite of results.testResults) {
        // Vitest/Jest format
        const tests = suite.assertionResults || suite.tests || [];
        
        for (const test of tests) {
          if (test.status === 'failed' || test.status === 'fail') {
            const errorMessage = test.message || test.failureMessages?.[0] || '';
            const errorType = errorMessage.includes('Unable to find') ? 'TestingLibraryElementError' : 'AssertionError';
            
            const file = suite.name || suite.file || 'unknown';
            const testName = test.fullName || test.name || 'Unknown test';
            
            errors.push({
              type: 'assertion_failure',
              file: file,
              test: testName,
              errorMessage: errorMessage,
              errorType: errorType,
              stack: test.failureMessages || []
            });
          }
        }
      }
    }
    
    // Handle Vitest 1.x format - testResults array
    if (results.testResults && Array.isArray(results.testResults)) {
      const suites = results.testResults;
      for (const suite of suites) {
        const tests = suite.tests || suite.assertions || [];
        for (const test of tests) {
          if (test.status === 'fail' || test.state === 'fail') {
            const errorMessage = test.message || test.error?.message || test.shortMessage || '';
            const errorType = test.error?.name || 
              (errorMessage.includes('Unable to find') ? 'TestingLibraryElementError' : 
               errorMessage.includes('AssertionError') ? 'AssertionError' : 'TestError');
            
            const file = suite.file || suite.name || test.file || 'unknown';
            const testName = test.name || test.fullName || test.description || 'Unknown test';
            const stack = test.stack || test.error?.stack || [];
            
            errors.push({
              type: 'assertion_failure',
              file: file,
              test: testName,
              errorMessage: errorMessage,
              errorType: errorType,
              stack: Array.isArray(stack) ? stack : [stack]
            });
          }
        }
      }
    }
    
    // Handle Vitest 2.x format - roots with file paths
    if (results.results && Array.isArray(results.results)) {
      for (const result of results.results) {
        if (result.state === 'fail' || result.status === 'fail') {
          const errorMessage = result.message || result.error?.message || '';
          const errorType = result.error?.name || 
            (errorMessage.includes('Unable to find') ? 'TestingLibraryElementError' : 'TestError');
          
          errors.push({
            type: 'assertion_failure',
            file: result.file || 'unknown',
            test: result.name || 'Unknown test',
            errorMessage: errorMessage,
            errorType: errorType,
            stack: result.stack || []
          });
        }
      }
    }
    
    console.log(`  Total errors found: ${errors.length}`);
    return errors;
  } catch (e) {
    console.error('Error parsing Vitest JSON:', e.message);
    return [];
  }
}