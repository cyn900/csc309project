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
