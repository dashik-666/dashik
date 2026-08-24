# build stage
FROM node:20-alpine AS build
WORKDIR /app
# 仅拷贝依赖清单以利用缓存
COPY package*.json ./
COPY pnpm-lock.yaml ./
# 使用 pnpm 安装依赖
RUN npm i -g pnpm@9 && pnpm i --frozen-lockfile --silent
# 拷贝项目源码
COPY . .
# 注入构建期环境变量供 Vite 使用
ARG VITE_APP_BASE_API=/api
ENV VITE_APP_BASE_API=$VITE_APP_BASE_API
# 构建
RUN pnpm build

# runtime stage
FROM nginx:1.27-alpine
WORKDIR /usr/share/nginx/html
COPY --from=build /app/dist .
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
