.PHONY: help install dev dev-be dev-fe redis-up redis-down build lint test db-setup db-reset db-seed docker-build docker-up docker-down docker-seed docker-logs docker-rebuild

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
	@echo "  make docker-up     Chạy Redis+BE+FE bằng docker (DB ở server riêng, cần .env)"
	@echo "  make docker-seed   Seed dữ liệu HSK vào DB (chạy 1 lần nếu DB trống)"
	@echo "  make docker-baseline  Baseline migration (chỉ khi DB đã có bảng từ db push)"
	@echo "  make docker-logs   Xem log các container"
	@echo "  make docker-down   Dừng & xoá container (giữ volume dữ liệu)"

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

# DB MySQL 8.0 NGOÀI — cần DATABASE_URL trong backend/.env
# Chạy lại sau khi pull code có migration mới (backend/prisma/migrations/).
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

# Chạy Redis + Backend + Frontend bằng docker (MySQL ở server riêng qua DATABASE_URL).
# Cần file .env ở thư mục gốc (xem .env.docker.example). Lần đầu nếu DB trống: make docker-seed.
docker-up:
	docker compose up -d --build
	@echo "✅ FE: http://localhost:3000 · BE: http://localhost:4000/api"
	@echo "➡️  Nếu DB trống, nạp dữ liệu:  make docker-seed"

# Rebuild sạch (khi đổi Dockerfile/deps).
docker-rebuild:
	docker compose build --no-cache
	docker compose up -d

# Seed dữ liệu HSK + demo user (demo@migii.local / demo1234) vào DB trong docker.
docker-seed:
	docker compose exec backend pnpm run db:seed

# BASELINE 1 LẦN: nếu DB đã có sẵn bảng do `db push` (chưa có _prisma_migrations)
# thì đánh dấu migration hiện tại là "đã áp dụng" để migrate deploy không báo P3005.
# CHỈ chạy khi schema DB đang khớp với migration đó. DB trống thì BỎ QUA bước này.
# Dùng `run` (one-off) vì lúc này container backend có thể đang restart-loop.
docker-baseline:
	docker compose run --rm --no-deps backend pnpm exec prisma migrate resolve --applied 20260706034449
	docker compose up -d backend

docker-logs:
	docker compose logs -f

docker-down:
	docker compose down
