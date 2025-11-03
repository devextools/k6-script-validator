import { SECURITY_PATTERNS, SecurityPatternType } from '../constants/security-patterns';

// Prefer the native RE2 addon when available; otherwise fall back to built-in RegExp.
// This keeps local/dev environments working even when the RE2 binary isn't built
// for the current Node version.
type RegexCtor = new (pattern: string | RegExp, flags?: string) => RegExp;
 
const RE2Ctor: RegexCtor = (() => {
  try {
    const maybeModule = require('re2') as unknown;
    const ctor = (maybeModule as { default?: RegexCtor }).default ?? (maybeModule as RegexCtor);
    return ctor as RegexCtor;
  } catch {
    return RegExp as unknown as RegexCtor;
  }
})();

export interface SecurityAnalysisResult {
  valid: boolean;
  errors: string[];
}

export class SecurityAnalyzer {
  private static readonly compiledPatterns = new Map<SecurityPatternType, RegExp[]>();

  // Pre-compile all patterns at module initialization for performance
  static {
    for (const [type, patterns] of Object.entries(SECURITY_PATTERNS)) {
      const compiledSet = patterns.map(pattern => new RE2Ctor(pattern));
      this.compiledPatterns.set(type as SecurityPatternType, compiledSet);
    }
  }

  static analyzeScript(script: string): SecurityAnalysisResult {
    const result: SecurityAnalysisResult = {
      valid: true,
      errors: []
    };

    this.checkDangerousFunctions(script, result);
    this.checkXSSPatterns(script, result);
    this.checkSQLInjection(script, result);
    this.checkCodeObfuscation(script, result);

    return result;
  }

  private static checkDangerousFunctions(script: string, result: SecurityAnalysisResult): void {
    this.checkPatterns(script, result, SecurityPatternType.DANGEROUS_FUNCTIONS, 
      'Script contains dangerous functions that could execute arbitrary code');
  }

  private static checkXSSPatterns(script: string, result: SecurityAnalysisResult): void {
    this.checkPatterns(script, result, SecurityPatternType.XSS_PATTERNS,
      'Script contains XSS patterns that could inject malicious content');
  }

  private static checkSQLInjection(script: string, result: SecurityAnalysisResult): void {
    this.checkPatterns(script, result, SecurityPatternType.SQL_INJECTION,
      'Script contains SQL injection patterns');
  }

  private static checkCodeObfuscation(script: string, result: SecurityAnalysisResult): void {
    this.checkPatterns(script, result, SecurityPatternType.CODE_OBFUSCATION,
      'Script contains code obfuscation patterns that may hide malicious intent');
  }

  private static checkPatterns(script: string, result: SecurityAnalysisResult, 
                              patternType: SecurityPatternType, errorMessage: string): void {
    const compiledPatterns = this.compiledPatterns.get(patternType);
    if (!compiledPatterns) return;
    
    const foundViolations = new Set<string>();
    
    for (const re2Pattern of compiledPatterns) {
      // Use test() instead of exec() to avoid stateful behavior with global regexes
      if (re2Pattern.test(script)) {
        // For error reporting, we need to find the actual match
        // Reset the regex state and use exec() once to get the match
        re2Pattern.lastIndex = 0;
        const match = re2Pattern.exec(script);
        if (match) {
          const violatingCode = match[0];
          // Add unique violations only
          if (!foundViolations.has(violatingCode)) {
            foundViolations.add(violatingCode);
            result.errors.push(`${errorMessage} (found: ${violatingCode})`);
            result.valid = false;
          }
        }
        // Reset regex state to ensure consistency
        re2Pattern.lastIndex = 0;
      }
    }
  }
}
