#!/bin/bash

echo Import Database Star Wars Battlefront
read -r -p 'DB host: ' host 
echo "$host"
read -r -p 'DB name: ' dbname
echo "$dbname"
read -r -p  'Input Path: ' InputInPath
inPath=$(echo "$InputInPath" | sed -e 's#^J:##' -e 's#\\#/#g')
echo "$inPath"


echo Copying Labels...
mongo "$host"/"$dbname" --eval 'db.label.drop()'
mongoimport -h "$host" -d "$dbname" -c label --file "$inPath"/"$dbname"_label.json
echo Labels Copied

echo Copying Label Cache...
mongo "$host"/"$dbname" --eval 'db.label_cache.drop()'
mongoimport -h "$host" -d "$dbname" -c label_cache --file "$inPath"/"$dbname"_label_cache.json
echo Label Cache Copied

echo Copying Stats...
mongo "$host"/"$dbname" --eval 'db.stats.drop()'
mongoimport -h "$host" -d "$dbname" -c stats --file "$inPath"/"$dbname"_stats.json
echo Stats Copied

echo Copying Meta Labels...
mongo "$host"/"$dbname" --eval 'db.meta_label.drop()'
mongoimport -h "$host" -d "$dbname" -c meta_label --file "$inPath"/"$dbname"_meta_label.json
echo Meta Labels Copied

echo Copying Videos...
mongo "$host"/"$dbname" --eval 'db.video.drop()'
mongoimport -h "$host" -d "$dbname" -c video --file "$inPath"/"$dbname"_video.json
echo Videos Copied
