import { Project, SourceFile } from 'ts-morph';
import { K6_MODULES } from '../constants/k6-modules';
import { FORBIDDEN_MODULES } from '../constants/security-patterns';
import { Logger } from './logger';

export interface ImportAnalysisResult {
  valid: boolean;
  errors: string[];
  hasK6Imports: boolean;
  hasProtocolImports: boolean;
}

export interface ScriptAnalysisResult extends ImportAnalysisResult {
  hasExportedFunction: boolean;
}

export class ImportAnalyzer {
  private static isForbiddenModule(moduleName: string): boolean {
    return (FORBIDDEN_MODULES as readonly string[]).includes(moduleName);
  }

  // Unified method that analyzes both imports and exports in one pass
  static analyzeScript(script: string): ScriptAnalysisResult {
    const result: ScriptAnalysisResult = {
      valid: true,
      errors: [],
      hasK6Imports: false,
      hasProtocolImports: false,
      hasExportedFunction: false
    };

    // Create new project instance per analysis to prevent memory accumulation
    const project = new Project({ useInMemoryFileSystem: true });
    let sourceFile: SourceFile | undefined;

    try {
      sourceFile = project.createSourceFile('temp.js', script);
      const importDeclarations = sourceFile.getImportDeclarations();

      // Analyze imports
      for (const importDecl of importDeclarations) {
        const moduleSpecifier = importDecl.getModuleSpecifierValue();
        
        if (K6_MODULES.isAllowedImport(moduleSpecifier)) {
          result.hasK6Imports = true;
          
          if (K6_MODULES.isProtocolModule(moduleSpecifier)) {
            result.hasProtocolImports = true;
          }
        } else if (this.isForbiddenModule(moduleSpecifier)) {
          const errorMsg = `Forbidden Node.js module: ${moduleSpecifier}`;
          result.errors.push(errorMsg);
          result.valid = false;
          
          Logger.warn(`Security violation: ${errorMsg}`);
        } else {
          const errorMsg = `Unknown/disallowed import: ${moduleSpecifier}`;
          result.errors.push(errorMsg);
          result.valid = false;
          
          Logger.warn(`Disallowed import detected: ${moduleSpecifier}`);
        }
      }

      // Analyze exports in same pass
      result.hasExportedFunction = this.checkExportedFunction(sourceFile);
    } catch (error) {
      result.valid = false;
      result.errors.push(error instanceof Error ? error.message : 'Script parsing failed');
    } finally {
      // Ensure cleanup happens even if an exception occurs
      if (sourceFile) {
        sourceFile.delete();
      }
    }

    return result;
  }

  private static checkExportedFunction(sourceFile: SourceFile): boolean {
    // Check for export default function
    const exportAssignments = sourceFile.getExportAssignments();
    for (const assignment of exportAssignments) {
      const expression = assignment.getExpression();
      if (expression?.getKind() === 218) { // FunctionExpression
        return true;
      }
    }
    
    // Check for export function declarations  
    const functionDeclarations = sourceFile.getFunctions();
    return functionDeclarations.some(func => func.hasExportKeyword());
  }
}