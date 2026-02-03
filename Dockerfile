ARG MODE=production

# ---------- base ----------
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---------- development ----------
FROM node:20-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start:dev"]

# ---------- production ----------
FROM node:20-slim AS production
WORKDIR /app

RUN groupadd -r nodejs -g 1001 && useradd -r nestjs -u 1001 -g nodejs

COPY --from=base --chown=nestjs:nodejs /app/package*.json ./
RUN npm ci --omit=dev

COPY --from=base --chown=nestjs:nodejs /app/dist ./dist
COPY --from=base --chown=nestjs:nodejs /app/healthcheck.js ./

USER nestjs
EXPOSE 3000
CMD ["npm", "run", "start:prod"]

FROM ${MODE} AS final
