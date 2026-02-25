import { pino } from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';
const logLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');

/**
 * Pino logger instance
 * Structured logging with JSON output
 */
export const logger = pino({
  level: logLevel,
  transport: isDevelopment
    ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    }
    : undefined,
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: (err: Error) => ({
      type: err.constructor.name,
      message: err.message,
      stack: err.stack,
    }),
  },
});

/**
 * Create child logger with context
 */
export function createLogger(context: Record<string, any>) {
  return logger.child(context);
}

export default logger;
