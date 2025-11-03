import { SecurityAnalyzer } from '../utils/security-analyzer';

describe('SecurityAnalyzer', () => {
  describe('analyzeScript', () => {
    it('should detect K6 script with malicious eval function', () => {
      const script = `
        import http from 'k6/http';
        export default function() {
          const malicious = eval("'http.get'");
          http.get('https://test.k6.io');
        }
      `;
      const result = SecurityAnalyzer.analyzeScript(script);
      
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('dangerous functions');
      expect(result.errors[0]).toContain('(found: eval(');
    });

    it('should detect K6 script with Function constructor', () => {
      const script = `
        import http from 'k6/http';
        export default function() {
          const fn = new Function("return http.get('evil.com')");
          fn();
        }
      `;
      const result = SecurityAnalyzer.analyzeScript(script);
      
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('dangerous functions');
    });

    it('should detect K6 script with obfuscated code', () => {
      const script = `
        import http from 'k6/http';
        export default function() {
          const url = String.fromCharCode(104,116,116,112,115);
          http.get(url + '://malicious.com');
        }
      `;
      const result = SecurityAnalyzer.analyzeScript(script);
      
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('obfuscation patterns');
    });

    it('should pass K6 script with duration strings like 30s', () => {
      const script = `
        import http from 'k6/http';
        export const options = {
          vus: 100,
          duration: '30s',
        };
        export default function() {
          http.get('https://test.k6.io');
        }
      `;
      const result = SecurityAnalyzer.analyzeScript(script);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect K6 script with constructor bypass patterns', () => {
      const script = `
        import http from 'k6/http';
        export default function() {
          const malicious = this['Function']('return 42');
          http.get('https://test.k6.io');
        }
      `;
      const result = SecurityAnalyzer.analyzeScript(script);
      
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('dangerous functions');
      expect(result.errors[0]).toContain("found: this['Function']");
    });

    it('should pass safe K6 script', () => {
      const script = `
        import http from 'k6/http';
        export default function() {
          http.get('https://test.k6.io');
        }
      `;
      const result = SecurityAnalyzer.analyzeScript(script);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect multiple problematic patterns in a single script', () => {
      const script = `
        import http from 'k6/http';
        export default function() {
          // Multiple dangerous functions
          const evil1 = eval("'malicious code'");
          const evil2 = new Function("return 'bad code'");
          
          // Code obfuscation
          const url = String.fromCharCode(104,116,116,112,115);
          
          // Constructor bypass
          const bypass = this['Function']('return 42');
          
          http.get('https://test.k6.io');
        }
      `;
      const result = SecurityAnalyzer.analyzeScript(script);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      
      // Should contain errors for different pattern types
      const errorMessages = result.errors.join(' ');
      expect(errorMessages).toContain('dangerous functions');
      expect(errorMessages).toContain('obfuscation patterns');
      
      // Should contain the specific violating code snippets
      expect(errorMessages).toContain('eval(');
      expect(errorMessages).toContain('new Function(');
      expect(errorMessages).toContain('String.fromCharCode');
      expect(errorMessages).toContain("this['Function']");
    });

    it('should not duplicate identical violations', () => {
      const script = `
        import http from 'k6/http';
        export default function() {
          // Same dangerous function used multiple times
          eval("'test1'");
          eval("'test2'");
          eval("'test3'");
          
          http.get('https://test.k6.io');
        }
      `;
      const result = SecurityAnalyzer.analyzeScript(script);
      
      expect(result.valid).toBe(false);
      // Should only have one error entry for eval, not three
      const evalErrors = result.errors.filter(error => error.includes('eval('));
      expect(evalErrors).toHaveLength(1);
    });
  });
});