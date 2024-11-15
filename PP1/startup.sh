#!/bin/bash

rm -rf node_modules

npm install @prisma/client
npm install bcrypt
npm install express
npm install jsonwebtoken
npm install multer
npm install next
npm install react
npm install react-dom
npm install uuid
npm install -g dotenv-cli
npx prisma generate

node ./setupAdmin.js
