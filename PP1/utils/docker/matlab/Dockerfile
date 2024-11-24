# MATLAB runtime requires a specific MATLAB image
FROM mathworks/matlab:r2022b

# Set the working directory
WORKDIR /app

# Copy application files
COPY . /app

# Default command
CMD ["matlab", "-batch", "main"]
