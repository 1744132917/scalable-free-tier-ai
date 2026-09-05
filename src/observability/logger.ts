type Json = Record<string, unknown>;

function log(level: 'debug' | 'info' | 'warn' | 'error', payload: Json, msg: string) {
  // JSON structured log line for ingestion by common observability backends.
  console.log(JSON.stringify({ level, msg, service: 'scalable-free-tier-ai', ...payload }));
}

export const logger = {
  debug(payload: Json, msg: string) {
    log('debug', payload, msg);
  },
  info(payload: Json, msg: string) {
    log('info', payload, msg);
  },
  warn(payload: Json, msg: string) {
    log('warn', payload, msg);
  },
  error(payload: Json, msg: string) {
    log('error', payload, msg);
  }
};
