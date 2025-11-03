import request from 'supertest';
import app from '../index';

describe('Express-Validator Integration', () => {
  describe('POST /api/v1/validate (multipart/form-data)', () => {
    it('should validate a proper K6 script sent as form field', async () => {
      const script = `import http from 'k6/http';
export default function() {
  http.get('https://test.k6.io');
}`;

      const response = await request(app)
        .post('/api/v1/validate')
        .field('script', script)
        .expect(200);

      expect(response.body.valid).toBe(true);
      expect(response.body.message).toBe('Script validation passed');
    });

    it('should reject missing script with express-validator', async () => {
      const response = await request(app)
        .post('/api/v1/validate')
        .expect(400);

      expect(response.body.valid).toBe(false);
      expect(response.body.errors[0]).toMatch(/Script is required/);
    });

    it('should reject empty script with express-validator', async () => {
      const response = await request(app)
        .post('/api/v1/validate')
        .field('script', '')
        .expect(400);

      expect(response.body.valid).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors[0]).toMatch(/Script cannot be empty/);
    });


    it('should handle valid options as form field', async () => {
      const script = `import http from 'k6/http';
export default function() {
  http.get('https://test.k6.io');
}`;
      const options = JSON.stringify({ maxVUs: 50 });

      const response = await request(app)
        .post('/api/v1/validate')
        .field('script', script)
        .field('options', options)
        .expect(200);

      expect(response.body.valid).toBe(true);
    });

    it('should accept any valid JSON options (field validation in PR #4)', async () => {
      const script = `import http from 'k6/http';
export default function() {
  http.get('https://test.k6.io');
}`;
      const options = JSON.stringify({ someField: 'someValue' });

      const response = await request(app)
        .post('/api/v1/validate')
        .field('script', script)
        .field('options', options)
        .expect(200);

      expect(response.body.valid).toBe(true);
    });

    it('should reject script exceeding 50KB limit', async () => {
      const largeScript = 'console.log("test");'.repeat(3000); // Create script larger than 50KB

      const response = await request(app)
        .post('/api/v1/validate')
        .field('script', largeScript)
        .expect(400);

      expect(response.body.valid).toBe(false);
      expect(response.body.message).toBe('Field too large');
      expect(response.body.errors[0]).toMatch(/Form field exceeds 50KB limit/);
    });


    it('should reject script without K6 imports', async () => {
      const script = `export default function() {
  console.log('test');
}`;

      const response = await request(app)
        .post('/api/v1/validate')
        .field('script', script)
        .expect(400);

      expect(response.body.valid).toBe(false);
      expect(response.body.message).toBe('Script validation failed');
      expect(response.body.errors[0]).toMatch(/Script must contain at least one K6 import/);
    });

    it('should reject script without export function', async () => {
      const script = `import http from 'k6/http';
const test = function() {
  http.get('https://test.k6.io');
};`;

      const response = await request(app)
        .post('/api/v1/validate')
        .field('script', script)
        .expect(400);

      expect(response.body.valid).toBe(false);
      expect(response.body.message).toBe('Script validation failed');
      expect(response.body.errors[0]).toMatch(/Script must contain an exported test function/);
    });

    it('should reject script without protocol module', async () => {
      const script = `import { sleep } from 'k6';
export default function() {
  sleep(1);
}`;

      const response = await request(app)
        .post('/api/v1/validate')
        .field('script', script)
        .expect(400);

      expect(response.body.valid).toBe(false);
      expect(response.body.message).toBe('Script validation failed');
      expect(response.body.errors[0]).toMatch(/Script must import at least one protocol module/);
    });
  });

  describe('GET /api/v1/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.service).toBe('k6-script-validator');
      expect(response.body.timestamp).toBeDefined();
    });
  });
});