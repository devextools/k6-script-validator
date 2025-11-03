import { generateSwaggerDocs } from '../utils/swagger-generator';
import { generateSwaggerSpec } from '../config/swagger';
import { existsSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';

describe('Swagger Documentation Generation', () => {
  const testOutputDir = 'test-docs';
  const testDocsPath = join(process.cwd(), testOutputDir);

  afterEach(() => {
    // Cleanup test files
    if (existsSync(testDocsPath)) {
      rmSync(testDocsPath, { recursive: true, force: true });
    }
  });

  describe('generateSwaggerSpec', () => {
    it('should generate valid OpenAPI specification object', () => {
      const spec = generateSwaggerSpec() as Record<string, unknown>;
      
      expect(spec).toBeDefined();
      expect(typeof spec).toBe('object');
      expect(spec.openapi).toBe('3.0.3');
      expect((spec.info as Record<string, unknown>).title).toBe('K6 Script Validator Service');
    });

    it('should use custom port in server URL when provided', () => {
      const customPort = 8080;
      const spec = generateSwaggerSpec(customPort) as Record<string, unknown>;
      const servers = spec.servers as Array<Record<string, unknown>>;
      
      expect(servers).toHaveLength(1);
      expect(servers[0]?.url).toBe(`http://localhost:${customPort}`);
    });

    it('should use default port 3000 when no port specified', () => {
      const spec = generateSwaggerSpec() as Record<string, unknown>;
      const servers = spec.servers as Array<Record<string, unknown>>;
      
      expect(servers).toHaveLength(1);
      expect(servers[0]?.url).toBe('http://localhost:3000');
    });

    it('should include required tags for Health and Validation', () => {
      const spec = generateSwaggerSpec() as Record<string, unknown>;
      const tags = spec.tags as Array<Record<string, unknown>>;
      
      expect(tags).toHaveLength(2);
      expect(tags.find((t) => t.name === 'Health')).toBeDefined();
      expect(tags.find((t) => t.name === 'Validation')).toBeDefined();
    });
  });

  describe('generateSwaggerDocs', () => {
    it('should create output directory if it does not exist', () => {
      expect(existsSync(testDocsPath)).toBe(false);
      
      generateSwaggerDocs(testOutputDir);
      
      expect(existsSync(testDocsPath)).toBe(true);
    });

    it('should generate swagger.json file in specified directory', () => {
      const jsonPath = generateSwaggerDocs(testOutputDir);
      
      expect(existsSync(jsonPath)).toBe(true);
      expect(jsonPath).toBe(join(testDocsPath, 'swagger.json'));
    });

    it('should return path to generated JSON file', () => {
      const jsonPath = generateSwaggerDocs(testOutputDir);
      
      expect(jsonPath).toBe(join(testDocsPath, 'swagger.json'));
    });

    it('should generate valid JSON content', () => {
      const jsonPath = generateSwaggerDocs(testOutputDir);
      const content = readFileSync(jsonPath, 'utf-8');
      
      expect(() => JSON.parse(content)).not.toThrow();
      
      const parsedContent = JSON.parse(content);
      expect(parsedContent.openapi).toBe('3.0.3');
      expect(parsedContent.info.title).toBe('K6 Script Validator Service');
    });

    it('should use custom port in generated documentation', () => {
      const customPort = 9000;
      const jsonPath = generateSwaggerDocs(testOutputDir, customPort);
      const content = readFileSync(jsonPath, 'utf-8');
      const parsedContent = JSON.parse(content);
      
      expect(parsedContent.servers[0].url).toBe(`http://localhost:${customPort}`);
    });

    it('should use default docs directory when not specified', () => {
      const jsonPath = generateSwaggerDocs();
      
      expect(jsonPath).toBe(join(process.cwd(), 'docs', 'swagger.json'));
      
      // Cleanup default directory
      if (existsSync(join(process.cwd(), 'docs'))) {
        rmSync(join(process.cwd(), 'docs'), { recursive: true, force: true });
      }
    });

    it('should handle existing directory gracefully', () => {
      // Generate docs twice to test existing directory
      const jsonPath1 = generateSwaggerDocs(testOutputDir);
      const jsonPath2 = generateSwaggerDocs(testOutputDir);
      
      expect(jsonPath1).toBe(jsonPath2);
      expect(existsSync(jsonPath2)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should generate documentation without throwing for valid paths', () => {
      expect(() => {
        generateSwaggerDocs(testOutputDir);
      }).not.toThrow();
    });
  });
});