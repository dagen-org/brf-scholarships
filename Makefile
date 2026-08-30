make .PHONY: up down logs setup dev-backend dev-frontend install install-backend install-frontend install-hooks lint test

VENV   := backend/.venv
PYTHON := $(VENV)/bin/python
PIP    := $(VENV)/bin/pip

# ── Docker ──────────────────────────────────────────────────────────────────

up:
	podman compose up -d

down:
	podman compose down

logs:
	podman compose logs -f

# ── Setup ────────────────────────────────────────────────────────────────────

setup: up
	@echo "Waiting for services to be ready..."
	@sleep 3
	$(PYTHON) backend/scripts/setup_local.py

# ── Development ──────────────────────────────────────────────────────────────

dev-backend:
	cd backend && .venv/bin/uvicorn app.main:app --reload --port 8080 --host 0.0.0.0

dev-frontend:
	cd frontend && npm run dev

# ── Install ──────────────────────────────────────────────────────────────────

install: install-backend install-frontend install-hooks

$(VENV):
	python3 -m venv $(VENV)

install-backend: $(VENV)
	$(PIP) install -r backend/requirements.txt -r backend/requirements-dev.txt

install-frontend:
	cd frontend && npm install

install-hooks:
	git config core.hooksPath .githooks

# ── Quality ──────────────────────────────────────────────────────────────────

lint:
	$(VENV)/bin/ruff check backend/app
	cd frontend && npm run lint

test:
	cd backend && ../$(VENV)/bin/pytest
