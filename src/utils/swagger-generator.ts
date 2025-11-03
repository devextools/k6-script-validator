import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { generateSwaggerSpec } from '../config/swagger';

/**
 * Generates Swagger documentation files from JSDoc comments
 * @param outputDir - Directory to write documentation files (defaults to 'docs')
 * @param port - Port number for server URL in documentation
 * @returns Path to generated JSON file
 */
export function generateSwaggerDocs(outputDir: string = 'docs', port?: number): string {
  const specs = generateSwaggerSpec(port);
  
  // Create output directory
  const docsDir = join(process.cwd(), outputDir);
  mkdirSync(docsDir, { recursive: true });
  
  // Generate JSON file
  const jsonPath = join(docsDir, 'swagger.json');
  writeFileSync(jsonPath, JSON.stringify(specs, null, 2));
  
  return jsonPath;
}

/**
 * CLI entry point - only executes when run directly
 */
function runCLI(): void {
  try {
    const jsonPath = generateSwaggerDocs();
    console.log('✅ Swagger documentation generated at', jsonPath);
  } catch (error) {
    console.error('❌ Error generating Swagger documentation:', error);
    process.exit(1);
  }
}

// Only execute if this file is run directly (not imported)
if (require.main === module) {
  runCLI();
}