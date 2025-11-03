import { Project, ts } from 'ts-morph';
import { DEFAULT_VALIDATION_CONFIG } from '../config/default';
import { Logger } from './logger';

export interface ResourceAnalysisResult {
  valid: boolean;
  errors: string[];
}

export class ResourceAnalyzer {
  static analyzeScript(script: string): ResourceAnalysisResult {
    const result: ResourceAnalysisResult = {
      valid: true,
      errors: []
    };

    this.checkVUsLimit(script, result);

    return result;
  }

  private static checkVUsLimit(script: string, result: ResourceAnalysisResult): void {
    // Prevent DoS attacks through script size limits (matching loadrunner)
    if (script.length > DEFAULT_VALIDATION_CONFIG.maxScriptSize) {
      result.errors.push(`Script size exceeds maximum allowed length: ${script.length} > ${DEFAULT_VALIDATION_CONFIG.maxScriptSize} bytes`);
      result.valid = false;
      return;
    }

    const project = new Project({ 
      useInMemoryFileSystem: true,
      compilerOptions: {
        // Prevent excessive memory usage during AST parsing
        preserveWatchOutput: false,
        incremental: false,
        skipLibCheck: true,
        skipDefaultLibCheck: true
      }
    });
    const sourceFile = project.createSourceFile('temp.js', script);
    
    try {
      // Look for vus property in options object using targeted approach
      const propertyAssignments = sourceFile.getDescendantsOfKind(ts.SyntaxKind.PropertyAssignment);
      
      for (const node of propertyAssignments) {
        const propertyName = node.getChildAtIndex(0)?.getText();
        if (propertyName === 'vus') {
          const valueText = node.getChildAtIndex(2)?.getText();
          if (valueText) {
            const vusValue = parseInt(valueText, 10);
            
            if (isNaN(vusValue)) {
              result.errors.push(`Invalid VUs value: '${valueText}' is not a number (found: vus: ${valueText})`);
              result.valid = false;
              Logger.warn(`Invalid VUs value detected: '${valueText}' is not a number`);
            } else if (vusValue > DEFAULT_VALIDATION_CONFIG.maxVUs) {
              result.errors.push(`VUs limit exceeded: ${vusValue} > ${DEFAULT_VALIDATION_CONFIG.maxVUs} (found: vus: ${vusValue})`);
              result.valid = false;
              Logger.warn(`Hard limit violation: VUs ${vusValue} exceeds maximum ${DEFAULT_VALIDATION_CONFIG.maxVUs}`);
            }
          }
          break; // Early termination after finding vus property
        }
      }
    } finally {
      sourceFile.delete();
    }
  }
}