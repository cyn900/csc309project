## Run.sh Script Readme

To initialize the application, type in:
- chmod u+x ./run.sh
- ./run.sh

In the event that it doesn't work, type in the following commands in the terminal:

-npm install @prisma/client
-npm install bcrypt
-npm install express
-npm install jsonwebtoken
-npm install multer
-npm install next
-npm install react
-npm install react-dom
-npm install uuid
-npm install -g dotenv-cli
-npx prisma generate --schema=../prisma/schema.prisma
-npx prisma migrate dev --schema=../prisma/schema.prisma 
-node ./setupAdmin.js
-cd ..

Copy and paste the following into the terminal:

ENV_FILE=".env"
cat <<EOL > $ENV_FILE
DATABASE_URL="postgresql://johndoe:randompassword@localhost:5432/mydb?schema=public"


ACCESS_TOKEN_SECRET="843789jjeejldkeJDdjejkflrWJerjklerfjrelfre9f9"
REFRESH_TOKEN_SECRET="843789jjeejldkeJDdjejkGrWJercfhgvgfjrelfre9f9"
ACCESS_EXPIRES_IN="30m"
REFRESH_EXPIRES_IN="7d"
BCRYPT_SALT_ROUNDS=10
EOL

Finally, run the application with: 
- npx next dev
