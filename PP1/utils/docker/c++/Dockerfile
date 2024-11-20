# Use an official GCC runtime as the base image
FROM gcc:12

# Set the working directory
WORKDIR /app

# Copy application files
COPY . /app

# Compile the C/C++ application
RUN g++ -o app main.cpp || gcc -o app main.c

# Default command
CMD ["./app"]
