/**
 * Centralized response builders for validation API endpoints
 */

export interface ValidateResponse {
  valid: boolean;
  errors: string[];
  warnings: string[];
  message: string;
}

export class ValidationResponseBuilder {
  /**
   * Create a successful validation response
   */
  static success(message: string = 'Script validation passed'): ValidateResponse {
    return {
      valid: true,
      errors: [],
      warnings: [],
      message
    };
  }

  /**
   * Create an error validation response
   */
  static error(
    errors: string[], 
    message: string = 'Script validation failed',
    warnings: string[] = []
  ): ValidateResponse {
    return {
      valid: false,
      errors,
      warnings,
      message
    };
  }

  /**
   * Create an invalid request format response
   */
  static invalidRequest(message: string = 'Invalid request format'): ValidateResponse {
    return {
      valid: false,
      errors: ['Request must include a script field with valid JavaScript code'],
      warnings: [],
      message
    };
  }

  /**
   * Create a server error response
   */
  static serverError(message: string = 'Server error'): ValidateResponse {
    return {
      valid: false,
      errors: ['Internal server error during validation'],
      warnings: [],
      message
    };
  }

  /**
   * Create a malformed JSON response
   */
  static malformedJson(): ValidateResponse {
    return {
      valid: false,
      errors: ['Invalid JSON format in request body'],
      warnings: [],
      message: 'Request body contains malformed JSON'
    };
  }
}