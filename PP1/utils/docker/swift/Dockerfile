# Use an official Swift runtime as the base image
FROM swift:5.7

# Set the working directory
WORKDIR /app

# Copy application files
COPY . /app

# Build the Swift application
RUN swift build -c release

# Default command
CMD [".build/release/app"]
