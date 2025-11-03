import { ValidationConfig } from '../types/validation';

export const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  maxScriptSize: 50 * 1024, // 50KB to match backend loadrunner
  maxVUs: 500, // Maximum virtual users limit
  maxIterations: 10000, // Conservative limit
  maxComplexityScore: 100,
  maxMemoryEstimate: 512 * 1024 * 1024, // 512MB
  maxCpuTimeEstimate: 2700000 // 45 minutes in milliseconds (MaxDuration from loadrunner)
};

// Script validation configuration matching backend loadrunner
export const SCRIPT_CONFIG = {
  maxFileSize: 50 * 1024, // 50KB in bytes for form fields
  validExtensions: ['.js', '.ts'] as const // Valid script extensions from loadrunner
};

// Note: VALIDATION_LIMITS and parseDurationToMs will be added in PR4 when actually used

export const SERVER_CONFIG = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
  rateLimitMaxRequests: 100 // requests per window
};