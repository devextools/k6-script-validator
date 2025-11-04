# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is the K6 Script Validator Service, a security-focused validation service for K6 performance testing scripts. The service validates user-submitted K6 scripts for security vulnerabilities, resource usage limits, and K6-specific requirements before execution.

## Project Structure

### Technology Stack
- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Testing**: Jest with coverage
- **Linting**: ESLint with TypeScript rules
 
- **Parser**: Acorn for JavaScript AST parsing
- **Security**: RE2 for safe regex operations

### Directory Structure
- `src/` - TypeScript source code
- `src/__tests__/` - Test files
- `src/config/` - Configuration files
- `src/constants/` - Static constants and patterns
- `src/middleware/` - Express middleware
- `src/routes/` - API route handlers
- `src/types/` - TypeScript type definitions
- `src/utils/` - Utility functions
- `dist/` - Compiled JavaScript output
- `coverage/` - Test coverage reports

## Development Guidelines

### Test-Driven Development (TDD) Principles

**ALWAYS start with tests first** - This is non-negotiable for this codebase.

#### TDD Workflow
1. **Red**: Write a failing test that describes the desired behavior
2. **Green**: Write the minimal code to make the test pass
3. **Refactor**: Clean up code while keeping tests green
4. **Repeat**: Continue cycle for each small feature increment

#### TDD Guidelines
- **Write tests before implementation**: Never write production code without a failing test
- **One test at a time**: Focus on single behavior per test
- **Minimal implementation**: Write only enough code to pass the current test
- **Comprehensive coverage**: Cover happy path, edge cases, and error conditions
- **Test naming**: Use descriptive names that explain the behavior being tested

#### Code Reuse Strategy
- **Survey existing code first**: Always check if similar functionality already exists
- **Extend before creating**: Prefer extending existing functions over writing new ones
- **Extract common patterns**: When you see duplication, extract into shared utilities
- **Follow existing conventions**: Match patterns, naming, and structure of existing code

### Feature Development Process

#### Planning Phase
1. **Create TODO plan**: Use TodoWrite tool to break down feature into tasks
2. **Small iterations**: Prefer 20-30 line commits for clarity and reviewability
   - **Exceptions allowed**: For refactoring, adding comprehensive tests, or implementing complex features, larger commits are acceptable. Use clear commit messages and ensure each commit is logically atomic.
3. **Clear descriptions**: One-line commit messages without Claude credentials
4. **Test strategy**: Plan test cases before writing any code

#### Implementation Phase
1. **Start with tests**: Write failing tests that define expected behavior
2. **Minimal implementation**: Write just enough code to pass tests
3. **Incremental commits**: Commit after each small working increment
4. **Continuous validation**: Run tests after every change

### Git Workflow Best Practices

#### Commit Management
- **Small, focused commits**: 20-30 lines per commit maximum
- **One-line descriptions**: Clear, concise commit messages
- **Simple format**: Use straightforward commit messages like "Add validation for script size limits"
- **Atomic changes**: Each commit should represent one logical change
- **Test after each commit**: Ensure tests pass after every commit

## Development Commands

### Local Development
```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Build TypeScript to JavaScript
npm run build

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking without compilation
npm run type-check
```

### Testing
```bash
# Run all tests
npm test

# Run tests with file watching
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Production
```bash
# Start production server (requires build first)
npm start

# Start production server
npm run start:prod
```

## Core Functionality

### Security Validation
The service implements multiple security checks:
- **Obfuscated Code Detection**: Identifies suspicious base64, Unicode escapes, high entropy content
- **Injection Prevention**: XSS, SQL injection, command injection, path traversal patterns
- **Code Execution Blocking**: Prevents eval(), Function(), and dynamic code execution
- **Module Restrictions**: Blocks dangerous Node.js modules and browser APIs

### Resource Usage Validation
- Script size limits (configurable, default 1MB)
- Virtual user limits (default 1000)
- Iteration count limits (default 100,000)
- Cyclomatic complexity analysis (default max 50)
- Memory and CPU usage estimation

### K6-Specific Requirements
- Required k6/http module import validation
- Default function export requirement
- K6 module allowlist enforcement
- Lifecycle function validation

## API Endpoints

### `POST /api/v1/validate`
Primary validation endpoint that accepts K6 scripts and validation options.

### `GET /api/v1/health`
Health check endpoint for monitoring.

### `GET /`
Service information endpoint.

## Configuration

### Environment Variables
- `PORT`: Server port (default: 3000)
- `HOST`: Server host (default: 0.0.0.0)
- `NODE_ENV`: Environment mode (development/production)
- `CORS_ORIGINS`: Comma-separated CORS origins (default: *)

### Validation Limits
Default limits in `src/config/default.ts`:
- `maxScriptSize`: 1MB
- `maxVUs`: 1000 virtual users
- `maxIterations`: 100,000
- `maxComplexityScore`: 50 (cyclomatic complexity)
- `maxMemoryEstimate`: 100MB
- `maxCpuTimeEstimate`: 60 seconds

## Security Patterns

Security patterns are defined in `src/constants/security-patterns.ts`:
- **HIGH_RISK_PATTERNS**: Critical security violations that block execution
- **MEDIUM_RISK_PATTERNS**: Suspicious patterns that generate warnings
- **OBFUSCATION_PATTERNS**: Detection patterns for code obfuscation attempts

## Testing Strategy

### Test Files
- `import-analyzer.test.ts` - Tests for K6 import validation
- `resource-analyzer.test.ts` - Tests for resource usage analysis
- `security-analyzer.test.ts` - Tests for security pattern detection
- `validation.test.ts` - Integration tests for the validation API

### Test Coverage
The project maintains test coverage reports in the `coverage/` directory. Run `npm run test:coverage` to generate updated coverage reports.

## Docker Support

The service includes a Dockerfile for containerized deployment:
```bash
# Build Docker image
docker build -t k6-script-validator .

