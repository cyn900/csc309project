# Use an official Haskell runtime as the base image
FROM haskell:latest

# Set the working directory
WORKDIR /app

# Copy application files
COPY . /app

# Compile the Haskell program
RUN ghc -o app Main.hs

# Default command
CMD ["./app"]
