# Makefile
.PHONY: install lint lint-fix test test-coverage build build-image docker-build docker-run docker-up docker-down docker-logs wait-up postman-run postman-run-up postman-run-local run dev clean clean-coverage docs type-check dev-test help all

# Defaults (can be overridden: make docker-build TAG=v1)
IMAGE ?= k6-script-validator
TAG ?= latest
PORT ?= 3000
HOST ?= 0.0.0.0
RUN_ARGS ?=
NETWORK ?= $(IMAGE)-net
COLLECTION ?= postman/collection.json
# When running Newman inside Docker against an app on the host, use host.docker.internal
BASE_URL ?= http://host.docker.internal:$(PORT)

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

docker-network: ## Create Docker network if missing (NETWORK)
	@docker network inspect $(NETWORK) > /dev/null 2>&1 || docker network create $(NETWORK)

docker-up: ## Build and run container detached (IMAGE, TAG, PORT, HOST, RUN_ARGS)
	$(MAKE) docker-build && $(MAKE) docker-network && docker run -d --rm --name $(IMAGE) --network $(NETWORK) -p $(PORT):$(PORT) -e PORT=$(PORT) -e HOST=$(HOST) $(RUN_ARGS) $(IMAGE):$(TAG)

docker-down: ## Stop running container (by name IMAGE)
	-docker stop $(IMAGE)

docker-logs: ## Tail logs of running container (by name IMAGE)
	@docker logs -f $(IMAGE)
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
