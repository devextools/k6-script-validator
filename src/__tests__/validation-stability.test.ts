import request from 'supertest';
import app from '../index';

describe('Validation Stability', () => {
  const validK6Script = `
    import http from 'k6/http';
    
    export default function() {
      http.get('https://httpbin.org/get');
    }
  `;

  const scriptWithSecurityViolation = `
    import http from 'k6/http';
    
    export default function() {
      eval('console.log("test")');
      http.get('https://httpbin.org/get');
    }
  `;

  const scriptWithMultipleViolations = `
    import http from 'k6/http';
    
    export default function() {
      eval('test');
      Function('return 1')();
      document.write('<script>alert("xss")</script>');
      http.get('https://httpbin.org/get');
    }
  `;

  describe('Consistent Results for Same Script', () => {
    it('should return identical results for valid script on multiple calls', async () => {
      const results = [];
      
      // Make 5 identical requests
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .post('/api/v1/validate')
          .send({ script: validK6Script })
          .expect(200);
        
        results.push(response.body);
      }
      
      // All results should be identical
      for (let i = 1; i < results.length; i++) {
        expect(results[i]).toEqual(results[0]);
        expect(results[i].valid).toBe(true);
        expect(results[i].errors).toEqual([]);
      }
    });

    it('should return identical error results for script with security violations on multiple calls', async () => {
      const results = [];
      
      // Make 5 identical requests
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .post('/api/v1/validate')
          .send({ script: scriptWithSecurityViolation })
          .expect(400);
        
        results.push(response.body);
      }
      
      // All results should be identical
      for (let i = 1; i < results.length; i++) {
        expect(results[i]).toEqual(results[0]);
        expect(results[i].valid).toBe(false);
        expect(results[i].errors.length).toBeGreaterThan(0);
        // Error messages should be exactly the same
        expect(results[i].errors).toEqual(results[0].errors);
      }
    });

    it('should return consistent results for script with multiple violations', async () => {
      const results = [];
      
      // Make 10 requests to test stability under more calls
      for (let i = 0; i < 10; i++) {
        const response = await request(app)
          .post('/api/v1/validate')
          .send({ script: scriptWithMultipleViolations })
          .expect(400);
        
        results.push(response.body);
      }
      
      // All results should be identical
      for (let i = 1; i < results.length; i++) {
        expect(results[i]).toEqual(results[0]);
        expect(results[i].valid).toBe(false);
        
        // Sort errors for comparison since order might vary
        const sortedCurrentErrors = [...results[i].errors].sort();
        const sortedFirstErrors = [...results[0].errors].sort();
        expect(sortedCurrentErrors).toEqual(sortedFirstErrors);
        
        // Should have multiple errors (eval, Function, XSS)
        expect(results[i].errors.length).toBeGreaterThan(1);
      }
    });

    it('should maintain stability across different script types in sequence', async () => {
      // Test that validation state doesn't leak between different scripts
      const scripts = [
        validK6Script,
        scriptWithSecurityViolation,
        validK6Script, // Same as first - should get same result
        scriptWithMultipleViolations,
        validK6Script  // Same as first - should still get same result
      ];
      
      const results = [];
      
      for (const script of scripts) {
        const response = await request(app)
          .post('/api/v1/validate')
          .send({ script });
        
        results.push({
          script: script === validK6Script ? 'valid' : script === scriptWithSecurityViolation ? 'single-violation' : 'multiple-violations',
          response: response.body,
          status: response.status
        });
      }
      
      // First and third results should be identical (both valid scripts)
      expect(results[0]?.response).toEqual(results[2]?.response);
      expect(results[0]?.response).toEqual(results[4]?.response);
      
      // All valid results should pass
      expect(results[0]?.response.valid).toBe(true);
      expect(results[2]?.response.valid).toBe(true);
      expect(results[4]?.response.valid).toBe(true);
      
      // Invalid results should fail
      expect(results[1]?.response.valid).toBe(false);
      expect(results[3]?.response.valid).toBe(false);
    });
  });

  describe('Validation Order Independence', () => {
    it('should produce same results regardless of which script is validated first', async () => {
      // Test scenario A: valid script first, then invalid
      const responseA1 = await request(app)
        .post('/api/v1/validate')
        .send({ script: validK6Script });
      const responseA2 = await request(app)
        .post('/api/v1/validate')
        .send({ script: scriptWithSecurityViolation });
      
      // Test scenario B: invalid script first, then valid  
      const responseB1 = await request(app)
        .post('/api/v1/validate')
        .send({ script: scriptWithSecurityViolation });
      const responseB2 = await request(app)
        .post('/api/v1/validate')
        .send({ script: validK6Script });
      
      // Results should be the same regardless of order
      expect(responseA1.body).toEqual(responseB2.body);
      expect(responseA2.body).toEqual(responseB1.body);
      
      // Verify expected results
      expect(responseA1.body.valid).toBe(true);
      expect(responseB2.body.valid).toBe(true);
      expect(responseA2.body.valid).toBe(false);
      expect(responseB1.body.valid).toBe(false);
    });
  });
});