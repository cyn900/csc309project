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
