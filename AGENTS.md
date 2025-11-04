# Repository Guidelines

## Project Structure & Module Organization
- `src/` — TypeScript source. Key areas: `index.ts` (Express app), `routes/`, `middleware/`, `utils/`, `config/`, `constants/`, `types/`.
- Tests live in `src/__tests__/` and any `*.test.ts` files under `src/`.
- Build output in `dist/`; coverage in `coverage/`; API docs in `docs/swagger.json`.
- Tooling: `jest.config.js`, `eslint.config.mjs` (ESLint flat config), `tsconfig.json`, `Makefile`, `Dockerfile`.

## Build, Test, and Development Commands
- `npm ci` — Install exact dependencies.
- `npm run dev` — Start dev server with reload (`tsx watch`).
- `npm run build` — Compile TypeScript to `dist/`.
- `npm start` — Run built app.
- `npm test` / `npm run test:coverage` — Run Jest (ts-jest) with optional coverage.
- `npm run lint` / `npm run lint:fix` — Lint and auto-fix.
- `npm run type-check` — TypeScript checks without emit.
- `npm run swagger:generate` — Regenerate OpenAPI spec.
- Make shortcuts: `make all`, `make dev`, `make test-coverage`, `make docs`, `make help`.
  - Docker helpers: `docker-build`, `docker-up`, `docker-down`, `docker-logs`.
  - Postman/Newman: `postman-run-local` (local newman).

## Coding Style & Naming Conventions
- TypeScript strict mode; Node `>=18`. Target `ES2022` (CommonJS runtime with TypeScript; dev uses ESM for ESLint config).
- Use 2-space indentation, semicolons, and kebab-case filenames (`security-analyzer.ts`).
- Naming: `camelCase` vars/functions, `PascalCase` types/interfaces, `UPPER_SNAKE_CASE` constants.
- ESLint (`@typescript-eslint`, flat config): no unused vars (underscore to ignore), avoid `any`.
- Lint config file: `eslint.config.mjs` (ESM). Use `npm run lint` / `npm run lint:fix`.

## Testing Guidelines
- Framework: Jest with `ts-jest` (`testEnvironment: node`).
- Place tests in `src/__tests__/` or `*.test.ts`; use Supertest for HTTP.
- Test setup: `src/test/setup.ts` sets `NODE_ENV=test`.
- Aim for meaningful coverage on analyzers and routes; run `npm run test:coverage`.

## Commit & Pull Request Guidelines
- Use Conventional Commits with ticket scope when available.
  - Example: `[PF-123](feat): validate K6 protocol imports`.
- PRs must: describe changes, link issues, note config/env impacts, and update docs (`npm run swagger:generate`) when APIs change.
- CI runs type-check, lint, tests, and build; ensure green before merge. CODEOWNERS auto-request reviews.

## Security & Configuration Tips
- Never execute user-submitted scripts; validators must analyze text only.
- Update limits in `src/config/default.ts` (e.g., `maxScriptSize`, `maxVUs`) and keep body limits aligned.
- Environment: `PORT`, `HOST`, `CORS_ORIGINS`.
- Avoid logging sensitive script content; follow existing preview logging in `index.ts`.
- Example env file: `.env.example`. Docker context excludes dev files via `.dockerignore`.

## Postman / Integration Tests
- Postman collection lives under `postman/` (default `collection.json`) with a local environment at `postman/local.postman_environment.json`.
- Run locally: `make postman-run-local` (requires `newman`).
- Run in Docker: `make postman-run-up` (builds app, waits for health, runs collection).

## CI/CD
- `docker-build.yml`: builds and pushes image to GHCR with tag `sha-<commit>`, among others.
- `integration-tests.yml`: triggered by `workflow_run` after a successful build; pulls the `sha-<commit>` image, runs Postman CLI, and publishes the HTML report to GitHub Pages.
- `release.yml`: semantic-release on `main` to automate SemVer, changelog, tags, and GitHub Releases.
