#!/bin/bash

chmod u+x startup.sh
./startup.sh

npx prisma generate

cd ..
npx next dev
