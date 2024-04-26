<?php

global $cladeFinderResult, $mapType, $leafletMapURL, $installationRootURL, $imagesDir, $scriptsRootURL, $dataRootURL, $commonHeatmapJS_source_url, $updateManifestFile, $dnaType, $helpLink, $title, $description, $instructionsLink, $heatmapIconDNAtype, $baseDir, $allProjects, $denomURLprefix, $minRadius, $autocompletionFile, $treeUrlSuffix, $cladeFinderURL, $additionalScripts;
echo '<html><head><style>
body {
    padding: 2;
    margin: 2;
}
html, body, #lmap {
    height: 100%;
            width: 100%;
    
}
</style></head><body>';

if (isset($_GET["hg"])) {
    processGetHG(str_replace(array("<",">",";","\"","script"),"",trim($_GET["hg"])));
} else {
    processGetHG("");
}

function processGetHG($hg) {
echo "<script>var url_param_hg = \"" . $hg . "\"</script>";
}

?>
<div id="lmap"></div>
<div id="denom"></div>
<link rel="stylesheet" href="<?php echo $scriptsRootURL . "leaflet171.css"?>"/>
<link rel="stylesheet" href="<?php echo $scriptsRootURL . "piechart.css"?>"/>
<link rel="stylesheet" href="<?php echo $scriptsRootURL . "range-slider.css"?>"/>

<script src="<?php echo $scriptsRootURL . "leaflet171.js"?>"></script>
<script src="<?php echo $scriptsRootURL . "leaflet.geodesic"?>"></script>
<script src="<?php echo $scriptsRootURL . "jquery.min.js"?>"></script>
<script src="<?php echo $scriptsRootURL . "treeCommon.js"?>"></script>
<script src="<?php echo $scriptsRootURL . "samplesParsing.js"?>"></script>

<script>
var dataRootURL = "<?php echo $dataRootURL; ?>";
var imagesDir = "<?php echo $imagesDir; ?>";
var installationRootURL = "<?php echo $installationRootURL; ?>";
var scriptsRootURL = "<?php echo $scriptsRootURL; ?>";
var leafletMapURL = "<?php echo $leafletMapURL; ?>";
var cladeFinderResultString = <?php echo json_encode($cladeFinderResult); ?>;
var cladeFinderResult = null;
if (cladeFinderResultString != "") {
	cladeFinderResult = JSON.parse(cladeFinderResultString)
		if (cladeFinderResult && cladeFinderResult.hasOwnProperty('clade')) {
			url_param_hg = cladeFinderResult['clade']
	}
}
</script>
<script src="<?php echo $scriptsRootURL . "heatmapCommonRefactored.js"?>"></script>
<script src="<?php echo $scriptsRootURL . "heatmapLayerSampleRate.js"?>"></script>
<script src="<?php echo $scriptsRootURL . "deviationMetrics.js"?>"></script>
<script src="<?php echo $scriptsRootURL . "lonBuckets.js"?>"></script>
<script src="<?php echo $scriptsRootURL . "onTheFlyAncient.js"?>"></script>
<script src="<?php echo $scriptsRootURL . "articles.js"?>"></script>


<script src="<?php echo $commonHeatmapJS_source_url; ?>"></script>

<?php
foreach ($additionalScripts as $additionalScript) {
    echo '<script src="' . $additionalScript . '"></script>';
} ?>

<script>

var updateManifestFile = "<?php echo $updateManifestFile;?>";
getManifest();
var lmap;
var heatmapLayer = null;
var pointLayer = null;
var sampleMap = {};

