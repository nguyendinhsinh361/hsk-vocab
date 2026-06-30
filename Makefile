.PHONY: help install dev dev-be dev-fe build lint test redis-up redis-down db-setup db-reset db-seed docker-build

help:
	@echo "Migii HSK Vocab — lệnh thường dùng"
	@echo "  make install     Cài deps BE + FE (pnpm)"
	@echo "  make redis-up    Bật Redis (docker-compose)"
	@echo "  make redis-down  Tắt Redis"
	@echo "  make dev         Chạy BE (:4000) + FE (:3000) song song"
	@echo "  make db-setup    Prisma migrate + generate + seed (DB NGOÀI)"
	@echo "  make db-reset    Reset DB (xoá + migrate + seed)"
	@echo "  make build       Build BE + FE"
	@echo "  make lint        Lint BE + FE"
	@echo "  make test        Test BE (jest)"
	@echo "  make docker-build  Build image BE + FE"

install:
	cd backend && pnpm install
	cd frontend && pnpm install

redis-up:
	docker compose up -d redis

redis-down:
	docker compose down

# Chạy song song; Ctrl+C dừng cả hai.
dev: redis-up
	@trap 'kill 0' INT; \
	(cd backend && pnpm start:dev) & \
	(cd frontend && pnpm dev) & \
	wait

dev-be:
	cd backend && pnpm start:dev

dev-fe:
	cd frontend && pnpm dev

# DB Postgres NGOÀI — cần DATABASE_URL trong backend/.env
db-setup:
	cd backend && pnpm exec prisma migrate dev && pnpm exec prisma generate && pnpm run db:seed

db-reset:
	cd backend && pnpm exec prisma migrate reset --force

db-seed:
	cd backend && pnpm run db:seed

build:
	cd backend && pnpm run build
	cd frontend && pnpm run build

lint:
	cd backend && pnpm run lint
	cd frontend && pnpm run lint

test:
	cd backend && pnpm test

docker-build:
	docker build -t migii-hsk-backend ./backend
	docker build -t migii-hsk-frontend ./frontend
