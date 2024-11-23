# Use the official Rust image as the base image
FROM rust:latest

# Set the working directory
WORKDIR /app

# Create a writable temporary directory and set it as the TMPDIR
RUN mkdir -p /app/tmp && chmod 777 /app/tmp
ENV TMPDIR=/app/tmp

# Create a default Cargo.toml file if it doesn't exist
RUN echo '[package]\nname = "app"\nversion = "0.1.0"\nedition = "2021"\n\n[dependencies]' > Cargo.toml

# Create a default main.rs file if it doesn't exist
RUN mkdir -p src && echo 'fn main() {\n    println!("Hello from Rust!");\n}' > src/main.rs

# Copy application files (overwrites existing ones if provided in the context)
COPY . /app

# Verify that TMPDIR exists and is writable before building
RUN mkdir -p $TMPDIR && chmod 777 $TMPDIR

# Build the Rust application
RUN cargo build --release

# Default command
CMD ["./target/release/app"]
