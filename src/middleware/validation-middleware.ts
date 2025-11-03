import { body, ValidationChain } from 'express-validator';
import { Request } from 'express';
import { ValidationConfig } from '../types/validation';
import { SCRIPT_CONFIG } from '../config/default';

/**
 * Express-validator validation chains for HTTP request validation
 */

// Extended request type for validated requests
export interface ValidatedRequest extends Request {
  parsedOptions?: Partial<ValidationConfig>;
}

// Shared script validation chain to avoid duplication
const scriptFieldValidationChain = (): ValidationChain =>
  body('script')
    .exists().withMessage('Script is required')
    .isString().withMessage('Script must be a string')
    .notEmpty().withMessage('Script cannot be empty')
    .isLength({ max: SCRIPT_CONFIG.maxFileSize }).withMessage(`Script exceeds maximum size of ${SCRIPT_CONFIG.maxFileSize / 1024}KB`);

// Script validation chain - validates script size according to backend loadrunner limits
export const scriptValidation = (): ValidationChain => scriptFieldValidationChain();

// Options validation chain - basic JSON format validation only
// Business logic validation of specific fields will be handled in PR #4
export const optionsValidation = (): ValidationChain =>
  body('options')
    .optional()
    .custom((value: unknown, { req }) => {
      // Handle both JSON string and object
      let parsed = value;
      if (typeof value === 'string') {
        parsed = JSON.parse(value);
      }
      
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('Options must be a valid JSON object');
      }
      
      // Store parsed options for later use (business logic validation in PR #4)
      (req as ValidatedRequest).parsedOptions = parsed as Partial<ValidationConfig>;
      return true;
    });

// Form-specific validation for multipart/form-data (no file uploads)
export const formScriptValidation = (): ValidationChain => scriptFieldValidationChain();