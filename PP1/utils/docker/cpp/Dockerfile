# Use an official GCC runtime as the base image
FROM gcc:12

# Set the working directory
WORKDIR /app

# Dynamically create Main.cpp
RUN echo '#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}' > Main.cpp

# Compile the C++ application using g++
RUN g++ Main.cpp -o Main -lstdc++


# Default command
CMD ["./Main"]
