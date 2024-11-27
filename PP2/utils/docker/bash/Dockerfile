# Use Alpine Linux as the base image
FROM alpine:latest

# Install bash
RUN apk add --no-cache bash

# Set the working directory
WORKDIR /app

# Create a default main.sh file if it doesn't exist
RUN echo '#!/bin/bash\necho "Hello from Bash!"' > main.sh

# Copy application files (overwrites main.sh if provided in the context)
COPY . /app

# Make sure main.sh is executable
RUN chmod +x main.sh

# Default command to run the main.sh script
CMD ["./main.sh"]
