# Use the official Go image as the base image
FROM golang:1.18-alpine

# Set the working directory
WORKDIR /app

# Copy application files (overwrites default files if provided in the context)
COPY . /app

# Create a valid go.mod file if one doesn't exist
RUN [ ! -f go.mod ] && echo 'module example.com/app\n\ngo 1.18' > go.mod || true

# Create a default main.go file if one doesn't exist
RUN [ ! -f main.go ] && echo 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello from Go!")\n}' > main.go || true

# Build the Go application
RUN go mod tidy && go build -o app .

# Default command to run the application
CMD ["./app"]
