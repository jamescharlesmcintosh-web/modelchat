let jsTimeout: ReturnType<typeof setTimeout> | null = null;

function withTimeout<T>(fn: () => T, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    jsTimeout = setTimeout(() => reject(new Error('Execution timed out')), timeoutMs);
    try {
      const result = fn();
      if (jsTimeout) {
        clearTimeout(jsTimeout);
        jsTimeout = null;
      }
      resolve(result);
    } catch (err: any) {
      if (jsTimeout) {
        clearTimeout(jsTimeout);
        jsTimeout = null;
      }
      reject(err);
    }
  });
}

export async function runCode(code: string, language: string): Promise<string> {
  const lang = language.toLowerCase();

  if (lang === 'javascript' || lang === 'typescript' || lang === 'js' || lang === 'ts') {
    return runJavaScript(code);
  }

  if (lang === 'python' || lang === 'py') {
    return 'Python execution requires a backend server. Use JavaScript for now.';
  }

  return `Language "${language}" is not supported yet. Supported: JavaScript, Python.`;
}

async function runJavaScript(code: string): Promise<string> {
  try {
    const logs: string[] = [];
    const mockConsole = {
      log: (...args: any[]) => logs.push(args.map(String).join(' ')),
      error: (...args: any[]) => logs.push(args.map(String).join(' ')),
      warn: (...args: any[]) => logs.push(args.map(String).join(' ')),
    };

    const result = await withTimeout(() => {
      const fn = new Function('console', code);
      return fn(mockConsole);
    }, 5000);

    if (result !== undefined) {
      logs.push(String(result));
    }

    return logs.join('\n') || 'Code executed successfully (no output)';
  } catch (err: any) {
    return `Error: ${err.message}`;
  }
}