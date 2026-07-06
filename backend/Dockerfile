# Migii HSK Backend — NestJS. DB MySQL 8.0 CHẠY NGOÀI (truyền qua DATABASE_URL).
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app

# --- deps ---
FROM base AS deps
COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma
COPY prisma.config.ts ./
# postinstall chạy `prisma generate` (cần schema) → đã copy prisma ở trên.
RUN pnpm install --frozen-lockfile || pnpm install

# --- build ---
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm exec prisma generate && pnpm run build

# --- runtime ---
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./
COPY package.json ./
# src + tsconfig để chạy seed bằng ts-node (seed.ts import từ ../src/*).
COPY --from=build /app/src ./src
COPY --from=build /app/tsconfig.json ./
# assets tĩnh (audio/image) mount qua volume khi chạy; tạo sẵn thư mục.
RUN mkdir -p /app/assets
EXPOSE 4000
# Chạy migration đã review (migrate deploy — CHUẨN production, không mất dữ liệu) rồi start.
# DB ở server riêng phải sẵn sàng qua DATABASE_URL.
# LƯU Ý: nếu DB đã có sẵn bảng do `db push` (chưa có _prisma_migrations),
# lần đầu phải baseline 1 lần: `make docker-baseline` (xem Makefile).
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node dist/src/main"]
