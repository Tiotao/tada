#!/bin/bash

echo Import Database Star Wars Battlefront
read -r -p 'DB host: ' host 
echo "$host"
read -r -p  'Input Path: ' InputInPath
inPath=$(echo "$InputInPath" | sed -e 's#^J:##' -e 's#\\#/#g')
echo "$inPath"


echo Copying Labels...
mongo "$host"/tada-test --eval 'db.label.drop()'
mongoimport -h "$host" -d tada-test -c label --file "$inPath"/label.json
echo Labels Copied

echo Copying Label Cache...
mongo "$host"/tada-test --eval 'db.label_cache.drop()'
mongoimport -h "$host" -d tada-test -c label_cache --file "$inPath"/label_cache.json
echo Label Cache Copied

echo Copying Stats...
mongo "$host"/tada-test --eval 'db.stats.drop()'
mongoimport -h "$host" -d tada-test -c stats --file "$inPath"/stats.json
echo Stats Copied

echo Copying Meta Labels...
mongo "$host"/tada-test --eval 'db.meta_label.drop()'
mongoimport -h "$host" -d tada-test -c meta_label --file "$inPath"/meta_label.json
echo Meta Labels Copied

echo Copying Videos...
mongo "$host"/tada-test --eval 'db.video.drop()'
mongoimport -h "$host" -d tada-test -c video --file "$inPath"/video.json
echo Videos Copied
