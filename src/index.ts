import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import validationRoutes from './routes/validation';
import { SERVER_CONFIG, SCRIPT_CONFIG } from './config/default';
import { generateSwaggerSpec } from './config/swagger';
import { handleMappedError } from './utils/error-mappings';
import { Logger } from './utils/logger';
// Tracing removed: deployment tracking disabled

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: SERVER_CONFIG.corsOrigins,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: SERVER_CONFIG.rateLimitWindowMs,
  max: SERVER_CONFIG.rateLimitMaxRequests,
  message: {
    error: 'Too many requests, please try again later.',
    retryAfter: Math.ceil(SERVER_CONFIG.rateLimitWindowMs / 1000)
  }
});

app.use(limiter);

// Body parsing middleware - aligned with validation limits for security
const bodyLimit = Math.ceil(SCRIPT_CONFIG.maxFileSize * 1.2); // 20% buffer above validation limit
app.use(express.json({ limit: bodyLimit }));
app.use(express.urlencoded({ extended: true, limit: bodyLimit }));

// Request logging middleware
app.use((req, res, next) => {
  if (req.path !== '/health') {
    const startTime = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      Logger.log(`${req.method} ${req.path} ${res.statusCode} (${duration}ms)`);
    });
  }
  next();
});

// Generate Swagger specification using shared configuration
const swaggerSpec = generateSwaggerSpec(SERVER_CONFIG.port);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'K6 Script Validator API',
  customfavIcon: '/favicon.ico',
  customCss: '.swagger-ui .topbar { display: none }',
}));

// API routes
app.use('/api/v1', validationRoutes);

/**
 * @swagger
 * /:
 *   get:
 *     summary: Service information
 *     description: Returns basic service information and health status
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 service:
 *                   type: string
 *                   example: k6-script-validator
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 status:
 *                   type: string
 *                   example: running
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
app.get('/', (req, res) => {
  res.json({
    service: 'k6-script-validator',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction): void => {
  Logger.error('Error occurred:', {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      error: err instanceof Error ? {
        name: err.name,
        message: err.message,
        stack: err.stack
      } : err,
      scriptPreview: req.body?.script ? req.body.script.substring(0, 200) + '...' : 'No script'
    });
  
  // Try to handle known error types with predefined mappings
  const mappedError = handleMappedError(err);
  if (mappedError) {
    res.status(mappedError.statusCode).json(mappedError.response);
    return;
  }
  
  // Handle all other errors - log details internally but don't expose to users
  const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? errorMessage : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(SERVER_CONFIG.port, SERVER_CONFIG.host, () => {
    Logger.log(`K6 Script Validator service running on http://${SERVER_CONFIG.host}:${SERVER_CONFIG.port}`);
    Logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    Logger.log(`CORS origins: ${SERVER_CONFIG.corsOrigins.join(', ')}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    Logger.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      Logger.log('Process terminated');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    Logger.log('SIGINT received, shutting down gracefully');
    server.close(() => {
      Logger.log('Process terminated');
      process.exit(0);
    });
  });
}

export default app;
