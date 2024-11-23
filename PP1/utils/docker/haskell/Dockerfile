# Use an official Haskell runtime as the base image
FROM haskell:latest

# Set the working directory
WORKDIR /app

# Create a dummy Main.hs file if not already provided
RUN echo "main = putStrLn \"Hello, Haskell!\"" > Main.hs

# Copy application files (overwrites Main.hs if it's in the context)
COPY . /app

# Compile the Haskell program
RUN ghc -o app Main.hs

# Default command
CMD ["./app"]
