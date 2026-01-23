# Base stage for building
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application (Frontend + Backend)
# This script creates dist/public (from Vite) and dist/index.cjs (from esbuild)
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install production dependencies only (if needed for externals)
# Note: The build script bundles some deps, but external ones might be needed.
# For safety, we'll install production deps.
COPY package*.json ./
RUN npm ci --only=production

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist

# Copy any necessary static files or configuration if needed
# COPY --from=builder /app/public ./public 

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# Start command
CMD ["node", "dist/index.cjs"]
