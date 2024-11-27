#!/bin/bash

chmod u+x startup.sh
./startup.sh

# cd ..

# Define the .env file path
ENV_FILE=".env"

# Create or overwrite the .env file
cat <<EOL > $ENV_FILE
DATABASE_URL="postgresql://johndoe:randompassword@localhost:5432/mydb?schema=public"


ACCESS_TOKEN_SECRET="843789jjeejldkeJDdjejkflrWJerjklerfjrelfre9f9"
REFRESH_TOKEN_SECRET="843789jjeejldkeJDdjejkGrWJercfhgvgfjrelfre9f9"
ACCESS_EXPIRES_IN="30m"
REFRESH_EXPIRES_IN="7d"
BCRYPT_SALT_ROUNDS=10
EOL

cd ./utils/docker

chmod u+x ./build_docker_images.sh
./build_docker_images.sh

cd ..
cd ..

npx next dev
