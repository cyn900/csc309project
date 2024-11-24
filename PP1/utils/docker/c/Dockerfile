FROM gcc:latest

# Set the working directory inside the container
WORKDIR /app

# Dynamically create main.c
RUN echo '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}' > main.c

# Compile the C application
RUN gcc -o app main.c

# Default command to run the application
CMD ["./app"]
