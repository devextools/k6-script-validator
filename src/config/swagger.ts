import swaggerJsdoc from 'swagger-jsdoc';

/**
 * Shared Swagger/OpenAPI configuration
 * Used by both the live server and documentation generator
 */
export function createSwaggerConfig(port?: number): swaggerJsdoc.Options {
  return {
    definition: {
      openapi: '3.0.3',
      info: {
        title: 'K6 Script Validator Service',
        description: 'A security-focused validation service for K6 performance testing scripts',
        version: '1.0.0',
        contact: {
          name: 'Project Maintainers',
        },
        license: {
          name: 'MIT',
        },
      },
      servers: [
        {
          url: port ? `http://localhost:${port}` : 'http://localhost:3000',
          description: 'Local development server',
        },
      ],
      tags: [
        {
          name: 'Health',
          description: 'Health check and service information endpoints',
        },
        {
          name: 'Validation',
          description: 'K6 script validation endpoints',
        },
      ],
    },
    apis: ['./src/**/*.ts'],
  };
}

/**
 * Generate Swagger specification from JSDoc comments
 */
export function generateSwaggerSpec(port?: number): object {
  const config = createSwaggerConfig(port);
  return swaggerJsdoc(config);
}
