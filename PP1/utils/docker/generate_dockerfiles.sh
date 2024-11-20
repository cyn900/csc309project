#!/bin/bash

# Define the list of programming languages
languages=("Python" "JavaScript" "Java" "C++" "C" "C#" "Go" "TypeScript" "Ruby" "PHP" "Swift" \
           "Kotlin" "Scala" "Perl" "Rust" "Bash" "MATLAB" "R" "Haskell" "Elixir")

# Generate Dockerfiles for each programming language
for language in "${languages[@]}"; do
  # Normalize the folder name
  folder=$(echo "$language" | tr '[:upper:]' '[:lower:]' | tr ' ' '_')

  # Create a folder for the language if it doesn't already exist
  mkdir -p "$folder"

  # Define the Dockerfile path
  dockerfile="$folder/Dockerfile"

  # Check if the Dockerfile already exists
  if [[ -f "$dockerfile" ]]; then
    echo "Dockerfile for $language already exists. Skipping."
    continue
  fi

  # Generate a basic Dockerfile for the language
  echo "Generating Dockerfile for $language..."
  case "$language" in
    "Python")
      cat > "$dockerfile" <<EOL
# Use an official Python runtime as the base image
FROM python:3.9-slim

# Set the working directory
WORKDIR /app

# Copy application files
COPY . /app

# Install dependencies
RUN pip install -r requirements.txt || true

# Default command
CMD ["python"]
EOL
      ;;
    "JavaScript" | "TypeScript")
      cat > "$dockerfile" <<EOL
# Use an official Node.js runtime as the base image
FROM node:16-alpine

# Set the working directory
WORKDIR /app

# Copy application files
COPY . /app

# Install dependencies
RUN npm install

# Default command
CMD ["node", "index.js"]
EOL
      ;;
    "Java")
      cat > "$dockerfile" <<EOL
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
EOL
      ;;
    "C++" | "C")
      cat > "$dockerfile" <<EOL
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
EOL
      ;;
    "C#")
      cat > "$dockerfile" <<EOL
# Use an official .NET runtime as the base image
FROM mcr.microsoft.com/dotnet/sdk:6.0

# Set the working directory
WORKDIR /app

# Copy application files
COPY . /app

# Restore dependencies
RUN dotnet restore

# Build the application
RUN dotnet build -c Release -o /app/out

# Default command
CMD ["dotnet", "/app/out/YourApp.dll"]
EOL
      ;;
    "Go")
      cat > "$dockerfile" <<EOL
# Use an official Golang runtime as the base image
FROM golang:1.18-alpine

# Set the working directory
WORKDIR /app

# Copy application files
COPY . /app

# Build the application
RUN go build -o app .

# Default command
CMD ["./app"]
EOL
      ;;
    "Ruby")
      cat > "$dockerfile" <<EOL
# Use an official Ruby runtime as the base image
FROM ruby:3.1-slim

# Set the working directory
WORKDIR /app

# Copy application files
COPY . /app

# Install dependencies
RUN bundle install || true

# Default command
CMD ["ruby", "app.rb"]
EOL
      ;;
    "PHP")
      cat > "$dockerfile" <<EOL
# Use an official PHP runtime as the base image
FROM php:8.1-apache

# Set the working directory
WORKDIR /app

# Copy application files
COPY . /var/www/html/

# Expose port 80 for the web server
EXPOSE 80
EOL
      ;;
    "Swift")
      cat > "$dockerfile" <<EOL
# Use an official Swift runtime as the base image
FROM swift:5.7

# Set the working directory
WORKDIR /app

# Copy application files
COPY . /app

# Build the Swift application
RUN swift build -c release

# Default command
CMD [".build/release/app"]
EOL
      ;;
    "Kotlin")
      cat > "$dockerfile" <<EOL
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
EOL
      ;;
    "Scala")
      cat > "$dockerfile" <<EOL
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
EOL
      ;;
    "Perl")
      cat > "$dockerfile" <<EOL
# Use an official Perl runtime as the base image
FROM perl:latest

# Set the working directory
WORKDIR /app

# Copy application files
COPY . /app

# Default command
CMD ["perl", "main.pl"]
EOL
      ;;
    "Rust")
      cat > "$dockerfile" <<EOL
# Use an official Rust runtime as the base image
FROM rust:latest

# Set the working directory
WORKDIR /app

# Copy application files
COPY . /app

# Build the Rust application
RUN cargo build --release

# Default command
CMD ["./target/release/app"]
EOL
      ;;
    "MATLAB")
      cat > "$dockerfile" <<EOL
# MATLAB runtime requires a specific MATLAB image
FROM mathworks/matlab:r2022b

# Set the working directory
WORKDIR /app

# Copy application files
COPY . /app

# Default command
CMD ["matlab", "-batch", "main"]
EOL
      ;;
    "R")
      cat > "$dockerfile" <<EOL
# Use an official R runtime as the base image
FROM r-base:latest

# Set the working directory
WORKDIR /app

# Copy application files
COPY . /app

# Install any necessary R packages
RUN Rscript -e "install.packages('ggplot2', repos='http://cran.rstudio.com/')"

# Default command
CMD ["Rscript", "main.R"]
EOL
      ;;
    "Haskell")
      cat > "$dockerfile" <<EOL
# Use an official Haskell runtime as the base image
FROM haskell:latest

# Set the working directory
WORKDIR /app

# Copy application files
COPY . /app

# Compile the Haskell program
RUN ghc -o app Main.hs

# Default command
CMD ["./app"]
EOL
      ;;
    "Elixir")
      cat > "$dockerfile" <<EOL
# Use an official Elixir runtime as the base image
FROM elixir:latest

# Set the working directory
WORKDIR /app

# Copy application files
COPY . /app

# Install dependencies and compile Elixir application
RUN mix local.hex --force && mix deps.get && mix compile

# Default command
CMD ["elixir", "main.exs"]
EOL
      ;;
    "Bash")
      cat > "$dockerfile" <<EOL
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
EOL
      ;;
    *)
      echo "No template defined for $language. Skipping."
      ;;
  esac

  echo "Dockerfile for $language generated at $dockerfile."
done

echo "All Dockerfiles generated."
