# K6 Script Validator Service

[![Postman Tests](https://github.com/devextools/k6-script-validator/actions/workflows/integration-tests.yml/badge.svg)](https://github.com/devextools/k6-script-validator/actions/workflows/integration-tests.yml)
[![Docker Build](https://github.com/devextools/k6-script-validator/actions/workflows/docker-build.yml/badge.svg)](https://github.com/devextools/k6-script-validator/actions/workflows/docker-build.yml)
[![Release](https://github.com/devextools/k6-script-validator/actions/workflows/release.yml/badge.svg)](https://github.com/devextools/k6-script-validator/actions/workflows/release.yml)

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
npm ci

# Start in development mode (tsx watch)
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

### Container Images and Tags

- Registry: `ghcr.io/devextools/k6-script-validator`
- Tags:
  - `vX.Y.Z`, `X.Y`, `X` — published on Git tags (releases)
  - `release` — convenience tag pointing to the latest release build
  - `latest` — builds from the default branch
  - `sha-<gitsha>` — every build for traceability
  - `pr-<n>` — per-PR builds (if GHCR permissions allow)

Images include standard OCI labels (title, description, source, revision, version, etc.).

SBOM and Provenance
- Builds produce an in-toto provenance attestation (BuildKit provenance enabled).
- An SPDX JSON SBOM is generated with Syft and uploaded as a workflow artifact per build.

### Makefile Shortcuts

```bash
make help                # list targets
make dev                 # tsx watch dev server
make build               # compile TypeScript
make lint / lint-fix     # lint and fix
make docker-build        # build container image
make docker-up           # build & run container (detached)
make docker-down         # stop container
make docker-logs         # tail app logs
make postman-run-local   # run collection with local newman
```

### Test Reports

- Latest Postman report: https://devextools.github.io/k6-script-validator/

### Postman / Newman

Run the Postman collection against a running app using your locally installed Newman.

```bash
# Start the app (choose one)
# 1) Dev mode
npm run dev
# 2) Or Docker
make docker-up

# Run the collection locally
make postman-run-local

# Stop the Docker app if used
make docker-down

# Run locally using your installed newman
make postman-run-local
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

## Releases and Versioning

- Semantic Versioning (SemVer) is automated via semantic-release on pushes to `main`.
- Use Conventional Commits in PRs; the release workflow analyzes commit messages to determine the next version and changelog.
- GitHub Releases are created and `CHANGELOG.md` and `package.json` are updated automatically.
