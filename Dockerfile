ARG MODE=production

FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM base AS development
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001
RUN chown -R nestjs:nodejs /app
USER nestjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js
CMD ["npm", "run", "start:dev"]

FROM node:20-slim AS production
WORKDIR /app
COPY --from=base /app/package*.json ./
RUN npm ci --only=production
COPY --from=base /app/dist ./dist
COPY --from=base /app/healthcheck.js ./
RUN groupadd -r nodejs -g 1001 && useradd -r nestjs -u 1001 -g nodejs
RUN chown -R nestjs:nodejs /app
USER nestjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js
CMD ["npm", "run", "start:prod"]

FROM ${MODE} AS final