#SET PARAMS FROM CONFIG
#THIS MUST BE ABSOLUTE PATH TO CONFIG FILE
CFG_FILE=/var/lib/hras/config.txt
CFG_CONTENT=$(cat $CFG_FILE | sed -r '/[^=]+=[^=]+/!d' | sed -r 's/\s+=\s/=/g')
eval "$CFG_CONTENT"
echo $hrasScriptsURL
echo $hrasDataURL
echo $hrasImagesURL
sed 's,$hrasScriptsURL,'"$hrasScriptsURL"',g' "hras_template.php" > "hras.php"
sed -i 's,$hrasImagesURL,'"$hrasImagesURL"',g' "hras.php"
sed -i 's,$hrasDataURL,'"$hrasDataURL"',g' "hras.php"
sed -i 's,$hrasRootURL,'"$hrasRootURL"',g' "hras.php"
sed -i 's,$tileServerURL,'"$tileServerURL"',g' "hras.php"







