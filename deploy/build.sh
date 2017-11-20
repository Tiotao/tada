#!/bin/bash
echo Deploying Tada Server...
read -r -p 'server environment: ' env 
echo "$env"

echo stopping server...
forever stop server.js

echo pulling the latest version...
git pull origin master
npm install

echo building front-end...
cd react
npm install
npm run-script build
cd ..

echo restart server...
forever start server.js --env="$env"