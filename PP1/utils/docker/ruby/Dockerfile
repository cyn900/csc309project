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
