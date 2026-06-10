/**
 * Structured logger for FinPlan Pro
 * Replaces console.log/error/warn with structured, leveled logging
 * In production, can be wired to crash reporting (Sentry, custom, etc.)
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
  source?: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

let minLevel: LogLevel = import.meta.env.DEV ? 'debug' : 'info';
const logBuffer: LogEntry[] = [];
const MAX_BUFFER = 1000;

function createEntry(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
  source?: string
): LogEntry {
  return {
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
    source,
  };
}

function emit(entry: LogEntry): void {
  if (LOG_LEVELS[entry.level] < LOG_LEVELS[minLevel]!) return;

  logBuffer.push(entry);
  if (logBuffer.length > MAX_BUFFER) logBuffer.shift();

  const prefix = `[${entry.level.toUpperCase()}]${entry.source ? ` [${entry.source}]` : ''}`;
  const args = [prefix, entry.message, entry.context].filter(Boolean);

  switch (entry.level) {
    case 'debug':
      console.debug(...args);
      break;
    case 'info':
      console.info(...args);
      break;
    case 'warn':
      console.warn(...args);
      break;
    case 'error':
      console.error(...args);
      break;
  }
}

export const Logger = {
  debug(message: string, context?: Record<string, unknown>, source?: string): void {
    emit(createEntry('debug', message, context, source));
  },
  info(message: string, context?: Record<string, unknown>, source?: string): void {
    emit(createEntry('info', message, context, source));
  },
  warn(message: string, context?: Record<string, unknown>, source?: string): void {
    emit(createEntry('warn', message, context, source));
  },
  error(message: string, context?: Record<string, unknown>, source?: string): void {
    emit(createEntry('error', message, context, source));
  },
  setLevel(level: LogLevel): void {
    minLevel = level;
  },
  getBuffer(): readonly LogEntry[] {
    return logBuffer;
  },
  clearBuffer(): void {
    logBuffer.length = 0;
  },
  getRecent(count: number = 50): LogEntry[] {
    return logBuffer.slice(-count);
  },
};

export function createLogger(source: string) {
  return {
    debug: (msg: string, ctx?: Record<string, unknown>) => Logger.debug(msg, ctx, source),
    info: (msg: string, ctx?: Record<string, unknown>) => Logger.info(msg, ctx, source),
    warn: (msg: string, ctx?: Record<string, unknown>) => Logger.warn(msg, ctx, source),
    error: (msg: string, ctx?: Record<string, unknown>) => Logger.error(msg, ctx, source),
  };
}
