# Makefile
.PHONY: install lint lint-fix test test-coverage build build-image docker-build docker-run run dev clean clean-coverage docs type-check dev-test help all

# Defaults (can be overridden: make docker-build TAG=v1)
IMAGE ?= k6-script-validator
TAG ?= latest
PORT ?= 3000
HOST ?= 0.0.0.0
RUN_ARGS ?=

help: ## Show this help
	@echo "Available targets:" && \
	awk 'BEGIN {FS = ":.*?## "}; /^[a-zA-Z0-9_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST) | sort

install: ## Install exact dependencies
	npm ci

lint: ## Lint source files
	npm run lint

lint-fix: ## Lint and auto-fix issues
	npm run lint:fix

test: ## Run tests
	npm run test

test-coverage: ## Run tests with coverage
	npm run test:coverage

build: ## Compile TypeScript to dist/
	npm run build

build-image: ## Build Docker image (no tag)
	docker build .

docker-build: ## Build Docker image with TAG (IMAGE, TAG vars)
	docker build -t $(IMAGE):$(TAG) .

docker-run: ## Run Docker image exposing PORT (IMAGE, TAG, PORT, HOST, RUN_ARGS)
	docker run --rm -p $(PORT):$(PORT) -e PORT=$(PORT) -e HOST=$(HOST) $(RUN_ARGS) $(IMAGE):$(TAG)

run: build ## Build and start app
	npm start

dev: ## Start dev server with reload
	npm run dev

clean: ## Remove build and dependencies
	rm -rf dist/ node_modules/

clean-coverage: ## Remove coverage artifacts
	rm -rf coverage/

# Type checking
type-check: ## TypeScript type-check without emit
	npm run type-check

# Development helpers
dev-test: ## Jest watch mode
	npm run test:watch

# Generate API documentation
docs: ## Generate OpenAPI spec
	npm run swagger:generate

# All checks (lint + test + build)
all: lint test build ## Run lint, test, and build
