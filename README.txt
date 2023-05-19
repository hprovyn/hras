###External Dependencies###

Download these five files to your HRAS scripts directory, rename them as specified:

---

from github.com/pa7/heatmap.js:

heatmap.min.js
leaflet-heatmap.js

---

leaflet171.js
leaflet171.css

---

jquery.min.js  (v3.2.1)


###Build instructions###

1. Set your instance URLs and tile server URL variables in the config.txt
2. run createDocumentation.sh
   This creates two files: documentationLinks.html, documentationPage.html
3. run createHRASphp.sh
   This creates hras.php
4. move the three generated files to the directory corresponding to your HRAS root URL
5. move heatmapCommon.php to the same place

After this, your code is ready. However HRAS needs a data directory to function.

###Data directory###

@Todo

