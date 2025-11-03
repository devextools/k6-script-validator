import { ImportAnalyzer } from '../utils/import-analyzer';

describe('ImportAnalyzer', () => {
  describe('analyzeScript', () => {
    it('should allow valid K6 imports', () => {
      const script = `
        import http from 'k6/http';
        import { check } from 'k6';
        export default function() {}
      `;
      
      const result = ImportAnalyzer.analyzeScript(script);
      
      expect(result.valid).toBe(true);
      expect(result.hasK6Imports).toBe(true);
      expect(result.hasProtocolImports).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should allow relative imports', () => {
      const script = `
        import { helper } from './utils.js';
        import config from '../config.js';
        import http from 'k6/http';
      `;
      
      const result = ImportAnalyzer.analyzeScript(script);
      
      expect(result.valid).toBe(true);
      expect(result.hasK6Imports).toBe(true);
      expect(result.hasProtocolImports).toBe(true);
    });

    it('should reject forbidden Node.js modules', () => {
      const script = `
        import fs from 'fs';
        import http from 'k6/http';
      `;
      
      const result = ImportAnalyzer.analyzeScript(script);
      
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/Forbidden Node.js module: fs/);
    });

    it('should reject unknown modules', () => {
      const script = `
        import axios from 'axios';
        import lodash from 'lodash';
      `;
      
      const result = ImportAnalyzer.analyzeScript(script);
      
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/Unknown\/disallowed import: axios/);
    });

    it('should identify protocol modules', () => {
      const script = `
        import { sleep } from 'k6';
        import ws from 'k6/ws';
        import grpc from 'k6/net/grpc';
      `;
      
      const result = ImportAnalyzer.analyzeScript(script);
      
      expect(result.valid).toBe(true);
      expect(result.hasK6Imports).toBe(true);
      expect(result.hasProtocolImports).toBe(true);
    });

  });

  describe('export function detection', () => {
    it('should detect export default function', () => {
      const script = `
        import http from 'k6/http';
        export default function() {}
      `;
      
      const result = ImportAnalyzer.analyzeScript(script);
      expect(result.hasExportedFunction).toBe(true);
    });

    it('should detect export function declaration', () => {
      const script = `
        import http from 'k6/http';
        export function testFunction() {}
      `;
      
      const result = ImportAnalyzer.analyzeScript(script);
      expect(result.hasExportedFunction).toBe(true);
    });

    it('should return false for no exports', () => {
      const script = `
        import http from 'k6/http';
        function testFunction() {}
      `;
      
      const result = ImportAnalyzer.analyzeScript(script);
      expect(result.hasExportedFunction).toBe(false);
    });
  });
});