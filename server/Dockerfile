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

# Expose the port (default 3000 for NestJS)
EXPOSE 3000

# Command to run the app
CMD ["node", "dist/main.js"]
