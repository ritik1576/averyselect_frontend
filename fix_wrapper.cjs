const fs = require('fs');
const path = 'src/pages/CandidatePortal/CandidateTestRunner.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldCode = `    for (const tc of publicTestCases) {
      let wrappedCode = '';
      if (currentLangKey === 'python') {
        wrappedCode = \`
\${code}
import sys
try:
  if 'solution' in locals() and callable(locals()['solution']):
      result = solution(\${tc.input})
      import json
      print("\\n---AGY_RESULT_DELIM---\\n" + (json.dumps(result) if isinstance(result, (dict, list, tuple)) else str(result).lower() if isinstance(result, bool) else str(result)), end='')
  else:
      pass
except Exception as e:
  print(e)
\`;
      } else {
        wrappedCode = \`
\${code}
try {
  let __fn = null;
  if (typeof module !== 'undefined' && typeof module.exports === 'function') {
    __fn = module.exports;
  } else if (typeof solution === 'function') {
    __fn = solution;
  }
  
  if (__fn) {
    const result = __fn(\${tc.input});
    if (result !== undefined) {
      process.stdout.write("\\n---AGY_RESULT_DELIM---\\n" + (typeof result === 'object' ? JSON.stringify(result) : String(result)));
    }
  } else {
    // If no function, assume they are just printing or we gracefully ignore
  }
} catch (e) {
  process.stdout.write(e.toString());
}
\`;
      }`;

const newCode = `    let fnName = 'solution';
    const pyMatch = code.match(/def\\s+([a-zA-Z0-9_]+)\\s*\\(/);
    const jsMatch = code.match(/(?:function\\s+([a-zA-Z0-9_]+)\\s*\\()|(?:(?:const|let|var)\\s+([a-zA-Z0-9_]+)\\s*=\\s*(?:function|\\(.*=>|.*=>))/);
    if (currentLangKey === 'python' && pyMatch) {
      fnName = pyMatch[1];
    } else if (jsMatch) {
      fnName = jsMatch[1] || jsMatch[2] || 'solution';
    }

    for (const tc of publicTestCases) {
      let wrappedCode = '';
      if (currentLangKey === 'python') {
        wrappedCode = \`
\${code}
import sys
import json
try:
  fn_name = '\${fnName}'
  fn = locals().get(fn_name)
  if fn and callable(fn):
      args = \${tc.input}
      if isinstance(args, list) and not fn_name.startswith('solution'): # If user wrote custom function, spread args
          result = fn(*args)
      else:
          result = fn(args)
      print("\\n---AGY_RESULT_DELIM---\\n" + (json.dumps(result) if isinstance(result, (dict, list, tuple)) else str(result).lower() if isinstance(result, bool) else str(result)), end='')
  else:
      pass
except Exception as e:
  print(e)
\`;
      } else {
        wrappedCode = \`
\${code}
try {
  let __fn = null;
  if (typeof module !== 'undefined' && typeof module.exports === 'function') {
    __fn = module.exports;
  } else if (typeof \${fnName} === 'function') {
    __fn = \${fnName};
  }
  
  if (__fn) {
    let args = \${tc.input};
    const result = Array.isArray(args) ? __fn(...args) : __fn(args);
    if (result !== undefined) {
      process.stdout.write("\\n---AGY_RESULT_DELIM---\\n" + (typeof result === 'object' ? JSON.stringify(result) : String(result)));
    }
  } else {
    // Fallback if we couldn't parse the function properly
    // Maybe they just used console.log inside
  }
} catch (e) {
  process.stdout.write(e.toString());
}
\`;
      }`;

content = content.replace(oldCode, newCode);
fs.writeFileSync(path, content);
