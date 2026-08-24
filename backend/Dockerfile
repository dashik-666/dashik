# build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --silent
COPY tsconfig.json ./
COPY src ./src
COPY scripts ./scripts
RUN npm run build

# runtime stage
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package*.json ./
RUN npm ci --omit=dev --silent
COPY --from=build /app/dist ./dist
EXPOSE 10000
CMD ["node", "dist/app.js"]
