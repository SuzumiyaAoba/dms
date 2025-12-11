import pino from 'pino';

type LogLevel = 'info' | 'error';

type Serializable =
  | string
  | number
  | boolean
  | null
  | undefined
  | Serializable[]
  | { [key: string]: Serializable };

function serializeError(error: unknown): Record<string, Serializable> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  return { message: String(error) };
}

const logger = pino({
  level: process.env.NEXT_PUBLIC_LOG_LEVEL || 'info',
  base: undefined,
  timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
});

function log(level: LogLevel, event: string, data?: Record<string, Serializable>) {
  logger[level]({
    event,
    ...data,
  });
}

export function logInfo(event: string, data?: Record<string, Serializable>) {
  log('info', event, data);
}

export function logError(event: string, error: unknown, data?: Record<string, Serializable>) {
  log('error', event, { error: serializeError(error), ...data });
}
