.PHONY: help install dev dev-be dev-fe redis-up redis-down build lint test db-setup db-reset db-seed docker-build

help:
	@echo "Migii HSK Vocab — lệnh thường dùng"
	@echo "  make install     Cài deps BE + FE (pnpm)"
	@echo "  make redis-up    Bật Redis cache (docker) — tuỳ chọn"
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

# Chạy BE trước, ĐỢI :4000 sẵn sàng rồi mới chạy FE (tránh proxy /api bị ECONNREFUSED).
# Ctrl+C dừng cả hai. Cần MySQL NGOÀI (DATABASE_URL trong backend/.env).
# Redis là tuỳ chọn (cache) — bật bằng `make redis-up` nếu muốn tăng tốc.
dev:
	@trap 'kill 0' INT; \
	(cd backend && pnpm start:dev) & \
	echo "⏳ Đợi backend sẵn sàng ở http://localhost:4000 …"; \
	n=0; until nc -z localhost 4000 2>/dev/null || [ $$n -ge 120 ]; do sleep 0.5; n=$$((n+1)); done; \
	if nc -z localhost 4000 2>/dev/null; then \
		echo "✅ Backend đã lên — khởi động frontend"; \
	else \
		echo "⚠️  Backend chưa lên sau 60s (kiểm tra MySQL/DATABASE_URL) — vẫn chạy frontend"; \
	fi; \
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
