# Makefile
.PHONY: install lint lint-fix test test-coverage build docker-build docker-up docker-down docker-logs postman-run-local dev docs type-check help all

# Defaults (can be overridden: make docker-build TAG=v1)
IMAGE ?= k6-script-validator
TAG ?= latest
PORT ?= 3000
HOST ?= 0.0.0.0
RUN_ARGS ?=
COLLECTION ?= postman/collection.json

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

docker-build: ## Build Docker image with TAG (IMAGE, TAG vars)
	docker build -t $(IMAGE):$(TAG) .

docker-up: ## Build and run container detached (IMAGE, TAG, PORT, HOST, RUN_ARGS)
	$(MAKE) docker-build && docker run -d --rm --name $(IMAGE) -p $(PORT):$(PORT) -e PORT=$(PORT) -e HOST=$(HOST) $(RUN_ARGS) $(IMAGE):$(TAG)

docker-down: ## Stop running container (by name IMAGE)
	-docker stop $(IMAGE)

docker-logs: ## Tail logs of running container (by name IMAGE)
	@docker logs -f $(IMAGE)

dev: ## Start dev server with reload
	npm run dev

# Type checking
type-check: ## TypeScript type-check without emit
	npm run type-check

# Generate API documentation
docs: ## Generate OpenAPI spec
	npm run swagger:generate

# All checks (lint + test + build)
all: lint test build ## Run lint, test, and build
