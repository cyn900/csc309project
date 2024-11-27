# Use the official Go image as the base image
FROM golang:1.18-alpine

# Set the working directory
WORKDIR /app

# Dynamically create Main.go
RUN cat <<EOF > Main.go
package main

import "fmt"

func main() {
    fmt.Println("Hello, dynamically created Main.go!")
}
EOF

# Initialize a Go module with a valid module path
RUN go mod init example.com/app

# Tidy up modules and build the application
RUN go mod tidy && go build -o app .

# Default command to run the application
CMD ["./app"]
