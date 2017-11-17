#!/bin/bash

echo Build React

echo stopping server...
forever stop server.js

echo pulling the latest version...
git pull origin master
npm install

echo building front end
cd react
npm install
npm run-script build
cd ..

echo restart server...
forever start server.js