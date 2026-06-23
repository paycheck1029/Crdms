# Stage 1: Base image
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# Stage 2: Backend Dependencies
FROM base AS backend-deps
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production

# Stage 3: Frontend Dependencies
FROM base AS frontend-deps
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci

# Stage 4: Frontend Builder
FROM base AS frontend-builder
WORKDIR /app
COPY --from=frontend-deps /app/frontend/node_modules ./frontend/node_modules
COPY frontend ./frontend
WORKDIR /app/frontend
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NODE_ENV=production
# Disable Next.js telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 5: Backend Runner
FROM base AS backend
ENV NODE_ENV=production
WORKDIR /app/backend
COPY --from=backend-deps /app/backend/node_modules ./node_modules
COPY backend ./
# Create logs and uploads directory in container
RUN mkdir -p logs uploads && chown -R node:node /app/backend
USER node
EXPOSE 5000
CMD ["npm", "start"]

# Stage 6: Frontend Runner
FROM base AS frontend
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
WORKDIR /app/frontend
COPY --from=frontend-builder /app/frontend/.next ./.next
COPY --from=frontend-builder /app/frontend/public ./public
COPY --from=frontend-builder /app/frontend/node_modules ./node_modules
COPY --from=frontend-builder /app/frontend/package.json ./package.json
COPY --from=frontend-builder /app/frontend/next.config.mjs ./next.config.mjs
# Next.js telemetry disabled in production
ENV NEXT_TELEMETRY_DISABLED=1
USER node
EXPOSE 3000
CMD ["npm", "start"]
