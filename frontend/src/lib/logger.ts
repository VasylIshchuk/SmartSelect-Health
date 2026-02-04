type LogLevel = "error" | "warn" | "info";

const sendLog = async (level: LogLevel, message: string, context?: string, errorObj?: any) => {
  try {
    fetch("/api/log-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        level,
        message,
        context,
        stack: errorObj instanceof Error ? errorObj.stack : undefined,
      }),
    });
  } catch (e) {
    console.error("Failed to send log to server:", e);
  }
};


export const logError = (message: string, error?: any, context?: string) => {
  sendLog("error", message, context, error);
};

export const logWarning = (message: string, context?: string) => {
  sendLog("warn", message, context);
};

export const logInfo = (message: string, context?: string) => {
  sendLog("info", message, context);
};