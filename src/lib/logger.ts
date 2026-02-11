/**
 * Simple server-side logger. Wraps console with structured context support.
 */

type LogContext = Record<string, unknown>;

function formatMessage(msg: string, context?: LogContext): string {
  if (!context || Object.keys(context).length === 0) return msg;
  return `${msg} ${JSON.stringify(context)}`;
}

export const logger = {
  error(contextOrMsg: LogContext | string, msg?: string) {
    if (typeof contextOrMsg === "string") {
      console.error(formatMessage(contextOrMsg, msg ? { message: msg } : undefined));
    } else {
      console.error(formatMessage(msg ?? "Error", contextOrMsg));
    }
  },
  warn(contextOrMsg: LogContext | string, msg?: string) {
    if (typeof contextOrMsg === "string") {
      console.warn(formatMessage(contextOrMsg, msg ? { message: msg } : undefined));
    } else {
      console.warn(formatMessage(msg ?? "Warning", contextOrMsg));
    }
  },
  info(contextOrMsg: LogContext | string, msg?: string) {
    if (typeof contextOrMsg === "string") {
      console.info(formatMessage(contextOrMsg, msg ? { message: msg } : undefined));
    } else {
      console.info(formatMessage(msg ?? "Info", contextOrMsg));
    }
  },
  debug(contextOrMsg: LogContext | string, msg?: string) {
    if (typeof contextOrMsg === "string") {
      console.debug(formatMessage(contextOrMsg, msg ? { message: msg } : undefined));
    } else {
      console.debug(formatMessage(msg ?? "Debug", contextOrMsg));
    }
  },
};
