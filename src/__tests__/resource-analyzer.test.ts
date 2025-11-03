import { ResourceAnalyzer } from '../utils/resource-analyzer';

describe('ResourceAnalyzer', () => {
  describe('analyzeScript', () => {
    it('should reject K6 script with excessive VUs', () => {
      const script = `
        import http from 'k6/http';
        export const options = {
          vus: 2000, // Exceeds limit of 500
          duration: '30s',
        };
        export default function() {
          http.get('https://test.k6.io');
        }
      `;
      const result = ResourceAnalyzer.analyzeScript(script);
      
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('VUs limit exceeded: 2000 > 500');
      expect(result.errors[0]).toContain('(found: vus: 2000)');
    });

    it('should pass K6 script with acceptable VUs', () => {
      const script = `
        import http from 'k6/http';
        export const options = {
          vus: 100, // Within limit
          duration: '30s',
        };
        export default function() {
          http.get('https://test.k6.io');
        }
      `;
      const result = ResourceAnalyzer.analyzeScript(script);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject K6 script with invalid VUs value', () => {
      const script = `
        import http from 'k6/http';
        export const options = {
          vus: 'invalid', // Not a number
          duration: '30s',
        };
        export default function() {
          http.get('https://test.k6.io');
        }
      `;
      const result = ResourceAnalyzer.analyzeScript(script);
      
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("Invalid VUs value: ''invalid'' is not a number");
      expect(result.errors[0]).toContain("(found: vus: 'invalid')");
    });

    it('should reject scripts exceeding size limit', () => {
      const baseScript = 'import http from "k6/http";\n';
      const largeScript = baseScript + 'a'.repeat(51200 - baseScript.length + 1); // Over 50KB (51200 bytes)
      const result = ResourceAnalyzer.analyzeScript(largeScript);
      
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Script size exceeds maximum allowed length');
      expect(result.errors[0]).toContain('> 51200'); // Over the 50KB limit
    });
  });
});