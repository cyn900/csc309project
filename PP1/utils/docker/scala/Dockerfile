# Use an official OpenJDK runtime as the base image
FROM openjdk:17-slim

# Set the working directory
WORKDIR /app

# Copy application files
COPY . /app

# Compile the Scala application
RUN scalac Main.scala

# Default command
CMD ["scala", "Main"]
