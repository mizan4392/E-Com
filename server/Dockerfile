# ---------------------------
# Stage 1: Build the NestJS app
# ---------------------------
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY .env ./
# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of the app
COPY . .

# Build the NestJS app
RUN npm run build

# ---------------------------
# Stage 2: Run the NestJS app
# ---------------------------
FROM node:20-alpine AS runner

# Set working directory
WORKDIR /usr/src/app

# Copy only the compiled dist folder and necessary files
COPY --from=builder /usr/src/app/dist ./dist
COPY package*.json ./
COPY .env ./

# Install only production dependencies
RUN npm install --only=production --legacy-peer-deps

# Runtime controls for optional local-seed execution
ENV SEED_ON_START=true
ENV SEED_CLEAR=true

# Expose the port (default 4000 for NestJS)
EXPOSE 4000

# Command to run the app
CMD ["sh", "-c", "if [ \"$SEED_ON_START\" = \"true\" ] || [ \"$SEED_ON_START\" = \"1\" ]; then if [ \"$SEED_CLEAR\" = \"true\" ] || [ \"$SEED_CLEAR\" = \"1\" ]; then node dist/seeder/seed.js --clear; else node dist/seeder/seed.js; fi; fi; node dist/main.js"]
