# Use an official Debian runtime as the base image
FROM debian:latest

# Set the working directory
WORKDIR /app

# Copy application files
COPY . /app

# Grant execute permissions to the main script (if required)
RUN chmod +x main.sh

# Default command
CMD ["bash", "main.sh"]
