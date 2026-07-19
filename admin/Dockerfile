

# ====== 1. Base build stage ======
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies only when needed
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./

# If using npm
RUN npm install --legacy-peer-deps

COPY . .
COPY .env .env

# Build the Next.js app
RUN npm run build

# ====== 2. Production runner ======
FROM node:20-alpine AS runner

WORKDIR /app

# Set NODE_ENV
ENV NODE_ENV=production
ENV PORT=3000

# Copy only built output and node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

# Expose port
EXPOSE 3000

# Start the Next.js server
CMD ["npm", "start"]