var title = "<?php echo $title;?>";
var description = "<?php echo $description;?>";
var baseDir = "<?php echo $baseDir;?>";
var allProjects = JSON.parse(('<?php echo str_replace("'", "apos", json_encode($allProjects)); ?>').replaceAll("apos","'"));
var denomURLprefix = "<?php echo $denomURLprefix;?>";
var minRadius = <?php echo $minRadius;?>;
var autocompletionFile = "<?php echo $autocompletionFile;?>";
var treeUrlSuffix = "<?php echo $treeUrlSuffix;?>";
var cladeFinderURL = "<?php echo $cladeFinderURL;?>";

var markers = {}
var circ = {}

var watermark = {};

var dnaType = "<?php echo $dnaType; ?>";
var mapType = "<?php echo $mapType; ?>";

function leafletMap() {
    lmap = L.map('lmap', {zoomSnap:0.5, zoomDelta:0.5, zoom:2, zoomControl: false, tap: false}).fitWorld();

    L.tileLayer(leafletMapURL, {
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
                '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, '
        }).addTo(lmap);

    addHeatMap();
    loadOnTheFlyAncientKits()
}

leafletMap();

var mapIcon, selectedIcon;

function addWatermark() {
    L.Control.Watermark = L.Control.extend({
        onAdd: function(map) {
            var text = L.DomUtil.create('div');
            text.id = "info_text";
            text.innerHTML = getWatermarkFromTemplate(title, description, version);
            text.innerHTML += "<br><form style='margin-top:5px' autocomplete='off' id='lookup' onsubmit='submitNewClade();'><div class='autocomplete' style='width:150px;' overflow='scroll'><input type='text' style='width:150px;' id='newlookup' name='newlookup'  placeholder='SNP or haplogroup' ></div></form>"
            text.innerHTML += '<div id="livingDeadControlDiv"></div>'
            text.innerHTML += '<div id="ontheflyancientslider"></div>'
            text.innerHTML += '<div id="pieChartCheckboxDiv"></div>'
            text.innerHTML += '<div id="radius"></div>';
            text.innerHTML += '<div class="slidecontainer"><input type="range" min="1" max="3" value="2" class="slider" id="myRange" style="width:50%" onchange="updateMapRadiusChanged()"></div>';
            text.innerHTML += 'Intensity&nbsp;<div class="slidecontainer"><input type="range" min="1" max="20" value="3" class="slider" id="hardmaxRange" style="width:50%" onchange="updateMapMaxChangedCommon()"></div>';
            //text.innerHTML += '<div id="hardmax"></div>';
            text.innerHTML += '<div id="legend"></div>'
            
            text.style.width = '270px'
            return text;
        },

        onRemove: function(map) {
            // Nothing to do here
        }
    });

    L.control.watermark = function(opts) {
        return new L.Control.Watermark(opts);
    }

    watermark = L.control.watermark({ position: 'topleft'})
    watermark.addTo(lmap);
    setIconActive(dnaType)
    setIconActive(mapType)
}

function addHeatMap() {
    mapIcon = L.icon({
        iconUrl: 'images/marker-red.png',
        shadowUrl: 'images/marker-shadow.png',
        iconSize:     [32, 44], // size of the icon
    shadowSize:   [64, 89], // size of the shadow
    iconAnchor:   [16, 44], // point of the icon which will correspond to marker's location
    shadowAnchor: [32, 89],  // the same for the shadow
    popupAnchor:  [0, -54] // point from which the popup should open relative to the iconAnchor

      })

    selectedIcon =L.icon({
        iconUrl: 'images/marker-yellow.png',
        shadowUrl: 'images/marker-shadow.png',
        iconSize:     [32, 44], // size of the icon
    shadowSize:   [64, 89], // size of the shadow
    iconAnchor:   [16, 44], // point of the icon which will correspond to marker's location
    shadowAnchor: [32, 89],  // the same for the shadow
    popupAnchor:  [0, -54] // point from which the popup should open relative to the iconAnchor

      })

      lmap.setZoom(2);

    addWatermark()
    var info = document.getElementById('info_text')

    // Disable dragging when user's cursor enters the element
    info.addEventListener('mouseover', function () {
        lmap.dragging.disable();
    });

    // Re-enable dragging when user's cursor leaves the element
    info.addEventListener('mouseout', function () {
        lmap.dragging.enable();
    });
    
    L.control.zoom({
        position: 'topright'
    }).addTo(lmap);
}

var project = null
var clade = null
function submitNewCladeByInteraction(subclade) {
	updatedTo90th = false
	clade = subclade
		document.getElementById('newlookup').value = project + "->" + clade
    loadKitsBelowSubclade(project,clade)
    if (layerStates['livingDead'] != 'ancient') {
	    loadTargetAndAddToMap()
		    updateSliderTo90thPercentile()
    } else {
        updateFrequencyMapForAncientInterval()
    }
    
    applyCountryFiltersAndRecalcCentroids()

    if (countryCoordsAndCountsLoaded == false) {
        loadCountryCoordsAndCounts()
    }
    removePreviousOptionalLayersAndReloadLastEnabled()

}

var oa = {}
function submitNewClade() {
    var newValue = document.getElementById('newlookup').value
	    if (entries.indexOf(newValue) != -1) {
		    oa = {}
			    updatedTo90th = false
        var newValueSplit = newValue.split(" ")
        var hgAndClade = newValueSplit[newValueSplit.length-1].split("->")
        project = hgAndClade[0]
        clade = hgAndClade[1]
        loadTree(project)
        loadKitsBelowSubclade(project,clade)
        layerStates['samples'] = false
        if (layerStates['livingDead'] != 'ancient') {
		loadTargetAndAddToMap()
			updateSliderTo90thPercentile()
        } else {
            updateFrequencyMapForAncientInterval()
        }
		    removePreviousOptionalLayersAndClearNecessaryStates()
			    getOldestAncient(project)
        applyCountryFiltersAndRecalcCentroids()

        if (countryCoordsAndCountsLoaded == false) {
            loadCountryCoordsAndCounts()
        }
        if (mapType == "alpha" && document.getElementById('livingDeadControlDiv').innerHTML == "") {
            addLivingDeadControl()
        }
        addUpdateCentroidsControls()

    } else {
        alert (newValue + " not valid")
    }
}

loadSNPMap()
layerStates['livingDead'] = 'living'
updateMapRadiusChanged()
</script>
</body>
</html>
