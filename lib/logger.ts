/**
 * Lightweight logger for API routes
 *
 * Why not pino/winston?
 * - Avoids adding heavy deps/bundling overhead for a small interview app
 * - Keeps output structured and leveled for CI/log drains
 * - Swappable later for pino/winston if we need transports/persistence
 *
 * Default LOG_LEVEL=info; override via env.
 */
type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const currentLevel = (() => {
  const envLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel | undefined;
  return envLevel && envLevel in LEVELS ? envLevel : 'info';
})();

function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  if (LEVELS[level] > LEVELS[currentLevel]) return;
  const timestamp = new Date().toISOString();
  const metaString = meta ? ` ${JSON.stringify(meta)}` : '';
  console[level](`[${timestamp}] [${level.toUpperCase()}] ${message}${metaString}`);
}

export const logger = {
  error: (message: string, meta?: Record<string, unknown>) => log('error', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log('warn', message, meta),
  info: (message: string, meta?: Record<string, unknown>) => log('info', message, meta),
  debug: (message: string, meta?: Record<string, unknown>) => log('debug', message, meta),
};
