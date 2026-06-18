const CRASH_LOG_KEY = 'finplan_crash_logs';
const MAX_LOGS = 50;
import { createLogger } from '@/utils/logger';

const crashReporterLogger = createLogger('CrashReporter');

interface CrashLog {
  id: string;
  timestamp: string;
  type: 'error' | 'unhandledrejection' | 'warning';
  message: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  stack?: string;
  url?: string;
  component?: string;
}

function getLogs(): CrashLog[] {
  try {
    const raw = localStorage.getItem(CRASH_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function storeLog(log: CrashLog): void {
  try {
    const logs = getLogs();
    logs.unshift(log);
    if (logs.length > MAX_LOGS) {
      logs.length = MAX_LOGS;
    }
    localStorage.setItem(CRASH_LOG_KEY, JSON.stringify(logs));
  } catch {
    // localStorage may be full or unavailable — silently drop
  }
}

function handleError(event: ErrorEvent): void {
  const log: CrashLog = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    type: 'error',
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error instanceof Error ? event.error.stack : undefined,
  };

  storeLog(log);

  // Log to console for dev tools
  crashReporterLogger.error('Captured error', { message: log.message, log });
}

function handleUnhandledRejection(event: PromiseRejectionEvent): void {
  event.preventDefault();

  const reason = event.reason;
  const message =
    reason instanceof Error
      ? reason.message
      : typeof reason === 'string'
        ? reason
        : JSON.stringify(reason);

  const log: CrashLog = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    type: 'unhandledrejection',
    message,
    stack: reason instanceof Error ? reason.stack : undefined,
  };

  storeLog(log);

  crashReporterLogger.error('Captured unhandled rejection', { message: log.message, log });
}

/**
 * Initialize the JS crash reporter.
 * Sets up global error handlers to capture uncaught errors
 * and unhandled promise rejections. Logs are persisted to
 * localStorage for offline-first debugging.
 */
export function initCrashReporter(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('error', handleError);
  window.addEventListener('unhandledrejection', handleUnhandledRejection);

  crashReporterLogger.info('Initialized. Logging to localStorage.');
}

/**
 * Retrieve stored crash logs.
 * Useful for support/debugging views.
 */
export function getCrashLogs(): CrashLog[] {
  return getLogs();
}

/**
 * Clear all stored crash logs.
 */
export function clearCrashLogs(): void {
  try {
    localStorage.removeItem(CRASH_LOG_KEY);
  } catch {
    // Silently ignore
  }
}
