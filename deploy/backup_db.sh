#!/bin/bash

echo Export Database Star Wars Battlefront
read -r -p 'DB host: ' host 
echo "$host"
read -r -p  'Output Path: ' InputOutPath
outPath=$(echo "$InputOutPath" | sed -e 's#^J:##' -e 's#\\#/#g')
echo "$outPath"

echo Copying Labels...
mongoexport -h "$host" -d tada-test -c label -o "$outPath"/label.json
echo Labels Copied

echo Copying Label Cache...
mongoexport -h "$host" -d tada-test -c label_cache -o "$outPath"/label_cache.json
echo Label Cache Copied

echo Copying Stats...
mongoexport -h "$host" -d tada-test -c stats -o "$outPath"/stats.json
echo Stats Copied

echo Copying Meta Labels...
mongoexport -h "$host" -d tada-test -c meta_label -o "$outPath"/meta_label.json
echo Meta Labels Copied

echo Copying Videos...
mongoexport -h "$host" -d tada-test -c video -o "$outPath"/video.json
echo Videos Copied
