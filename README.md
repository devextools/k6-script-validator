# K6 Script Validator Service

A security-focused validation service for K6 performance testing scripts. This service validates user-submitted K6 scripts for security vulnerabilities, resource usage limits, and K6-specific requirements before execution.

## Features

### 🔒 Security Validation
- **Obfuscated Code Detection**: Identifies suspicious base64 strings, Unicode escapes, and high-entropy content
- **Injection Attack Prevention**: Detects XSS, SQL injection, command injection, and path traversal patterns
- **Dangerous JavaScript Blocking**: Prevents dynamic code execution (eval, Function(), etc.)
- **Module Restrictions**: Blocks dangerous Node.js modules and browser APIs

### 📊 Resource Usage Validation
- **Script Size Limits**: Configurable maximum script size
- **Virtual User Limits**: Validates VU configuration doesn't exceed limits
- **Iteration Limits**: Prevents excessive iteration counts
- **Complexity Analysis**: Uses AST-based cyclomatic complexity analysis
- **Memory/CPU Estimation**: Estimates resource usage based on script analysis

### ⚡ K6-Specific Requirements
- **Required Imports**: Ensures k6/http module is imported
- **Default Export**: Validates presence of default function export
- **Module Allowlist**: Only allows approved k6 modules and relative imports
- **Lifecycle Functions**: Validates proper k6 lifecycle function usage

## API Endpoints

### `POST /api/v1/validate`

Validates a K6 script for security and compliance.

**Request Body:**
```json
{
  "script": "import http from 'k6/http';\nexport default function() { ... }",
  "options": {
    "maxScriptSize": 1048576,
    "maxVUs": 1000,
    "maxIterations": 100000,
    "maxComplexityScore": 50,
    "maxMemoryEstimate": 100,
    "maxCpuTimeEstimate": 60000
  }
}
```

**Response (Success):**
```json
{
  "valid": true,
  "errors": [],
  "warnings": [],
  "message": "Script validation passed",
  "details": { /* detailed analysis */ }
}
```

**Response (Validation Failed):**
```json
{
  "valid": false,
  "errors": [
    "Required k6 module 'k6/http' is not imported",
    "Dangerous dynamic code execution detected: /\\beval\\s*\\(/"
  ],
  "warnings": [],
  "message": "Script validation failed",
  "details": { /* detailed analysis */ }
}
```

### `GET /api/v1/health`

Health check endpoint.

### `GET /`

Service information endpoint.

## Installation & Usage

### Local Development

```bash
# Install dependencies
npm install

# Start in development mode
npm run dev

# Run tests
npm test

# Run with coverage
npm run test:coverage

# Build for production
npm run build

# Start production build
npm start
```

### Docker

```bash
# Build image
docker build -t k6-script-validator .

# Run container
docker run -p 3000:3000 k6-script-validator
```

### Releases and Versioning

- We use SemVer tags to publish releases. Maintainers create an annotated tag on `main` when ready:

```bash
git checkout main && git pull --ff-only
git tag -a vX.Y.Z -m "vX.Y.Z"
git push origin vX.Y.Z
```

- A GitHub Release is created automatically for each `v*` tag.

### Container Images and Tags

- Registry: `ghcr.io/devextools/k6-script-validator`
- On tag `vX.Y.Z`, images are pushed with tags:
  - `vX.Y.Z`, `X.Y`, `X`, and `latest`
  - `sha-<gitsha>` for traceability
- On branch pushes (including `main`), images are pushed with:
  - `sha-<gitsha>` (no `latest` on branch builds)

### Postman / Newman

Run the Postman collection against a running app using Newman via Docker. If your app runs locally on the host, Newman (in Docker) should use `http://host.docker.internal:<port>`.

```bash
# Build, start, wait for health, and run collection in a shared Docker network
make postman-run-up

# Or run manually against the host app (if running locally)
# Use host.docker.internal so the Newman container can reach your host
make postman-run COLLECTION="postman/K6 Script Validator API - Enhanced Test Suite.postman_collection.json" BASE_URL=http://host.docker.internal:3000

# Stop the app
make docker-down
```

### Environment Variables

- `PORT`: Server port (default: 3000)
- `HOST`: Server host (default: 0.0.0.0)
- `NODE_ENV`: Environment mode (development/production)
- `CORS_ORIGINS`: Comma-separated CORS origins (default: *)
 

## Configuration

Default validation limits can be customized per request or via environment:

```typescript
{
  maxScriptSize: 1024 * 1024,      // 1MB
  maxVUs: 1000,                    // Virtual users
  maxIterations: 100000,           // Max iterations
  maxComplexityScore: 50,          // Cyclomatic complexity
  maxMemoryEstimate: 100,          // MB
  maxCpuTimeEstimate: 60000        // ms
}
```

## Security Considerations

This service is designed for defensive security:
- Validates scripts before execution in K6 runners
- Prevents malicious code injection
- Resource exhaustion protection
- No script execution within the validator itself

## Integration

The service is designed to be called by your loadrunner service:

```javascript
const response = await fetch('http://k6-validator:3000/api/v1/validate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ script: userScript })
});

const result = await response.json();
if (!result.valid) {
  throw new Error(`Script validation failed: ${result.errors.join(', ')}`);
}
```

## Architecture

- **Express.js**: HTTP server framework
- **TypeScript**: Type-safe development
- **Acorn**: JavaScript AST parsing
- **ESComplex**: Complexity analysis
- **Jest**: Testing framework
 

## License

MIT License — see `LICENSE` for details.

Created with ❤️  by [@testprogmath](https://github.com/testprogmath).
