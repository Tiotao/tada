#!/bin/bash

echo Import Database Star Wars Battlefront
read -r -p 'DB host: ' host 
echo "$host"
read -r -p  'Input Path: ' InputInPath
inPath=$(echo "$InputInPath" | sed -e 's#^J:##' -e 's#\\#/#g')
echo "$inPath"


echo Copying Labels...
mongoimport -h "$host" -d tada-test -c label --file "$inPath"/label.json --mode upsert
echo Labels Copied

echo Copying Label Cache...
mongoimport -h "$host" -d tada-test -c label_cache --file "$inPath"/label_cache.json --mode upsert
echo Label Cache Copied

echo Copying Stats...
mongoimport -h "$host" -d tada-test -c stats --file "$inPath"/stats.json --mode upsert
echo Stats Copied

echo Copying Meta Labels...
mongoimport -h "$host" -d tada-test -c meta_label --file "$inPath"/meta_label.json --mode upsert
echo Meta Labels Copied

echo Copying Videos...
mongoimport -h "$host" -d tada-test -c video --file "$inPath"/video.json --mode upsert
echo Videos Copied
