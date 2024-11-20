# Use an official Golang runtime as the base image
FROM golang:1.18-alpine

# Set the working directory
WORKDIR /app

# Copy application files
COPY . /app

# Build the application
RUN go build -o app .

# Default command
CMD ["./app"]
