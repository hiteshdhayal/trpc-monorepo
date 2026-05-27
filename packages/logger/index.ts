import winston from "winston";
import { env } from "./env";

type LoggerLevel = "error" | "info" | "debug";

const level: LoggerLevel = env.LOGGER_LEVEL ?? (env.NODE_ENV === "development" ? "debug" : "error");

const isDevelopment = env.NODE_ENV === "development";

const serializeErrors = winston.format((info) => {
  for (const key of Object.keys(info)) {
    const value = info[key];
    if (value instanceof Error) {
      info[key] = {
        ...value,
        name: value.name,
        message: value.message,
        stack: value.stack,
      };
    } else if (value && typeof value === "object" && "stack" in value && "message" in value) {
      info[key] = {
        ...value,
        message: (value as any).message,
        stack: (value as any).stack,
      };
    }
  }
  return info;
});

const format = isDevelopment
  ? winston.format.combine(
      winston.format.errors({ stack: true }),
      serializeErrors(),
      winston.format.colorize(),
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        const metaString = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : "";
        const stackString = stack ? `\n${stack}` : "";
        return `${timestamp} [${level}]: ${message}${metaString}${stackString}`;
      }),
    )
  : winston.format.combine(
      winston.format.errors({ stack: true }),
      serializeErrors(),
      winston.format.timestamp(),
      winston.format.json(),
    );

export const logger = winston.createLogger({
  level: level,
  format: format,
  transports: [new winston.transports.Console()],
});
