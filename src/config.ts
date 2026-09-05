import { config as env } from 'dotenv';
import { z } from 'zod';

env();

const schema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DEFAULT_TIMEOUT_MS: z.coerce.number().default(15000),
  REDIS_URL: z.string().url().optional(),
  SQLITE_PATH: z.string().default('edge-cache.db'),
  API_KEY_SECRET: z.string().min(16).default('change-me-in-production-1234'),
  WEBHOOK_SIGNING_SECRET: z.string().min(16).default('change-me-too-1234'),
  TENANT_RATE_LIMIT_PER_MIN: z.coerce.number().default(60),
  PROVIDER_RATE_LIMIT_PER_MIN: z.coerce.number().default(600),
  MONTHLY_BUDGET_USD: z.coerce.number().default(25),
  OPENAI_API_KEY: z.string().optional(),
  HUGGINGFACE_API_KEY: z.string().optional(),
  TOGETHER_API_KEY: z.string().optional(),
  REPLICATE_API_KEY: z.string().optional(),
  CLOUDFLARE_ACCOUNT_ID: z.string().optional(),
  CLOUDFLARE_API_TOKEN: z.string().optional(),
  CLOUDFLARE_AI_MODEL: z.string().default('@cf/meta/llama-3-8b-instruct'),
  FEATURE_USE_EDGE_CACHE: z.enum(['true', 'false']).default('true'),
  FEATURE_ENABLE_FAILOVER: z.enum(['true', 'false']).default('true')
});

export const cfg = schema.parse(process.env);
