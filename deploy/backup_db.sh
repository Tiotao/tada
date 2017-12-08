#!/bin/bash

echo Export Database Star Wars Battlefront
read -r -p 'DB host: ' host 
echo "$host"
read -r -p 'DB name: ' dbname
echo "$dbname"
read -r -p  'Output Path: ' InputOutPath
outPath=$(echo "$InputOutPath" | sed -e 's#^J:##' -e 's#\\#/#g')
echo "$outPath"

echo Copying Labels...
mongoexport -h "$host" -d "$dbname" -c label -o "$outPath"/"$dbname"_label.json
echo Labels Copied

echo Copying Label Cache...
mongoexport -h "$host" -d "$dbname" -c label_cache -o "$outPath"/"$dbname"_label_cache.json
echo Label Cache Copied

echo Copying Stats...
mongoexport -h "$host" -d "$dbname" -c stats -o "$outPath"/"$dbname"_stats.json
echo Stats Copied

echo Copying Meta Labels...
mongoexport -h "$host" -d "$dbname" -c meta_label -o "$outPath"/"$dbname"_meta_label.json
echo Meta Labels Copied

echo Copying Videos...
mongoexport -h "$host" -d "$dbname" -c video -o "$outPath"/"$dbname"_video.json
echo Videos Copied
