import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5001),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must contain at least 32 characters"),
  CLIENT_ORIGIN: z.string().default("http://localhost:3000"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
});

const result = schema.safeParse(process.env);
if (!result.success) {
  console.error("Invalid server environment:", result.error.flatten().fieldErrors);
  throw new Error("Server environment validation failed");
}

export const env = result.data;
const firstPartyOrigins = [
  "http://localhost:3000",
  "https://host-in-beta.vercel.app",
  "https://hostin.1forge.in",
  "https://www.hostin.1forge.in",
];
export const allowedOrigins = Array.from(new Set([
  ...firstPartyOrigins,
  ...env.CLIENT_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean),
]));
