FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY src ./src
COPY .env* ./
COPY config.yaml ./

# Set environment to production
ENV NODE_ENV=production

# Expose port
EXPOSE 8080

# Drop privileges
USER node

# Start the application
CMD ["node", "src/server.js"]
