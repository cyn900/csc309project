# Use an official GCC runtime as the base image
FROM gcc:12

# Set the working directory
WORKDIR /app

# Dynamically create main.cpp
RUN echo '#include <iostream>\n\nint main() {\n    std::cout << "TESTING" << std::endl;\n    return 0;\n}' > main.cpp

# Verify the generated file
RUN cat main.cpp

# Compile the C++ application
RUN g++ -o app main.cpp

# Default command
CMD ["./app"]
