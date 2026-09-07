export interface ExecutionResult {
  stdout: string;
  stderr: string;
  output: string;
  exitCode: number;
  executionTimeMs?: number;
  memoryKb?: number;
  language: string;
  statusDescription: string;
  error?: string;
}

// Judge0 Language ID Mapping (Verified active IDs on ce.judge0.com)
const JUDGE0_LANGUAGE_MAP: Record<string, { id: number; label: string }> = {
  javascript: { id: 97,  label: 'JavaScript (Node.js v20)' },
  python:     { id: 100, label: 'Python (v3.12)' },
  cpp:        { id: 105, label: 'C++ (GCC v14.1)' },
  java:       { id: 91,  label: 'Java (JDK v17)' },
  sql:        { id: 82,  label: 'SQL (SQLite 3)' },
};

/**
 * Executes code live using Judge0 Open Community API (ce.judge0.com)
 */
export async function executeCode(
  langKey: string,
  code: string,
  stdin: string = ''
): Promise<ExecutionResult> {
  const langConfig = JUDGE0_LANGUAGE_MAP[langKey] || JUDGE0_LANGUAGE_MAP.javascript;
  const startTime = performance.now();

  let retries = 3;
  let delay = 1500;
  
  while (retries > 0) {
    try {
      const response = await fetch('https://ce.judge0.com/submissions?wait=true', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_code: code,
          language_id: langConfig.id,
          stdin: stdin,
        }),
      });

      const duration = Math.round(performance.now() - startTime);

      if (response.status === 429) {
          retries--;
          await new Promise(r => setTimeout(r, delay));
          delay *= 2;
          continue;
      }

      if (!response.ok) {
        const errText = await response.text();
        let parsedErr = errText;
        try { parsedErr = JSON.parse(errText).message || errText; } catch {}
        
        return {
          stdout: '',
          stderr: parsedErr,
          output: parsedErr,
          exitCode: 1,
          language: langConfig.label,
          statusDescription: 'API Error',
        };
      }

      const data = await response.json();
      
      const stdout = data.stdout || '';
      const compileOutput = data.compile_output || '';
      const stderr = data.stderr || compileOutput || data.message || '';
      const exitCode = data.status?.id === 3 ? 0 : (data.status?.id || 1);
      
      const output = stdout ? (stderr ? `${stdout}\n\nErrors:\n${stderr}` : stdout) : stderr;

      return {
        stdout,
        stderr,
        output,
        exitCode,
        executionTimeMs: Math.round((parseFloat(data.time) || 0) * 1000) || duration,
        memoryKb: data.memory,
        language: langConfig.label,
        statusDescription: data.status?.description || 'Unknown Status',
      };
    } catch (error: any) {
      retries--;
      if (retries === 0) {
        return {
          stdout: '',
          stderr: error.message || 'Network error occurred',
          output: error.message || 'Network error occurred',
          exitCode: 1,
          language: langConfig.label,
          statusDescription: 'Network Error',
        };
      } else {
        await new Promise(r => setTimeout(r, delay));
        delay *= 2;
      }
    }
  }
  
  // Fallback (should never be reached due to retries=0 throw)
  return {
    stdout: '',
    stderr: 'Max retries exceeded',
    output: 'Max retries exceeded',
    exitCode: 1,
    language: langConfig.label,
    statusDescription: 'Network Error',
  };
}
