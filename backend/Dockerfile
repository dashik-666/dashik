# ---- build storefront (玩家端前端) ----
FROM node:20-alpine AS storefront
WORKDIR /app
RUN npm install -g pnpm@9
COPY storefront/package.json storefront/pnpm-lock.yaml ./
RUN pnpm install
COPY storefront/ ./
ENV VITE_API_BASE=/api/v1/store
RUN pnpm run build-only

# ---- build backend ----
FROM node:20-alpine AS build
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --silent
COPY backend/tsconfig.json ./
COPY backend/src ./src
COPY backend/scripts ./scripts
RUN npm run build

# ---- runtime 阶段：托管后端 + storefront 静态文件 ----
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package*.json ./
RUN npm ci --omit=dev --silent
COPY --from=build /app/dist ./dist
COPY --from=storefront /app/dist ./storefront
EXPOSE 10000
CMD ["node", "dist/app.js"]
