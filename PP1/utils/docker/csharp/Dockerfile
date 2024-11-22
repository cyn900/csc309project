# Use an official .NET runtime as the base image
FROM mcr.microsoft.com/dotnet/sdk:6.0

WORKDIR /app
COPY . /app
RUN dotnet restore
RUN dotnet build -c Release -o /app/out
CMD ["dotnet", "/app/out/YourApp.dll"]
