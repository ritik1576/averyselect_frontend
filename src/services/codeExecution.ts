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

    if (!response.ok) {
      const errText = await response.text();
      let parsedErr = errText;
      try {
        const jsonErr = JSON.parse(errText);
        parsedErr = jsonErr.error || jsonErr.message || errText;
      } catch (_) {}

      return {
        stdout: '',
        stderr: `Compile / Execution Error: ${parsedErr}`,
        output: `Compilation Failed (${response.status})`,
        exitCode: 1,
        executionTimeMs: duration,
        language: langConfig.label,
        statusDescription: 'Compile Error',
        error: parsedErr,
      };
    }

    const data = await response.json();

    const stdout = data.stdout || '';
    const compileOutput = data.compile_output || '';
    const stderr = data.stderr || compileOutput || data.message || '';
    const statusDesc = data.status?.description || 'Completed';
    const isSuccess = data.status?.id === 3; // 3 = Accepted in Judge0
    const timeMs = data.time ? Math.round(parseFloat(data.time) * 1000) : duration;

    return {
      stdout,
      stderr,
      output: stdout || stderr || statusDesc,
      exitCode: isSuccess ? 0 : 1,
      executionTimeMs: timeMs,
      memoryKb: data.memory,
      language: langConfig.label,
      statusDescription: statusDesc,
    };
  } catch (err: any) {
    const duration = Math.round(performance.now() - startTime);
    return {
      stdout: '',
      stderr: err?.message || 'Network error connecting to execution server',
      output: `Execution Failed: ${err?.message || 'Network error'}`,
      exitCode: 1,
      executionTimeMs: duration,
      language: langConfig.label,
      statusDescription: 'Network Error',
      error: err?.message,
    };
  }
}
