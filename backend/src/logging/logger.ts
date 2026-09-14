// Minimal structured logger.
//
// Emits one JSON object per line ("structured logging") to the console. This is
// intentionally dependency-free and tiny so it stays easy to reason about.
//
// When real infrastructure arrives, the only thing that needs to change is the
// `write` sink below — point it at CloudWatch (or any log shipper) and every
// call site keeps working unchanged. Because entries are already JSON, most log
// aggregators can ingest them as-is.

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  // Arbitrary structured context (requestId, model, durationMs, ...).
  [key: string]: unknown;
}

// The single output sink. Swap the body of this function to forward logs
// elsewhere (CloudWatch, a file, an HTTP collector); nothing else changes.
function write(entry: LogEntry): void {
  const line = JSON.stringify(entry);
  if (entry.level === "error") {
    console.error(line);
  } else {
    console.log(line);
  }
}

function log(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
): void {
  write({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  });
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) =>
    log("debug", message, context),
  info: (message: string, context?: Record<string, unknown>) =>
    log("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) =>
    log("warn", message, context),
  error: (message: string, context?: Record<string, unknown>) =>
    log("error", message, context),
};
