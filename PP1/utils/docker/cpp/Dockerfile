FROM ubuntu:22.04

# Install build tools, GCC, and G++
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    g++ \
    libstdc++-12-dev \
    && rm -rf /var/lib/apt/lists/*

# Set a working directory
WORKDIR /app

# Dynamically create Main.cpp
RUN echo '#include <iostream>\n\nint main() {\n    std::cout << "Hello" << std::endl;\n    return 0;\n}' > Main.cpp

# Compile the application
RUN g++ Main.cpp -o app

# Default command
CMD ["./app"]
