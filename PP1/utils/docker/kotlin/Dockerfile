# Use an official OpenJDK runtime as the base image
FROM openjdk:17-slim

# Set the working directory
WORKDIR /app

# Copy application files
COPY . /app

# Compile the Kotlin application
RUN kotlinc main.kt -include-runtime -d app.jar

# Default command
CMD ["java", "-jar", "app.jar"]
