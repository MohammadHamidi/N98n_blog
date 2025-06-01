# Backend Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Create uploads directory
RUN mkdir -p uploads

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001

# Change ownership of uploads directory
RUN chown -R nodeuser:nodejs /app/uploads

# Switch to non-root user
USER nodeuser

# Expose port
EXPOSE 3000

# Health check - Fixed to handle errors properly
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => { process.exit(1) })"
# Start the application
CMD ["node", "src/app.js"]