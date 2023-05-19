#SET PARAMS FROM CONFIG
#THIS MUST BE ABSOLUTE PATH TO CONFIG FILE
CFG_FILE=/var/lib/hras/config.txt
CFG_CONTENT=$(cat $CFG_FILE | sed -r '/[^=]+=[^=]+/!d' | sed -r 's/\s+=\s/=/g')
eval "$CFG_CONTENT"
echo $hrasScriptsURL
echo $hrasDataURL
echo $hrasImagesURL
sed 's,$hrasScriptsURL,'"$hrasScriptsURL"',g' "documentationLinks_template.html" > "documentationLinks.html"
sed -i 's,$hrasImagesURL,'"$hrasImagesURL"',g' "documentationLinks.html"
sed 's,$hrasScriptsURL,'"$hrasScriptsURL"',g' "documentationPage_template.html" > "documentationPage.html"
sed -i 's,$hrasImagesURL,'"$hrasImagesURL"',g' "documentationPage.html"
sed -i 's,$hrasDataURL,'"$hrasDataURL"',g' "documentationPage.html"






