/**
 * Validation configuration interface
 */
export interface ValidationConfig {
  maxScriptSize: number;
  maxVUs: number;
  maxIterations: number;
  maxComplexityScore: number;
  maxMemoryEstimate: number;
  maxCpuTimeEstimate: number;
}

/**
 * Validation error types - simplified and deduplicated
 */
export enum ValidationErrorType {
  // Input validation
  INVALID_INPUT = 'INVALID_INPUT',
  SCRIPT_TOO_LARGE = 'SCRIPT_TOO_LARGE',
  
  // Security (constants defined but validation implementation in PR4)
  DANGEROUS_FUNCTION = 'DANGEROUS_FUNCTION',
  XSS_PATTERN = 'XSS_PATTERN',
  SQL_INJECTION = 'SQL_INJECTION',
  OBFUSCATED_CODE = 'OBFUSCATED_CODE',
  FORBIDDEN_MODULE = 'FORBIDDEN_MODULE',
  
  // K6-specific (implementation in PR3)
  MISSING_HTTP_IMPORT = 'MISSING_HTTP_IMPORT',
  MISSING_DEFAULT_EXPORT = 'MISSING_DEFAULT_EXPORT',
  
  // Resource limits (implementation in PR4)
  VU_LIMIT_EXCEEDED = 'VU_LIMIT_EXCEEDED',
  ITERATION_LIMIT_EXCEEDED = 'ITERATION_LIMIT_EXCEEDED'
}

/**
 * Validation error structure
 */
export interface ValidationError {
  type: ValidationErrorType;
  message: string;
  severity: 'error' | 'warning';
  line?: number;
  column?: number;
}

/**
 * Simple validation result structure
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * @swagger
 * components:
 *   schemas:
 *     ValidationResponse:
 *       type: object
 *       properties:
 *         valid:
 *           type: boolean
 *           description: Whether the script passed validation
 *           example: true
 *         message:
 *           type: string
 *           description: Human-readable validation result message
 *           example: "Script validation passed"
 *         errors:
 *           type: array
 *           items:
 *             type: string
 *           description: List of validation errors that caused the script to fail
 *           example: []
 *         warnings:
 *           type: array
 *           items:
 *             type: string
 *           description: List of validation warnings (script still passes)
 *           example: []
 *       required:
 *         - valid
 *         - message
 *         - errors
 */
export interface ValidateResponse {
  valid: boolean;
  message: string;
  errors: string[];
  warnings?: string[];
}