# Use an official .NET runtime as the base image
FROM mcr.microsoft.com/dotnet/sdk:6.0

# Set the working directory
WORKDIR /app

# Dynamically create the project
RUN dotnet new console -o /app

# Overwrite the default Program.cs file with our custom code
RUN echo 'using System;\n\nclass Program {\n    static void Main(string[] args) {\n        Console.WriteLine("Hello, World!");\n    }\n}' > /app/Program.cs

# Build the application
RUN dotnet build -c Release -o /app/out

# Default command
CMD ["dotnet", "/app/out/app.dll"]
