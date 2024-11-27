#!/bin/bash

# Set the destination directory for libraries
LIB_DIR="./lib"

# Create the lib directory if it doesn't exist
mkdir -p "$LIB_DIR"

# Update package lists
echo "Updating package lists..."
sudo apt-get update

# Install commonly used C++ libraries
echo "Installing necessary C++ libraries..."
sudo apt-get install -y \
    build-essential \
    g++ \
    libstdc++6 \
    libboost-all-dev \
    libssl-dev \
    libcurl4-openssl-dev \
    libsqlite3-dev \
    zlib1g-dev

# List of libraries to copy
LIBRARIES=(
    "/usr/lib/x86_64-linux-gnu/libstdc++.so.6"
    "/usr/lib/x86_64-linux-gnu/libboost_system.so"
    "/usr/lib/x86_64-linux-gnu/libboost_filesystem.so"
    "/usr/lib/x86_64-linux-gnu/libssl.so"
    "/usr/lib/x86_64-linux-gnu/libcrypto.so"
    "/usr/lib/x86_64-linux-gnu/libcurl.so"
    "/usr/lib/x86_64-linux-gnu/libsqlite3.so"
    "/usr/lib/x86_64-linux-gnu/libz.so"
)

# Copy the libraries to the lib directory
echo "Copying libraries to $LIB_DIR..."
for LIB in "${LIBRARIES[@]}"; do
    if [ -f "$LIB" ]; then
        cp "$LIB" "$LIB_DIR"
        echo "Copied: $LIB"
    else
        echo "Warning: Library not found: $LIB"
    fi
done

echo "All done! Libraries are in $LIB_DIR."
