import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { validationResult, Result, ValidationError as ExpressValidationError } from 'express-validator';
import { formScriptValidation, ValidatedRequest } from '../middleware/validation-middleware';
import { ValidationResponseBuilder, ValidateResponse } from '../utils/response-builders';
import { SCRIPT_CONFIG } from '../config/default';
import { ImportAnalyzer } from '../utils/import-analyzer';
import { SecurityAnalyzer } from '../utils/security-analyzer';
import { ResourceAnalyzer } from '../utils/resource-analyzer';
import { Logger } from '../utils/logger';

const router = Router();
// Simple multer setup for form fields only (no file uploads)
const upload = multer({
  limits: {
    fieldSize: SCRIPT_CONFIG.maxFileSize, // 50KB field size limit
    fields: 10 // Allow multiple form fields
  }
});

// Validation error handler middleware
const handleValidationErrors = (req: Request, res: Response<ValidateResponse>, next: NextFunction): void => {
  const errors: Result<ExpressValidationError> = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages: string[] = errors.array().map((err: ExpressValidationError) => {
      if ('param' in err) {
        return `Field '${err.param}': ${err.msg}`;
      }
      return err.msg;
    });
    res.status(400).json(
      ValidationResponseBuilder.error(errorMessages, 'Validation failed')
    );
    return;
  }
  next();
};

async function validateScript(script: string): Promise<ValidateResponse> {
  try {
    const errors: string[] = [];
    
    Logger.log(`Input script: ${script.replace(/\n/g, ' ')}`);
    
    // Basic script size validation
    if (script.length > SCRIPT_CONFIG.maxFileSize) {
      errors.push(`Script size (${script.length} bytes) exceeds maximum allowed size (${SCRIPT_CONFIG.maxFileSize} bytes)`);
    }
    
    // Unified script analysis using AST parsing (single file creation)
    const analysis = ImportAnalyzer.analyzeScript(script);
    if (!analysis.valid) {
      errors.push(...analysis.errors);
    }
    
    // Check for at least one K6 import
    if (!analysis.hasK6Imports) {
      errors.push('Script must contain at least one K6 import (e.g., import http from \'k6/http\')');
    }
    
    // Check for at least one protocol module for load testing
    if (!analysis.hasProtocolImports) {
      errors.push('Script must import at least one protocol module (k6/http, k6/ws, or k6/net/grpc)');
    }
    
    // Check for exported function (analyzed in same pass)
    if (!analysis.hasExportedFunction) {
      errors.push('Script must contain an exported test function');
    }
    
    if (errors.length > 0) {
      Logger.log(`Validation failed: ${errors[0]}`);
      return ValidationResponseBuilder.error(errors, 'Script validation failed');
    }
    
    // Security pattern analysis using RE2 (PR4)
    const securityAnalysis = SecurityAnalyzer.analyzeScript(script);
    errors.push(...securityAnalysis.errors);

    // Hard resource limits validation (cannot be bypassed via options)
    const resourceAnalysis = ResourceAnalyzer.analyzeScript(script);
    errors.push(...resourceAnalysis.errors);

    if (errors.length > 0) {
      Logger.log(`Validation failed: ${errors[0]}`);
      return ValidationResponseBuilder.error(errors, 'Script validation failed');
    }

    Logger.log('Validation successful');
    return ValidationResponseBuilder.success();
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during validation';
    return ValidationResponseBuilder.error([errorMessage], 'Validation error');
  }
}

/**
 * @swagger
 * /api/v1/validate:
 *   post:
 *     summary: Validate K6 script
 *     description: |
 *       Validates a K6 performance testing script for security vulnerabilities,
 *       resource usage limits, and K6-specific requirements.
 *       
 *       ## Security Patterns Detected
 *       - Dynamic code execution (eval, Function, etc.)
 *       - XSS and SQL injection patterns
 *       - Command injection and path traversal
 *       - Forbidden Node.js modules and browser APIs
 *       - Base64 obfuscation and high-entropy strings
 *     tags: [Validation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               script:
 *                 type: string
 *                 description: The K6 script content to validate
 *                 example: |
 *                   import http from 'k6/http';
 *                   
 *                   export default function() {
 *                     http.get('https://httpbin.org/get');
 *                   }
 *             required:
 *               - script
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               script:
 *                 type: string
 *                 description: The K6 script content to validate
 *             required:
 *               - script
 *     responses:
 *       200:
 *         description: Script validation successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationResponse'
 *             examples:
 *               success:
 *                 summary: Valid K6 script
 *                 value:
 *                   valid: true
 *                   message: "Script validation passed"
 *                   errors: []
 *       400:
 *         description: Script validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationResponse'
 *             examples:
 *               security_violation:
 *                 summary: Security pattern detected
 *                 value:
 *                   valid: false
 *                   message: "Script validation failed"
 *                   errors: ["Dangerous dynamic code execution detected: eval("]
 *       500:
 *         description: Internal server error
 */
router.post(
  '/validate',
  upload.none(), // No file uploads, only form fields
  [
    formScriptValidation()
  ],
  handleValidationErrors,
  async (req: ValidatedRequest, res: Response<ValidateResponse>) => {
    try {
      const { script } = req.body;
      
      const result = await validateScript(script);
      return res.status(result.valid ? 200 : 400).json(result);
      
    } catch (error) {
      console.error('Validation error:', error);
      return res.status(500).json(ValidationResponseBuilder.serverError());
    }
  }
);

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     summary: Health check
 *     description: Returns the health status of the validation service
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 service:
 *                   type: string
 *                   example: k6-script-validator
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'k6-script-validator',
    timestamp: new Date().toISOString()
  });
});

export default router;