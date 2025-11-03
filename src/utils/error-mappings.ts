import { ValidationResponseBuilder, ValidateResponse } from './response-builders';

/**
 * Error mapping configuration for common Express/Multer errors
 */
interface ErrorMapping {
  statusCode: number;
  response: () => ValidateResponse;
}

/**
 * Predefined error mappings for common HTTP parsing errors
 */
export const ERROR_MAPPINGS: Record<string, ErrorMapping> = {
  // Multer field size limit error
  LIMIT_FIELD_VALUE: {
    statusCode: 400,
    response: () => ValidationResponseBuilder.error(['Form field exceeds 50KB limit'], 'Field too large')
  },
  
  // Express body parser errors
  'entity.parse.failed': {
    statusCode: 400,
    response: () => ValidationResponseBuilder.error(['Request body parsing failed'], 'Invalid request format')
  },
  
  'entity.too.large': {
    statusCode: 400,
    response: () => ValidationResponseBuilder.error(['Request body too large'], 'Invalid request format')
  }
} as const;

/**
 * Check if error is a JSON parsing error
 */
export function isJsonParsingError(err: unknown): boolean {
  return err instanceof SyntaxError && err.message.includes('JSON');
}

/**
 * Extract error code/type from various error formats
 */
export function getErrorCode(err: unknown): string | null {
  if (typeof err !== 'object' || err === null) {
    return null;
  }
  
  // Check for multer-style code property
  if ('code' in err && typeof err.code === 'string') {
    return err.code;
  }
  
  // Check for body-parser-style type property  
  if ('type' in err && typeof err.type === 'string') {
    return err.type;
  }
  
  return null;
}

/**
 * Handle mapped errors with predefined responses
 */
export function handleMappedError(err: unknown): { statusCode: number; response: ValidateResponse } | null {
  const errorCode = getErrorCode(err);
  
  if (errorCode && errorCode in ERROR_MAPPINGS) {
    const mapping = ERROR_MAPPINGS[errorCode];
    if (mapping) {
      return {
        statusCode: mapping.statusCode,
        response: mapping.response()
      };
    }
  }
  
  // Handle JSON parsing errors separately since they don't have error codes
  if (isJsonParsingError(err)) {
    return {
      statusCode: 400,
      response: ValidationResponseBuilder.malformedJson()
    };
  }
  
  return null;
}