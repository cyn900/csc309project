# Use an official OpenJDK runtime as the base image
FROM openjdk:17-slim

# Set the working directory
WORKDIR /app

# Copy application files
COPY . /app

# Compile the Java application
RUN javac Main.java

# Default command
CMD ["java", "Main"]
