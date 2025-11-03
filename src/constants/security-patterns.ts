/**
 * Security pattern categories for organized detection
 */
export enum SecurityPatternType {
  DANGEROUS_FUNCTIONS = 'dangerous_functions',
  XSS_PATTERNS = 'xss_patterns',
  SQL_INJECTION = 'sql_injection',
  CODE_OBFUSCATION = 'code_obfuscation'
}

/**
 * Optimized security patterns with consistent organization
 * Note: These patterns are used with RE2 for guaranteed linear time execution
 */
export const SECURITY_PATTERNS = {
  // Dangerous function detection (including bypasses)
  [SecurityPatternType.DANGEROUS_FUNCTIONS]: [
    /\beval\s*\(/gi,
    /\bnew\s+Function\s*\(/gi,
    /\b(?:window\.|globalThis\.)Function\s*\(/gi,
    /\b(?:this|self)\[['"`]Function['"`]\]/gi // Constructor bypass patterns
  ],
  
  // Cross-site scripting patterns (more specific for K6 context)
  [SecurityPatternType.XSS_PATTERNS]: [
    /<script[^>]*>.*?<\/script>/gis,
    /javascript\s*:/gi,
    /\bon(click|load|error|focus|blur)\s*=/gi // Specific HTML event handlers
  ],
  
  // SQL injection patterns (ReDoS-safe with bounded quantifiers)
  [SecurityPatternType.SQL_INJECTION]: [
    /\bUNION\s+SELECT\b/gi,
    /\bSELECT\s+[\w*,\s]{1,30}\s+FROM\b/gi,
    /\b(DROP|DELETE|INSERT|UPDATE)\s+(TABLE|FROM|INTO|SET)\b/gi
  ],
  
  // Code obfuscation detection
  [SecurityPatternType.CODE_OBFUSCATION]: [
    /\\x[0-9a-f]{2}/gi, // Hex encoding
    /\\u[0-9a-f]{4}/gi, // Unicode encoding
    /String\.fromCharCode/gi // Character code conversion
  ]
} as const;

/**
 * Forbidden Node.js modules that pose security risks
 * Organized with comments for clarity but stored as a simple array
 */
export const FORBIDDEN_MODULES = [
  // File system and process control
  'child_process', 'fs', 'os', 'path', 'vm', 'cluster',
  // Network and crypto operations
  'net', 'dgram', 'tls', 'dns', 'crypto',
  // Utility modules that can be misused
  'zlib', 'util', 'events', 'stream', 'buffer'
] as const;