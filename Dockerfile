# Use Node.js base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy files
COPY . .

# Install dependencies
RUN npm install

# Expose port
EXPOSE 8080

# Run server
CMD ["node", "server.js"]

