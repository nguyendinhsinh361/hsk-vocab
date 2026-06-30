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
# assets tĩnh (audio/image) mount qua volume khi chạy; tạo sẵn thư mục.
RUN mkdir -p /app/assets
EXPOSE 4000
# Migrate khi khởi động rồi chạy server (DB ngoài phải sẵn sàng).
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node dist/src/main"]
