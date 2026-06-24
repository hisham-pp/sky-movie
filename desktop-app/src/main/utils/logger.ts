import { appendFileSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

interface Logger {
  info(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
  debug(...args: any[]): void;
}

let logFilePath: string | null = null;

function ts(): string {
  return new Date().toISOString();
}

function formatArgs(args: any[]): string {
  return args
    .map((a) => {
      if (a instanceof Error) return `${a.message}\n${a.stack ?? ''}`;
      if (typeof a === 'object' && a !== null) {
        try { return JSON.stringify(a); } catch { return String(a); }
      }
      return String(a);
    })
    .join(' ');
}

function writeToFile(line: string): void {
  if (!logFilePath) return;
  try {
    appendFileSync(logFilePath, line + '\n');
  } catch {
    // ignore — don't crash the app over logging
  }
}

/**
 * Call once at startup with the directory where log files should be written.
 * Creates a daily log file (sky-movie-YYYY-MM-DD.log) and deletes files
 * older than 1 day. Also patches console.* so all main-process output is
 * captured automatically.
 */
export function initFileLogging(dir: string): void {
  try {
    mkdirSync(dir, { recursive: true });
  } catch (e) {
    process.stderr.write(`[Logger] Could not create log dir "${dir}": ${e}\n`);
    return;
  }

  // Purge log files older than 1 day
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  try {
    for (const file of readdirSync(dir)) {
      if (!file.startsWith('sky-movie-') || !file.endsWith('.log')) continue;
      const fp = join(dir, file);
      try {
        if (statSync(fp).mtimeMs < cutoff) unlinkSync(fp);
      } catch { /* ignore */ }
    }
  } catch { /* ignore */ }

  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  logFilePath = join(dir, `sky-movie-${date}.log`);
  writeToFile(`\n${'─'.repeat(60)}\nSession started  ${ts()}\nLog file: ${logFilePath}\n${'─'.repeat(60)}`);

  // Patch console.* so every main-process call also lands in the file
  const _log = console.log.bind(console);
  const _warn = console.warn.bind(console);
  const _error = console.error.bind(console);
  const _debug = console.debug.bind(console);

  console.log = (...args: any[]) => {
    _log(...args);
    writeToFile(`${ts()} INFO  ${formatArgs(args)}`);
  };
  console.warn = (...args: any[]) => {
    _warn(...args);
    writeToFile(`${ts()} WARN  ${formatArgs(args)}`);
  };
  console.error = (...args: any[]) => {
    _error(...args);
    writeToFile(`${ts()} ERROR ${formatArgs(args)}`);
  };
  console.debug = (...args: any[]) => {
    _debug(...args);
    writeToFile(`${ts()} DEBUG ${formatArgs(args)}`);
  };
}

export function logger(name: string): Logger {
  const prefix = `[${name}]`;

  return {
    info(...args: any[]) {
      console.log(prefix, ...args);
    },
    warn(...args: any[]) {
      console.warn(prefix, ...args);
    },
    error(...args: any[]) {
      console.error(prefix, ...args);
    },
    debug(...args: any[]) {
      // always write debug to file; only print to console when DEBUG is set
      if (process.env.DEBUG) {
        console.debug(prefix, ...args);
      } else {
        writeToFile(`${ts()} DEBUG ${prefix} ${formatArgs(args)}`);
      }
    }
  };
}
