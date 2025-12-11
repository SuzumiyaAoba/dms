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

function log(level: LogLevel, event: string, data?: Record<string, Serializable>) {
  const payload = {
    level,
    event,
    timestamp: new Date().toISOString(),
    ...data,
  };
  const line = JSON.stringify(payload);
  if (level === 'error') {
    // eslint-disable-next-line no-console
    console.error(line);
  } else {
    // eslint-disable-next-line no-console
    console.log(line);
  }
}

export function logInfo(event: string, data?: Record<string, Serializable>) {
  log('info', event, data);
}

export function logError(event: string, error: unknown, data?: Record<string, Serializable>) {
  log('error', event, { error: serializeError(error), ...data });
}
