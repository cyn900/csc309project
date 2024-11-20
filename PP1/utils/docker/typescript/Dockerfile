# Use an official Node.js runtime as the base image
FROM node:16-alpine

# Set the working directory
WORKDIR /app

# Copy application files
COPY . /app

# Install dependencies
RUN npm install

# Default command
CMD ["node", "index.js"]
