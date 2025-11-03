# Repository Guidelines

## Project Structure & Module Organization
- `src/` — TypeScript source. Key areas: `index.ts` (Express app), `routes/`, `middleware/`, `utils/`, `config/`, `constants/`, `types/`.
- Tests live in `src/__tests__/` and any `*.test.ts` files under `src/`.
- Build output in `dist/`; coverage in `coverage/`; API docs in `docs/swagger.json`.
- Tooling: `jest.config.js`, `.eslintrc.js`, `tsconfig.json`, `Makefile`, `Dockerfile`.

## Build, Test, and Development Commands
- `npm ci` — Install exact dependencies.
- `npm run dev` — Start dev server with reload (`ts-node-dev`).
- `npm run build` — Compile TypeScript to `dist/`.
- `npm start` — Run built app.
- `npm test` / `npm run test:coverage` — Run Jest (ts-jest) with optional coverage.
- `npm run lint` / `npm run lint:fix` — Lint and auto-fix.
- `npm run type-check` — TypeScript checks without emit.
- `npm run swagger:generate` — Regenerate OpenAPI spec.
- Make shortcuts: `make all`, `make dev`, `make test-coverage`, `make docs`.

## Coding Style & Naming Conventions
- TypeScript strict mode; Node `>=18`. Target `ES2022` (CommonJS).
- Use 2-space indentation, semicolons, and kebab-case filenames (`security-analyzer.ts`).
- Naming: `camelCase` vars/functions, `PascalCase` types/interfaces, `UPPER_SNAKE_CASE` constants.
- ESLint (`@typescript-eslint`): no unused vars (underscore to ignore), avoid `any`.

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
