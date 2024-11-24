#!/bin/bash

# Define the list of programming languages
languages=("Python" "JavaScript" "Java" "C++" "C" "C#" "Go" "TypeScript" "Ruby" "Rust" "Bash" "MATLAB" "R" "Haskell")

# Generate Dockerfiles for each programming language
for language in "${languages[@]}"; do
  # Normalize the folder name
  folder=$(echo "$language" | tr '[:upper:]' '[:lower:]' | tr ' ' '_' | sed 's/++/pp/g' | sed 's/#/sharp/g')

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

WORKDIR /app
COPY . /app
RUN pip install -r requirements.txt || true
CMD ["python"]
EOL
      ;;
    "JavaScript" | "TypeScript")
      cat > "$dockerfile" <<EOL
# Use an official Node.js runtime as the base image
FROM node:16-alpine

WORKDIR /app
COPY . /app
RUN npm install
CMD ["node", "index.js"]
EOL
      ;;
    "Java")
      cat > "$dockerfile" <<EOL
# Use an official OpenJDK runtime as the base image
FROM openjdk:17-slim

WORKDIR /app
COPY . /app
RUN javac Main.java
CMD ["java", "Main"]
EOL
      ;;
    "C++" | "C")
      cat > "$dockerfile" <<EOL
# Use an official GCC runtime as the base image
FROM gcc:12

WORKDIR /app
RUN echo '#include <iostream>\n\nint main() {\n    std::cout << "TESTING" << std::endl;\n    return 0;\n}' > main.cpp
RUN g++ -o app main.cpp
CMD ["./app"]
EOL
      ;;
    "C#")
      cat > "$dockerfile" <<EOL
# Use an official .NET runtime as the base image
FROM mcr.microsoft.com/dotnet/sdk:6.0

WORKDIR /app
COPY . /app
RUN dotnet restore
RUN dotnet build -c Release -o /app/out
CMD ["dotnet", "/app/out/YourApp.dll"]
EOL
      ;;
    "Go")
      cat > "$dockerfile" <<EOL
# Use an official Golang runtime as the base image
FROM golang:1.18-alpine

WORKDIR /app
COPY . /app
RUN go build -o app .
CMD ["./app"]
EOL
      ;;
    "Ruby")
      cat > "$dockerfile" <<EOL
# Use an official Ruby runtime as the base image
FROM ruby:3.1-slim

WORKDIR /app
COPY . /app
RUN bundle install || true
CMD ["ruby", "app.rb"]
EOL
      ;;
    "Rust")
      cat > "$dockerfile" <<EOL
# Use an official Rust runtime as the base image
FROM rust:latest

WORKDIR /app
COPY . /app
RUN cargo build --release
CMD ["./target/release/app"]
EOL
      ;;
    "Bash")
      cat > "$dockerfile" <<EOL
# Use an official Debian runtime as the base image
FROM debian:latest

WORKDIR /app
COPY . /app
RUN chmod +x main.sh
CMD ["bash", "main.sh"]
EOL
      ;;
    "MATLAB")
      cat > "$dockerfile" <<EOL
# MATLAB runtime requires a specific MATLAB image
FROM mathworks/matlab:r2022b

WORKDIR /app
COPY . /app
CMD ["matlab", "-batch", "main"]
EOL
      ;;
    "R")
      cat > "$dockerfile" <<EOL
# Use an official R runtime as the base image
FROM r-base:latest

WORKDIR /app
COPY . /app
RUN Rscript -e "install.packages('ggplot2', repos='http://cran.rstudio.com/')"
CMD ["Rscript", "main.R"]
EOL
      ;;
    "Haskell")
      cat > "$dockerfile" <<EOL
# Use an official Haskell runtime as the base image
FROM haskell:latest

WORKDIR /app
COPY . /app
RUN ghc -o app Main.hs
CMD ["./app"]
EOL
      ;;
    *)
      echo "No template defined for $language. Skipping."
      ;;
  esac

  echo "Dockerfile for $language generated at $dockerfile."
done

echo "All Dockerfiles generated."