# Run container
docker run -p 3000:3000 k6-script-validator
```

## CI/CD and Releases

- `docker-build.yml`: Builds and pushes images to GHCR. For branch/PR pushes, tags `sha-<commit>` only. For tags (`vX.Y.Z`), tags `vX.Y.Z`, `X.Y`, `X`, and `latest`.
- `integration-tests.yml`: Runs API tests against the built image and publishes a report to GitHub Pages.
- `release.yml`: Creates a GitHub Release with generated notes on `v*` tags.

### Tag-driven releases (SemVer)
After merging to `main` and ensuring CI is green:
```bash
git checkout main && git pull --ff-only
git tag -a vX.Y.Z -m "vX.Y.Z"
git push origin vX.Y.Z
```
This publishes container images with `vX.Y.Z`, `X.Y`, `X`, and `latest` tags.

## Integration

This service is designed to be called by loadrunner services before executing K6 scripts:

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

 

## Development Workflow

### Making Changes
1. Write TypeScript code in `src/` directory
2. Add tests in `src/__tests__/` for new functionality
3. Run `npm run lint` to check code style
4. Run `npm test` to verify tests pass
5. Run `npm run type-check` to verify TypeScript compilation
6. Use `npm run dev` for development with hot reload

### Code Style
- Follow TypeScript and ESLint rules
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Maintain type safety throughout the codebase

## Security Considerations

This is a defensive security service that:
- Validates scripts before execution (never executes scripts itself)
- Prevents malicious code injection into K6 runners
- Protects against resource exhaustion attacks
- Uses safe regex operations via RE2 library
- Implements rate limiting and input validation

**IMPORTANT**: This service is designed for defensive security purposes only. Do not modify it to bypass security validations or enable malicious code execution.

## Common Patterns

### Error Handling
- Use consistent error response format across all endpoints
- Include validation details in error messages for debugging
- Log errors with appropriate severity levels (Error, Warn, Info)
- Preserve error context for debugging while sanitizing user-facing messages

### Test Patterns
- Use descriptive test names like `validateScript_rejectsEvalStatements_returnsError`
- Organize tests with Arrange-Act-Assert structure
- Use `describe` and `it` blocks for clear test organization
- Include both positive and negative test cases
- Test edge cases and boundary conditions

### Validation Patterns
- Implement validation at request entry points
- Use schema validation for request structure
- Provide clear, actionable validation error messages
- Separate validation logic from business logic

## Lessons Learned

### Development Anti-Patterns (Avoid)
❌ **Writing code before tests**: Never implement without failing tests first
❌ **Large commits**: Keep commits to 20-30 lines maximum for clarity
❌ **Magic numbers**: Always extract to configuration constants
❌ **Inline test data**: Use separate test files or fixtures
❌ **Ignoring linter warnings**: Fix all issues before committing
❌ **Duplicate code**: Always survey existing code for reuse opportunities
❌ **Skipping edge cases**: Always test boundary conditions and error paths

### Development Best Practices (Follow)
✅ **TDD workflow**: Red → Green → Refactor cycle for all features
✅ **TODO planning**: Break features into small, manageable tasks
✅ **Code reuse first**: Survey and extend existing code before writing new
✅ **Small commits**: 20-30 lines maximum with clear descriptions
✅ **Extract constants**: Move configuration to `src/config/default.ts`
✅ **Comprehensive testing**: Test happy path, edge cases, and error conditions
✅ **Security-first thinking**: Always consider security implications
✅ **Clear naming**: Use descriptive names for functions, variables, and tests

### Feature Development Checklist

Before starting any feature:
1. ☐ Create TodoWrite plan breaking feature into small tasks
2. ☐ Survey existing code for reuse opportunities
3. ☐ Write failing tests that define expected behavior
4. ☐ Implement minimal code to pass tests
5. ☐ Refactor while keeping tests green
6. ☐ Commit in 20-30 line increments with clear messages
7. ☐ Run all tests, linting, and type checking before final commit
8. ☐ Ensure security implications are considered and documented
