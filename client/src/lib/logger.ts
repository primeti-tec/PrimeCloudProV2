type LogFn = (...args: unknown[]) => void;

const isDev = import.meta.env.DEV;

const noop: LogFn = () => {};

export const logger = {
  log: isDev ? (console.log.bind(console) as LogFn) : noop,
  warn: isDev ? (console.warn.bind(console) as LogFn) : noop,
  error: isDev ? (console.error.bind(console) as LogFn) : noop,
};
