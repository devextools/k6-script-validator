/**
 * K6 protocol modules required for load testing
 */
export const K6_PROTOCOL_MODULES = [
  'k6/http',
  'k6/ws', 
  'k6/net/grpc'
] as const;

/**
 * K6 module validation - simplified approach
 * Allow all k6/* modules since they're all safe and maintained by the k6 team
 */
export const K6_MODULES = {
  /**
   * Simple pattern matching for k6 modules
   * Allows: k6, k6/http, k6/net/grpc, k6/experimental/*, etc.
   */
  isK6Module: (moduleName: string): boolean => {
    return moduleName === 'k6' || moduleName.startsWith('k6/');
  },
  
  /**
   * Check if module is a protocol module (http, ws, grpc)
   */
  isProtocolModule: (moduleName: string): boolean => {
    return (K6_PROTOCOL_MODULES as readonly string[]).includes(moduleName);
  },
  
  /**
   * Allow relative imports (local files)
   */
  isRelativeImport: (importPath: string): boolean => {
    return importPath.startsWith('./') || importPath.startsWith('../');
  },
  
  /**
   * Check if import is allowed (k6 modules + relative imports)
   */
  isAllowedImport: (importPath: string): boolean => {
    return K6_MODULES.isK6Module(importPath) || K6_MODULES.isRelativeImport(importPath);
  }
} as const;