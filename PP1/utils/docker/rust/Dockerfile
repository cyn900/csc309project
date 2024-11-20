# Use an official Rust runtime as the base image
FROM rust:latest

# Set the working directory
WORKDIR /app

# Copy application files
COPY . /app

# Build the Rust application
RUN cargo build --release

# Default command
CMD ["./target/release/app"]
