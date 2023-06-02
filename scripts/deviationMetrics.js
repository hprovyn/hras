function computeCentroid(points, clade, subclades) {
    var sumlat = 0;
    var sumlon = 0;
    var weightTotal = 0;
    for (var i = 0; i < points.length; i++) {
        var thisPoint = points[i]
        var interval = tmrca[clade]
        var isAncient = false
        if (tmrca.hasOwnProperty(subclades[i])) {
            interval = tmrca[clade] - tmrca[subclades[i]]
        } else {
            if (ancient.hasOwnProperty(subclades[i])) {
                interval = Math.max(0,tmrca[clade] - ancient[subclades[i]]['ybp'])
                isAncient = true
            }
        }
        var weight = getNodeWeight(interval, tmrca[clade], isAncient)
        sumlat += thisPoint[0] * weight
        sumlon += thisPoint[1] * weight
        weightTotal += weight
    }
    if (weightTotal == 0) {
        return {}
    }
    return {"centroid": [sumlat/weightTotal, sumlon/weightTotal]}
}

function getBestPoint(points, clade, subcladeNames) {
    var bestPoint = points[0]
    var bestDist = getAvgDistance(bestPoint, points, clade, subcladeNames)
    for (var i = 1; i < points.length; i++) {
        var thisDist = getAvgDistance(points[i], points, clade, subcladeNames)
        if (thisDist['weightedMean'] < bestDist['weightedMean']) {
            bestDist = thisDist
            bestPoint = points[i]
        }
    }
    return {"point": bestPoint, "distanceMetrics": bestDist}
}

var kilometersPerDegree = 111.3
function getDistance(a,b) {

    var coslat = Math.cos((a[0] + b[0]) / 2 * Math.PI / 180)
    return Math.sqrt((a[0]-b[0])*(a[0]-b[0])*coslat*coslat+(a[1]-b[1])*(a[1]-b[1]))
}

function getMedian(arr) {
    arr.sort(function(a, b){return a - b})
    if (arr.length % 2 == 1) {
        return arr[(arr.length-1)/2]
    } else {
        return (arr[(arr.length/2)] + arr[(arr.length/2-1)])/2
    }
}

var minNodeWeight = 1
var maxNodeWeight = 3
var nodeWeightRange = maxNodeWeight - minNodeWeight
var isAncientMultiplier = 2

function getNodeWeight(interval, parentAge, isAncient) {
    var weight = minNodeWeight + nodeWeightRange * (parentAge - interval) / parentAge
    if (isAncient) {
        return weight * isAncientMultiplier
    } else {
        return weight
    }
}

function getWeightedMean(distances, intervals, parentAge, areAncient) {
    var sum = 0;
    var weights = 0;
    for (var i = 0; i < distances.length; i++) {
        var weight = getNodeWeight(intervals[i], parentAge, areAncient[i])
        sum += distances[i] * weight
        weights += weight
    }
    return sum / weights
}
function getAvgDistance(point, points, clade, subclades) {
    var sum = 0;
    var distances = []
    var intervals = []
    var areAncient = []
    for (var i = 0; i < points.length; i++) {
        var thisDist = getDistance(point, points[i])
        distances.push(thisDist)
        sum += thisDist
        var interval = tmrca[clade]
        var isAncient = false
        if (tmrca.hasOwnProperty(subclades[i])) {
            interval = tmrca[clade]-tmrca[subclades[i]]
        } else {            
            if (ancient.hasOwnProperty(subclades[i])) {
                interval = Math.max(0,tmrca[clade] - ancient[subclades[i]]['ybp'])
                isAncient = true
            }
        }
        intervals.push(interval)
        areAncient.push(isAncient)
    }
    var distancesCopy = [...distances]
    var weightedMean = getWeightedMean(distances,intervals,tmrca[clade], areAncient)
    return {"mean": sum/points.length, "weightedMean": weightedMean, "median": getMedian(distances),"max":Math.max(...distances), "intervals": intervals, "distances": distancesCopy, "subclades": subclades, "positions":points}
}

function average(point1, point2) {
    return [(point1[0]+point2[0])/2,(point1[1]+point2[1])/2]
}

function computeCentroidAndDeviation(clade,allPoints,mode) {
    var cladePoints = allPoints[clade]
    var cladeCentroids = []
    var subcladeNames = []
    var childCentroids = {}
    if (cladePoints) {
        for (var i = 0; i < cladePoints.length; i++) {
            cladeCentroids.push([cladePoints[i][0],cladePoints[i][1]])
            subcladeNames.push(cladePoints[i][3])            
        }
    }
    var children = getChildren(clade)
    for (var i = 0; i < children.length; i++) {
        var childResult = computeCentroidAndDeviation(children[i], allPoints,mode)
        if (childResult.hasOwnProperty("centroid")) {
            cladeCentroids.push(childResult['centroid'])
            subcladeNames.push(children[i])
            childCentroids[children[i]] = childResult
        }
    }
    var centroidResult = computeCentroid(cladeCentroids, clade, subcladeNames)
    if (centroidResult.hasOwnProperty('centroid')) {
        var thecentroid = centroidResult['centroid']
        var centroidMetrics = getAvgDistance(thecentroid, cladeCentroids, clade, subcladeNames)
        if (cladeCentroids.length > 2) {
            if (mode == "centroid") {
                return {'centroid': thecentroid, 'distanceMetrics':centroidMetrics, 'children': childCentroids}
            } else {
                if (mode == "centroidOrBestPoint") {
                    var bestPoint = getBestPoint(cladeCentroids, clade, subcladeNames)
                    if (bestPoint["distanceMetrics"]['weightedMean'] < centroidMetrics['weightedMean']) {
                        return {'centroid': bestPoint['point'], 'distanceMetrics':bestPoint["distanceMetrics"],'children': childCentroids}
                    } else {
                        return {'centroid': thecentroid, 'distanceMetrics':centroidMetrics,'children': childCentroids}
                    }
                } else {
                    var bestPointResult = getBestPoint(cladeCentroids, clade, subcladeNames)
                    var bestPoint = bestPointResult["point"]
                    var averagePoint = average(bestPoint, thecentroid)
                    var theavgdist = getAvgDistance(averagePoint, cladeCentroids, clade, subcladeNames)
                    return {'centroid': averagePoint, 'distanceMetrics':theavgdist,'children': childCentroids}
                }
            }
        } else {
            return {'centroid': thecentroid, 'distanceMetrics':centroidMetrics,'children': childCentroids}
        }
    } else {
        return {}
    }
}

function getSubcladeDeviationMarkerSVG(txt, color, opacity) {
    var width = 128
    if (txt == "") {
        width = 64
    }
    var thesvg = '<svg viewBox="0 0 '+width+' 64" opacity="'+opacity+'" fill="none">'
    thesvg += '<ellipse rx="47%" ry="47%" cx="50%" cy="50%" stroke="black" stroke-width="4" fill="'+color+'"></ellipse>'
    thesvg += '<text font-weight="bold" textLength="96" font-size="3em" lengthAdjust="spacingAndGlyphs" x="12.5%" y="71%" fill="black">'+txt+'</text></svg>'
    return thesvg
}

function getSubcladeDeviationDiamondSVG(color, opacity) {
    var thesvg = '<svg viewBox="0 0 64 64" opacity="'+opacity+'" fill="none">'
    thesvg += '<polygon points="32,0 64,32 32,64 0,32" stroke="black" stroke-width="4" fill="'+color+'">'
    //thesvg += '<text font-weight="bold" textLength="96" font-size="3em" lengthAdjust="spacingAndGlyphs" x="12.5%" y="71%" fill="black">'+txt+'</text></svg>'
    return thesvg

}

function createSubcladeIcon(subclade, size, color) {
    var width = size * 2
    if (subclade == "") {
        width = size
    }
    return L.divIcon({
        html: getSubcladeDeviationMarkerSVG(subclade,color,'75%'),
        className: "deviation-circle",
        iconSize: [width,size]
      });
}

function createLesserSubcladeIcon(size,color) {


    return L.divIcon({
        html: getSubcladeDeviationDiamondSVG(color,'75%'),
        className: "deviation-diamond",
        iconSize: [size,size]
      });
}

function getOffset(r, points) {
    dx =  points[1][0] - points[0][0] 
    dy =  points[1][1] - points[0][1]
    dist = Math.sqrt(dx*dx+dy*dy)
    if (dist == 0) {
        return [0,r]
    }
    return [r*dx/dist, r*dy/dist]
}

function getYSEQIconNoOffset(color, title) {
    if (dnaType == 'y') {
        thehtml = getAmpelmannSVG(color,20, title)
    } else {
        thehtml = getAmpelwomanSVG(color,20, title)
    }
    var theicon = L.divIcon({
        html: thehtml,
        className: "deviation-circle",
        iconSize:     [20, 20], // size of the icon
        iconAnchor:   [10,10],//[23, 10], // point of the icon which will correspond to marker's location
        popupAnchor:  [0, -10] 
    })
    return theicon
}

function getYSEQManIcon(points, color) {
    var offset = getOffset(10, points)
    var thehtml = ""
    if (dnaType == 'y') {
        thehtml = getAmpelmannSVG(color,20)
    } else {
        thehtml = getAmpelwomanSVG(color,20)
    }

    return L.divIcon({
        html: thehtml,
        className: "deviation-circle",
        iconSize:     [20, 20], // size of the icon
        iconAnchor:   [10-offset[1],10+offset[0]],//[23, 10], // point of the icon which will correspond to marker's location
        popupAnchor:  [10, 10] 
    })
}

var aIcon = L.divIcon({
    html: getDeviationMarkerSVG("A",'gold','50%'),
    className: "deviation-circle",
    iconSize: [32,32]
  });

var bIcon = L.divIcon({
    html: getDeviationMarkerSVG("B",'gold','50%'),
    className: "deviation-circle",
    iconSize: [32,32]
  });

  var cIcon = L.divIcon({
    html: getDeviationMarkerSVG("C",'gold','50%'),
    className: "deviation-circle",
    iconSize: [32,32]
  });



var deviationMarkersGroup = null

var subcladeColors = ['#E55451','cyan','green','purple','pink','white','grey','yellow','periwinkle','magenta','indigo','orchid','teal','brick-red']

var tmrcaLinesToNodesGroups = {}
var tmrcaLinesToSamplesGroups = {}
var tmrcaNodesGroups = {}
var tmrcaSamplesGroups = {}

function addUpstreamNodesToMap(clade, centroid, positions, subclades, color, level, unclesMode, upstream) {

    var totalSamples = 0
    var ancestral = subclades.filter(x => upstream.indexOf(x) !== -1)[0]
    for (var i = 0; i < subclades.length; i++) {
        var subclade = subclades[i]
        var isSample = false
        if (!childParents.hasOwnProperty(subclade)) {
            isSample = true
        }
        
        var size = 27
        var txt = ""
        var title = subclades[i]
        var weight = 1.5
        var opacity = 0.5
        if (isSample) {
            totalSamples += 1
            size = 6
        } else {
            txt = subclade//i - totalSamples + 1
            weight = 3
        }
        if (upstream[0] == subclade) {
            size = 32
        }
 
        if (positions[i] == null) {
            alert('clade ' + clade + " child " + subclades[i] + " error")
        }

        if (isSample == false) {
            //if (ancestral == subclade) {
            //    color = 'gold'
            //} else {
            //    color = 'silver'
            //}
            

            if (ancestral == subclade || unclesMode) {
                var themarker = L.marker(positions[i], {icon:createSubcladeIcon(txt,size,color), title:title})
                if (isSample == false) {
                    (function(index){
                        themarker.on("click", function(e) {submitNewCladeByInteraction(subclades[index])})
                    })(i)
                }
                upstreamMarkers.push(themarker)
                if (ancestral == subclade) {
                    weight += 0.5
                    opacity += 0.1
                } else {
                    weight -= 0.5
                    opacity -= 0.1
                }
                var theline = new L.Geodesic([centroid,positions[i]], {color: 'black', opacity:opacity, weight:weight})
                upstreamLines.push(theline)

                themarker.setZIndexOffset(-1 * level * 25)

            }
            
        }

    }
}

function addDownstreamNodesToMap(clade, centroid, positions, subclades, parentColor, level) {

    var totalSamples = 0
    var cladeColors = {}
    var cladeTMRCA = tmrca[clade]
    for (var i = 0; i < subclades.length; i++) {
        var subclade = subclades[i]
        
        var isSample = false
        if (!childParents.hasOwnProperty(subclade)) {
            isSample = true
        }

        var size = 27
        var txt = ""
        var color = '#ff00aa'
        var title = subclades[i]
        
        if (isSample) {
            totalSamples += 1
            size = 6
        } else {
            txt = subclade//i - totalSamples + 1
            color = subcladeColors[(i-totalSamples)%subcladeColors.length]
        }
        if (parentColor) {
            color = parentColor
            txt = ""
            if (isSample == false) {
                size = 12
            }
        } 
        if (positions[i] == null) {
            alert('clade ' + clade + " child " + subclades[i] + " error")
        }

        var themarker = null
        var theweight = null
        var theopacity = null
        if (isSample) {
            if (circ.hasOwnProperty(subclade) == false) {
                alert(subclade + " not in circliefied")
            }
            themarker = createMarker({"lat":circ[subclade]['lat'],"lng":circ[subclade]['lng'],"clade":clade,"id":subclade},color) // positions[i][0]  / [1]
            //L.marker(positions[i], {icon:getYSEQManIcon([centroid,positions[i]], color), title:title})
            theweight = 1
            theopacity = 0.5
            //add the appropriate refactored bindpopup
        } else {
            if (parentColor) {
                theweight = 1.5
                theopacity = 0.5
                if (level == 2) {
                    size = 24
                    theweight = 2.4
                    theopacity = 0.8
                } else {
                    if (level == 3) {
                        theweight = 1.95
                        theopacity = 0.65
                        size = 18
                    }
                }
                themarker = L.marker(positions[i], {icon:createLesserSubcladeIcon(size,color), title:title})
            } else {
                theweight = 3
                theopacity = 1
                themarker = L.marker(positions[i], {icon:createSubcladeIcon(txt,size,color), title:title})
            }            
        }
        if (isSample == false) {
            cladeColors[subclade] = color;
            (function(index){
                themarker.on("click", function(e) {submitNewCladeByInteraction(subclades[index])})
              })(i)
        }
        
        //make line weight gradually less -> major subclades > subclades > samples
        
    
        var theline = new L.Geodesic([centroid,positions[i]], {color: 'black', opacity:.5, weight:theweight})


        if (isSample) {
            if (tmrcaSamplesGroups.hasOwnProperty(cladeTMRCA) == false) {
                tmrcaSamplesGroups[cladeTMRCA] = L.layerGroup([])
            }
            tmrcaSamplesGroups[cladeTMRCA].addLayer(themarker);
            if (tmrcaLinesToSamplesGroups.hasOwnProperty(cladeTMRCA) == false) {
                tmrcaLinesToSamplesGroups[cladeTMRCA] = L.layerGroup([])
            }
            tmrcaLinesToSamplesGroups[cladeTMRCA].addLayer(theline);
        } else {        
            var subcladeTMRCA = tmrca[subclade]
            if (tmrcaNodesGroups.hasOwnProperty(subcladeTMRCA) == false) {
                tmrcaNodesGroups[subcladeTMRCA] = L.layerGroup([])
            }
            if (tmrcaLinesToNodesGroups.hasOwnProperty(subcladeTMRCA) == false) {
                tmrcaLinesToNodesGroups[subcladeTMRCA] = L.layerGroup([])
            }
            tmrcaNodesGroups[subcladeTMRCA].addLayer(themarker)
            tmrcaLinesToNodesGroups[subcladeTMRCA].addLayer(theline)
        }

        themarker.setZIndexOffset(-1 * level * 25)

    }
    return cladeColors
}

function hideAllRegardlessofTMRCA(tmrcaGroupsForLayerType) {
    var keyz = Object.keys(tmrcaGroupsForLayerType)
    
    for (var i = 0; i < keyz.length; i++) {
        var thetmrca = keyz[i]
        var thislayergroup = tmrcaGroupsForLayerType[thetmrca]
        
        if (lmap.hasLayer(thislayergroup)) {
            lmap.removeLayer(thislayergroup)
        }
    }
}

function updateTMRCAfilterChanged() {
    var thefilter = document.getElementById('tmrcaFilter')
    var ybp = 0
    if (thefilter) {
        ybp = tmrca[clade] - thefilter.value * tmrcaIncrement
    }

    var layerGroups = []
    if (layerStates['samples']) {
        layerGroups.push(tmrcaSamplesGroups)
    }
    if (layerStates['downstream']) {
        layerGroups.push(tmrcaLinesToNodesGroups)
        layerGroups.push(tmrcaNodesGroups)
    }
    if (layerStates['downstream'] && layerStates['samples']) {
        layerGroups.push(tmrcaLinesToSamplesGroups)
    }

    for (var h = 0; h < layerGroups.length; h++) {
        var thislayer = layerGroups[h]
        var keyz = Object.keys(thislayer)
        for (var i = 0; i < keyz.length; i++) {
            var thetmrca = keyz[i]
            var thislayergroup = thislayer[thetmrca]
            if (thetmrca < ybp) {
                if (lmap.hasLayer(thislayergroup)) {
                    lmap.removeLayer(thislayer[thetmrca])
                }
            }
            else {
                if (lmap.hasLayer(thislayergroup) == false) {
                    lmap.addLayer(thislayergroup)
                }
            }
        }
    }

    updateTMRCAfilterText()
    //alert(thefilter.value)
    
    
}

function updateTMRCAfilterText() {
    var thefilter = document.getElementById('tmrcaFilter')
    if (thefilter) {
        var ybp = tmrca[clade] - thefilter.value * tmrcaIncrement
        var thetext = 'Hiding Subclades w/ TMRCA < ' + ybp + ' years'
        if (ybp == 0) {
            thetext = 'Slide left to exclude younger subclades'
        }
        document.getElementById('tmrcaFilterLabel').innerHTML = thetext
    }
}

function resetTMRCAfilterSlider() {
    tmrcaIncrement = 100
    if (tmrca[clade] < 2000) {
        tmrcaIncrement = 25
    }
    var theslider = document.getElementById("tmrcaFilter")
    theslider.max = tmrca[clade]/tmrcaIncrement
    theslider.value = tmrca[clade]/tmrcaIncrement
    updateTMRCAfilterText()
}

function playTMRCAfilter() {
    if (isPlaying() == false) {
        layerStates['playing'] = true
        removeWatermarkControlIfExists()
    
        setIconActive('playCentroids')
        //var playIcon = document.getElementById("playCentroids")
        //playIcon.src = imagesDir + "play_active.png" 
        var i = 0;
        var increments = tmrca[clade] / tmrcaIncrement                  //  set your counter to 1
        var theslider = document.getElementById('tmrcaFilter')
        function tmrcaFilterLoop() {         //  create a loop function
        setTimeout(function() {   //  call a 3s setTimeout when the loop is called
            theslider.value = i
            updateTMRCAfilterChanged()
            i += 1;
                                //  increment the counter
            if (i <= increments) {           //  if the counter < 10, call the loop function
            tmrcaFilterLoop();             //  ..  again which will trigger another
            }   else {
                setIconInactive('playCentroids')
                layerStates['playing'] = false //playIcon.src = imagesDir + "play.png" 
            }                    //  ..  setTimeout()
        }, 250)
        }
    
        tmrcaFilterLoop();
    }
}

function unclesModeButtonClicked() {
    if (layerStates['upstream']['uncles']) {
        setIconInactive('unclesModeButton', 'uncles_mode')
        layerStates['upstream']['uncles'] = false
    } else {
        setIconActive('unclesModeButton', 'uncles_mode')
        layerStates['upstream']['uncles'] = true
    }
}

var optionalLayerControlsConfig = {
    "fn": "optionalLayerControlClicked",
    "group": "optionalLayerControl",
    "width": '10%',
    "buttons": [
        {
            "title": "Animation",
            "id": "playCentroids",
            "icon": imagesDir + "play.png",
            "requireAny": ['samples','downstream']
        },
        {
            "title": "Uncles Mode",
            "id": "unclesModeButton",
            "icon": imagesDir + "uncles_mode.png",
            "requireAny": ['upstream']
        },
        {
            "title": "Manage Outliers",
            "id": "countryExclusionsButton",
            "icon": imagesDir + "exclusions.png",
            "requireAny": ['samples','downstream','upstream']
        },
        {
            "title": "Centroid Metrics",
            "id": "centroidStatsImg",
            "icon": imagesDir + "info.png",
            "requireAny": ['downstream']

        },
        {
            "title": "Diversification Over Time",
            "id": "diversificationGraph",
            "icon": imagesDir + "graph.png"
        },
        {
            "title": "Clade Finder",
            "id": "cladefinder",
            "icon": imagesDir + "cladefinder.png"
        }
    ]
}

function optionalLayerControlClicked(layerControl) {
    if (layerControl == "playCentroids") {
        playTMRCAfilter()
    }
    if (layerControl == "unclesModeButton") {
        unclesModeButtonClicked()
    }
    if (layerControl == "countryExclusionsButton") {
        watermarkControlClicked(layerControl)
    }
    if (layerControl == "centroidStatsImg") {
        watermarkControlClicked(layerControl)
    }
    if (layerControl == "diversificationGraph") {
        watermarkControlClicked(layerControl)
    }
    if (layerControl == "cladefinder") {
        watermarkControlClicked(layerControl)
        //shoppingCartControlClicked()
    }
}

function addUpdateCentroidsControls(){
    var previousFilterValue = tmrca[clade]/tmrcaIncrement
    var thefilter = document.getElementById('tmrcaFilter')
    if (thefilter) {
        previousFilterValue = thefilter.value
    }
    

    var centroidControlsDiv = document.getElementById('centroidControlsDiv')

    var thehtml = getButtonsRedesigned(optionalLayerControlsConfig)

    if (layerStates['upstream']) {
        if (layerStates['upstream']['uncles']) {
            setIconActive('unclesModeButton', 'uncles_mode')
        }
    }
    //support migration animation root to target hg    

    if (layerStates['samples'] || layerStates['downstream']) {
        thehtml += '<div id="tmrcaFilterLabel"></div><div class="slidecontainer"><input type="range" min="0" max="'+tmrca[clade]/tmrcaIncrement+'" value="'+previousFilterValue+'" class="slider" id="tmrcaFilter" style="width:50%" oninput="updateTMRCAfilterChanged()"></div>';
    }
    
    centroidControlsDiv.innerHTML = '<font size="+1">Features </font>' + thehtml
    
    if (layerStates['samples'] || layerStates['downstream']) {
        updateTMRCAfilterText()
    }
}

var upstreamMarkers = []
var upstreamLines = []
var upstreamNodesGroup = null
var upstreamLinesGroup = null

function addSingleLineMigrationNodesToMap(clade, centroid, unclesMode) {
    //removeMigrationNodesAndLines()
    upstreamMarkers = []
    upstreamLines = []
    var upstream = getUpstream(clade)
    recursivelyAddUpstream(project, centroid, upstream, 1, unclesMode)
    upstreamNodesGroup = L.layerGroup(upstreamMarkers)
    upstreamLinesGroup = L.layerGroup(upstreamLines)
    lmap.addLayer(upstreamLinesGroup)
    lmap.addLayer(upstreamNodesGroup)
}

function hideShowTMRCALayersByAge(ybp) {
    var filterYbp = tmrca[clade] - document.getElementById('tmrcaFilter').value * tmrcaIncrement

    
    if (isSample == false) {
        thetmrca = tmrca[subclade]
        if (filterYbp <= thetmrca) {
            downstreamLines.push(theline)
            downstreamMarkers.push(themarker)
        }
        
    } else {
        if (filterYbp <= thetmrca) {
            toSampleLineMarkers.push(theline)
            ampelmaenner.push(themarker)
        }
    }

}
function addAllDownstreamNodesToMap(clade, centroid) {


    recursivelyAddDownstream(clade, centroid, null, 1)
    updateTMRCAfilterChanged()
}

function recursivelyAddUpstream(clade, centroid, upstream, level, unclesMode) {
    var position = centroid['centroid']
    var positions = centroid['distanceMetrics']['positions']
    var subclades = centroid['distanceMetrics']['subclades']
    var children = centroid['children']
    var color = rgbToHex(HSVtoRGB(getHue(level/(upstream.length-1)),1,1))
    
    addUpstreamNodesToMap(clade, position, positions, subclades, color, level, unclesMode, upstream)

    if (level < upstream.length - 1) {
        var childKeys = Object.keys(children)
        for (var i = 0; i < childKeys.length; i++) {
            var childClade = childKeys[i]
            if (upstream.indexOf(childClade) != -1) {
                var childCentroid = children[childClade]
                recursivelyAddUpstream(childClade, childCentroid, upstream, level + 1,unclesMode)
            }
        }
    }
}

function recursivelyAddDownstream(clade, centroid, cladeColors, level) {
    var position = centroid['centroid']
    var positions = centroid['distanceMetrics']['positions']
    var subclades = centroid['distanceMetrics']['subclades']
    var children = centroid['children']
    cladeColors = addDownstreamNodesToMap(clade, position, positions, subclades, cladeColors, level)
    var childKeys = Object.keys(children)
    for (var i = 0; i < childKeys.length; i++) {
        var childClade = childKeys[i]
        var childCentroid = children[childClade]
        recursivelyAddDownstream(childClade, childCentroid, cladeColors[childClade], level + 1)
    } 
}

function getCentroidStatsHTML() {
    var html = getDeviationPopupHTML(clade, tmrca[clade], "Average of Centroid and Central Sample/Branch", centroid["distanceMetrics"])
    return html
}

function getDeviationPopupHTML(clade, thetmrca, title, distanceMetrics) {
    var mean = distanceMetrics['mean']*kilometersPerDegree
    var weightedMean = distanceMetrics['weightedMean']*kilometersPerDegree
    var median = distanceMetrics['median']*kilometersPerDegree
    var max = distanceMetrics['max']*kilometersPerDegree

    var html = ' <font size="+2">' + clade + "</font><br>"
    html += "TMRCA " + thetmrca + " ybp<br>"
    html += 'Centroid Type = ' + title + "<br><br>"
    html += 'Distance from Centroid to all Nodes<br><table border="1">'
    html += '<tr><td>mean</td><td>' + Math.round(mean) + ' km</td></tr>'
    html += '<tr><td>mean <font="-2"><i>(weighted by node age)</i></font></td><td>' + Math.round(weightedMean) + ' km</td></tr>'
    html += '<tr><td>median</td><td>' + Math.round(median) + ' km</td></tr>'
    html += '<tr><td>max</td><td>' + Math.round(max) + ' km</td></tr></table>'

    html += '<br>Distance from Centroid to each Node<br><table style="font-size:8px" border="1"><tr><td>Node</td><td>Distance</td><td>Elapsed Time</td><td>Mean Migration Rate</td></tr>'
    var intervals = distanceMetrics['intervals']
    var subclades = distanceMetrics['subclades']
    var distances = distanceMetrics['distances']
    var positions = distanceMetrics['positions']
    for (var i = 0; i < subclades.length; i++) {
        var kmPerYear = ""
        if (intervals[i] == 0) {
            kmPerYear = Math.round(distances[i]*kilometersPerDegree) + " km at once"
        } else {
            kmPerYear = Math.round(distances[i]*kilometersPerDegree / intervals[i] * 10) / 10 + " km/year"
        }
        html += '<tr><td>'+subclades[i]+'</td><td>'+Math.round(distances[i]*kilometersPerDegree)+' km</td><td>'+intervals[i]+' years</td><td>'+kmPerYear+'</td></tr>'
    }
    html += "</table>"
    return html
}


function removeTargetSubcladeMarkerAndDownstreamNodesAndLines() {
    removeTargetSubcladeMarker()
    removeAndResetTMRCALayerGroups([tmrcaLinesToNodesGroups, tmrcaLinesToSamplesGroups, tmrcaNodesGroups])
    tmrcaLinesToNodesGroups = {}
    tmrcaLinesToSamplesGroups = {}
    tmrcaNodesGroups = {}
    delete layerStates['downstream']
}

function removeUpstreamMarkersAndLines() {
    if (lmap.hasLayer(upstreamNodesGroup)) {
        lmap.removeLayer(upstreamNodesGroup)
        lmap.removeLayer(upstreamLinesGroup)
    }
}

function removeRootSubcladeMarkerAndUpstreamNodesAndLines() {
    removeUpstreamRootMarker()
    removeUpstreamMarkersAndLines()
    delete layerStates['upstream']
}

function removeUpstreamRootMarker() {
    if (lmap.hasLayer(migrationMarkersGroup)) {
        lmap.removeLayer(migrationMarkersGroup)
    }
    
}

function removeTargetSubcladeMarker() {
    if (lmap.hasLayer(deviationMarkersGroup)) {
        lmap.removeLayer(deviationMarkersGroup)
    }
}

function removeAndResetTMRCALayerGroups(layerGroups) {
    for (var h = 0; h < layerGroups.length; h++) {
        hideAllRegardlessofTMRCA(layerGroups[h])        
    }
}

var deviationMarkers = []


var centroid = null
var ampelmaenner = []
var ampelmaennerMarkersGroup = null
function getAllCentroidModalities(clade,allPoints) {
    
    removeAndResetTMRCALayerGroups([tmrcaLinesToNodesGroups, tmrcaLinesToSamplesGroups, tmrcaNodesGroups,tmrcaSamplesGroups])
    if (deviationMarkersGroup != null) {
        lmap.removeLayer(deviationMarkersGroup)
    }
    tmrcaLinesToNodesGroups = {}
    tmrcaLinesToSamplesGroups = {}
    tmrcaNodesGroups = {}
    tmrcaSamplesGroups = {}
    //ampelmaennerMarkersGroup = null
    centroid = computeCentroidAndDeviation(clade, allPoints,"averageCentroidAndCentralSample")

    //var bCentroid = computeCentroidAndDeviation(clade, allPoints,"centroidOrBestPoint")
    //var cCentroid = computeCentroidAndDeviation(clade, allPoints,"centroid")
    


    var cladeMarker = L.marker(centroid['centroid'], {icon:createSubcladeIcon(clade,32,'#ff00aa'), title:clade}).on('click', function(e) {addAllDownstreamNodesToMap(clade,centroid)})

    deviationMarkers = []
    
    //deviationMarkers.push(aMarker)
    deviationMarkers.push(cladeMarker)
    //deviationMarkers.push(cMarker)
    deviationMarkersGroup = L.layerGroup(deviationMarkers);
    if (layerStates['downstream']) {
        lmap.addLayer(deviationMarkersGroup)
    }
    deviationMarkers[0].fire('click')
}

var migrationCentroid = null

var migrationMarkers = []
var migrationMarkersGroup = null

var toSampleLineMarkers = []
var toSampleLineMarkersGroup = null


function computeMigrationsAndAddToMap(clade, allPoints, unclesMode) {
    //removeMigrationMarkers()
    
    removeRootSubcladeMarkerAndUpstreamNodesAndLines()
    centroid = computeCentroidAndDeviation(project, allPoints,"averageCentroidAndCentralSample")

    
    var rootColor = rgbToHex(HSVtoRGB(getHue(0),1,1))
    var cladeMarker = L.marker(centroid['centroid'], {icon:createSubcladeIcon(project,32,rootColor), title:project}).on('click', function(e) {addSingleLineMigrationNodesToMap(clade,centroid, unclesMode)})

    migrationMarkers = []
    
    //deviationMarkers.push(aMarker)
    migrationMarkers.push(cladeMarker)
    //deviationMarkers.push(cMarker)
    migrationMarkersGroup = L.layerGroup(migrationMarkers);
    lmap.addLayer(migrationMarkersGroup)
    migrationMarkers[0].fire('click')
}

function getDeviationMarkerSVG(txt, color, opacity) {
    var thesvg = '<svg viewBox="0 0 64 64" opacity="'+opacity+'" fill="none">'
    thesvg += '<circle r="47%" cx="50%" cy="50%" stroke="black" stroke-width="4" fill="'+color+'"></circle>'
    thesvg += '<text font-weight="bold" font-size="4em" x="15" y="47" fill="black">'+txt+'</text></svg>'
    return thesvg
}

var deviationCountryExclusions = []

function applyCountryFiltersAndRecalcCentroids() {
    var filtered = filterForCentroid(hgToPositions, deviationCountryExclusions)
    getAllCentroidModalities(clade, filtered)
}

function removeCountryExclusion(geocode){
    //document.getElementById('deviationCountryExclusion' + geocode).remove()
    var theindx = deviationCountryExclusions.indexOf(geocode)
    if (theindx != -1) {
        deviationCountryExclusions.splice(theindx, 1)
    }
}

function countryExclusionCheckboxChanged(e) {
    if (e.checked) {
        addCountryExclusion(e.value)
    } else {
        removeCountryExclusion(e.value)
    }
    applyCountryFiltersAndRecalcCentroids()

    var filtered = filterForCentroid(hgToPositions, deviationCountryExclusions)
    if (layerStates['upstream']) {
            removeRootSubcladeMarkerAndUpstreamNodesAndLines()
	    computeMigrationsAndAddToMap(clade, filtered, unclesMode)
	    layerStates['upstream']='true';
    }
}

function addCountryExclusion(geocode) {
    /*var btn = document.createElement('BUTTON');
    btn.addEventListener("click", function() {
        removeCountryExclusion(geocode)
    })
    btn.id = 'deviationCountryExclusion' + geocode
    var btntext = document.createTextNode(geocode)
    btn.appendChild(btntext);
    document.getElementById('pieChartCheckboxDiv').appendChild(btn)*/
    deviationCountryExclusions.push(geocode)
}

function filterForCentroid(allPoints, excludes) {
    var filtered = {}
    Object.keys(allPoints).forEach(function(key, index) {
        filtered[key] = allPoints[key].filter(k => excludes.indexOf(k[2]) == -1) ;
      });
    return filtered
}

var countriesRepresented = []

function getCountriesRepresented() {
    var countries = new Set(Object.values(hgToPositions).flat().map(i => i[2]))
    var countriesList = [...countries]
    var countryNames = countriesList.map((code) => {return{"code":code, "name":countryCoords[code]['name']}})

    countryNames.sort((a, b)=>(a['name'] > b['name']) ? 1 : -1)
    return countryNames.map(c => c['code'])
}

function createExclusionsHTML() {
    var html = '<font size="+2">Set Outliers</font><br><i>Recalculates centroids excluding these samples</i><br><table>'
    var countries = getCountriesRepresented()
    html += '<tr><td><input type="checkbox" onchange="resetCountryExclusions()"></td><td>Reset</td></tr>'
    for (var i = 0; i < countries.length; i++) {
        var code = countries[i]
        var checked = ""
        if (deviationCountryExclusions.indexOf(code) != -1) {
            checked = "checked"
        }
        html += "<tr><td>"+'<input '+checked+' type="checkbox" value="'+code+'" onchange="countryExclusionCheckboxChanged(this)">'+"</td><td>"+'<font size="-1">'+countryCoords[code]['name'] + '</font></td></tr>'//<td>"+code+"</td>
    }
    html += "</table>"
    return html
}

function resetCountryExclusions() {
    countryExclusionsControlClicked()
    deviationCountryExclusions = []
    countryExclusionsControlClicked()
    
    //big rethink necessary here
    getAllCentroidModalities(clade, hgToPositions)

}

function deactivateCentroidsLayer() {
        removeTargetSubcladeMarkerAndDownstreamNodesAndLines()
        removeWatermarkControlIfExists()
        //set icon url to inactive downstream
        //document.getElementById('centroidsCheckboxSlider').checked = false
        setIconInactive('downstream', 'downstream')
}

function centroidsCheckboxClicked(e) {

    if (layerStates['downstream'] != true) {
        layerStates['downstream'] = true
        addUpdateCentroidsControls()
        
        var filtered = filterForCentroid(hgToPositions, deviationCountryExclusions)
	getAllCentroidModalities(clade,filtered)
        setIconActive('downstream', 'downstream')
        //set icon url to active downstream
    } else {
        hideAllRegardlessofTMRCA(tmrcaNodesGroups)
        hideAllRegardlessofTMRCA(tmrcaLinesToNodesGroups)
        if (layerStates['samples'] == true) {
            hideAllRegardlessofTMRCA(tmrcaLinesToSamplesGroups)
        }
        if (deviationMarkersGroup != null) {
            lmap.removeLayer(deviationMarkersGroup)
        }
        layerStates['downstream'] = false
        setIconInactive('downstream','downstream')
        addUpdateCentroidsControls()
    }

}

var unclesMode = false

var layerStates = {'samples': false, 'pie': false, 'upstream': false, 'downstream':false}

function migrationCheckboxClicked(e) {


    if (lmap.hasLayer(upstreamLinesGroup) == false) {

        var filtered = filterForCentroid(hgToPositions, deviationCountryExclusions)
        computeMigrationsAndAddToMap(clade, filtered, unclesMode)
        //it removes the layer before it adds new one!, deleting layerState
        layerStates['upstream'] = {'uncles': false}
        setIconActive('upstream', 'upstream')
        //make sure doesn't add twice, refactor centroid controls to work for
        //set icon upstream to active
    } else {    
        removeRootSubcladeMarkerAndUpstreamNodesAndLines()
        setIconInactive('upstream','upstream')
    }
    addUpdateCentroidsControls()

}

function isPlaying() {
    if (layerStates['playing']) {
        return true
    }
    return false
}

function removePreviousOptionalLayersAndReloadLastEnabled() {
    var previousLayerStates = []
    var layerChecks = ['downstream','samples','pie','upstream']
    for (var i = 0; i < layerChecks.length; i++) {
        previousLayerStates[layerChecks[i]] = layerStates[layerChecks[i]]
    }
    removeTargetSubcladeMarkerAndDownstreamNodesAndLines()
    removeWatermarkControlIfExists()
    deactivatePieChartLayer()
    removeUpstreamMarkersAndLines()

    if (previousLayerStates['downstream']) {
        layerStates['downstream'] = true
        applyCountryFiltersAndRecalcCentroids()
    }
    if (previousLayerStates['samples']) {
        layerStates['samples'] = false
        samplesLayerCheckboxClicked()
    }
    if (previousLayerStates['downstream'] || previousLayerStates['samples']) {
        resetTMRCAfilterSlider()
    }
    if (previousLayerStates['pie']) {
        addPieChartLayer()
    }

    if (previousLayerStates['upstream']) {
        migrationCheckboxClicked()
    }
}

function removePreviousOptionalLayersAndClearNecessaryStates() {
    removeTargetSubcladeMarkerAndDownstreamNodesAndLines()
    removeWatermarkControlIfExists()
    deactivatePieChartLayer()
    removeRootSubcladeMarkerAndUpstreamNodesAndLines()
    addPieChartCheckbox(clade, "")
    deviationCountryExclusions = []
}

function addCentroidsLegend() {
//with useful text about version of yfull and phylogeographer
//maybe increase size of legend
}

function getAmpelmannSVG(color,size, title) {
    return '<svg        height="'+size+'" width="'+size+'"       id="svg2"        inkscape:version="1.1.2 (0a00cf5339, 2022-02-04)"        sodipodi:docname="YSEQMan.svg"        sodipodi:version="0.32"        width="277.33334"        version="1.1"        viewBox="0 0 260 260"        xmlns:inkscape="http://www.inkscape.org amespaces/inkscape"        xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"        xmlns:xlink="http://www.w3.org/1999/xlink"        xmlns="http://www.w3.org/2000/svg"        xmlns:svg="http://www.w3.org/2000/svg"        xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"        xmlns:cc="http://creativecommons.org s#"        xmlns:dc="http://purl.org/dc/elements/1.1/">       <title          id="title14617">'+title+'</title>       <metadata          id="metadata3">         <rdf:RDF>           <cc:Work              rdf:about="">             <dc:rights>               <cc:Agent>                 <dc:title>Public Domain</dc:title>               </cc:Agent>             </dc:rights>             <dc:date>2023-02-26</dc:date>             <dc:format>image/svg+xml</dc:format>             <dc:type                rdf:resource="http://purl.org/dc/dcmitype/StillImage" />             <dc:language>en</dc:language>             <cc:license                rdf:resource="http://artlibre.org/licence/lal" />             <dc:subject>               <rdf:Bag>                 <rdf:li>Walking< df:li>                 <rdf:li>man< df:li>               < df:Bag>             </dc:subject>             <dc:description>A simplistic shape of a walking man, intended to use as a symbol on a map.</dc:description>             <dc:title>Walking Man</dc:title>           </cc:Work>           <cc:License              rdf:about="http://artlibre.org/licence/lal">             <cc:permits                rdf:resource="http://creativecommons.org s#Reproduction" />             <cc:permits                rdf:resource="http://creativecommons.org s#Distribution" />             <cc:permits                rdf:resource="http://creativecommons.org s#DerivativeWorks" />             <cc:requires                rdf:resource="http://creativecommons.org s#ShareAlike" />             <cc:requires                rdf:resource="http://creativecommons.org s#Notice" />             <cc:requires                rdf:resource="http://creativecommons.org s#Attribution" />           </cc:License>         < df:RDF>       </metadata>       <defs          id="defs4">         <marker            style="overflow:visible"            id="Arrow1Lstart"            refX="0.0"            refY="0.0"            orient="auto"            inkscape:stockid="Arrow1Lstart"            inkscape:isstock="true">           <path              transform="scale(0.8) translate(12.5,0)"              style="fill-rule:evenodd;fill:context-stroke;stroke:context-stroke;stroke-width:1.0pt"              d="M 0.0,0.0 L 5.0,-5.0 L -12.5,0.0 L 5.0,5.0 L 0.0,0.0 z "              id="path13982" />         </marker>         <linearGradient            id="linearGradient13258"            inkscape:swatch="solid">           <stop              style="stop-color:'+color+';stop-opacity:1;"              offset="0"              id="stop13256" />         </linearGradient>         <linearGradient            id="linearGradient10180"            inkscape:swatch="gradient">           <stop              style="stop-color:#000000;stop-opacity:1;"              offset="0"              id="stop10176" />           <stop              style="stop-color:#00ff18;stop-opacity:0;"              offset="1"              id="stop10178" />         </linearGradient>         <inkscape:perspective            sodipodi:type="inkscape:persp3d"            inkscape:vp_x="0 : 203.35696 : 1"            inkscape:vp_y="0 : 999.99997 : 0"            inkscape:vp_z="524.4094 : 203.35696 : 1"            inkscape:persp3d-origin="262.2047 : 141.34909 : 1"            id="perspective36" />         <linearGradient            id="linearGradient3528">           <stop              id="stop3530"              offset="0.0000000"              style="stop-color:#05ff00;stop-opacity:1.0000000;" />           <stop              id="stop3532"              offset="1.0000000"              style="stop-color:#0d8d0b;stop-opacity:0.79274613;" />         </linearGradient>         <linearGradient            id="linearGradient2070">           <stop              id="stop2072"              offset="0.0000000"              style="stop-color:#ff0000;stop-opacity:1.0000000;" />           <stop              id="stop2074"              offset="1.0000000"              style="stop-color:#9a1a00;stop-opacity:1.0000000;" />         </linearGradient>         <inkscape:perspective            id="perspective2852"            inkscape:persp3d-origin="0.49999998 : 17.666676 : 1"            inkscape:vp_z="0.99999997 : 17.833343 : 1"            inkscape:vp_y="0 : 999.99997 : 0"            inkscape:vp_x="0 : 17.833343 : 1"            sodipodi:type="inkscape:persp3d" />         <radialGradient            inkscape:collect="always"            xlink:href="#linearGradient3528"            id="radialGradient3646"            cx="337.89963"            cy="132.50696"            fx="337.89963"            fy="132.50696"            r="61.977695"            gradientTransform="matrix(1,0,0,1.0850228,158.42428,-136.43917)"            gradientUnits="userSpaceOnUse" />       </defs>       <sodipodi:namedview          bordercolor="#666666"          borderopacity="1.0"          id="base"          inkscape:current-layer="layer1"          inkscape:cx="238.13197"          inkscape:cy="146.29182"          inkscape:document-units="px"          inkscape:pageopacity="0.0"          inkscape:pageshadow="2"          inkscape:window-height="882"          inkscape:window-width="1132"          inkscape:window-x="105"          inkscape:window-y="61"          inkscape:zoom="1.9925926"          pagecolor="#ffffff"          showguides="true"          showgrid="true"          inkscape:window-maximized="0"          inkscape:pagecheckerboard="0"          inkscape:snap-global="false">         <inkscape:grid            type="xygrid"            id="grid3648"            empspacing="5"            visible="true"            enabled="true"            snapvisiblegridlinesonly="true"            spacingx="19.999999"            spacingy="19.999999"            originx="0"            originy="0" />       </sodipodi:namedview>       <g          id="layer1"          inkscape:groupmode="layer"          inkscape:label="Layer 1"          transform="translate(-16.323915,-55.333908)">         <path            d="m 196.46037,307.39417 c -1.93396,-1.38502 -0.71881,-7.57097 4.09457,-20.84409 1.30363,-3.59483 2.54656,-7.32119 2.76206,-8.28079 l 0.39182,-1.74474 -1.38176,-1.47324 c -2.60986,-2.78264 -2.39709,-1.84564 -21.34134,-16.97576 -7.41317,-5.92063 -5.15142,-6.10035 -11.7522,-11.99102 -7.85937,-7.01388 -16.0978,-12.14559 -16.7656,-12.32612 -1.2039,-0.32547 -9.58227,5.66248 -28.39378,28.31953 -20.40248,24.57327 -29.268108,43.60282 -31.775373,42.7117 l -1.455658,-0.51736 -1.190963,-0.90216 C 86.394145,300.90218 85.289767,297.10024 77.912749,290.0321 65.247491,277.89715 60.23388,272.47193 58.642678,269.18005 c -1.135897,-2.34997 -1.199345,-3.27288 -0.289655,-4.21331 0.591699,-0.61171 0.902771,-0.67001 2.607971,-0.4888 2.260977,0.24029 8.211012,1.82731 14.852408,3.96154 5.672588,1.8229 12.4922,5.14378 14.133423,4.43486 2.788677,-1.20457 1.590017,-2.5619 15.071415,-26.82396 13.59936,-24.47432 14.4624,-20.5088 14.4624,-23.89833 0,-2.5096 -1.30643,-9.49616 -3.10635,-10.39694 -1.94761,-0.97469 -3.90362,-0.52535 -7.1363,0.53644 -2.06468,0.67816 -3.83799,1.44771 -4.78125,1.65224 -1.5396,0.33386 -2.57551,-0.6363 -4.3252,-1.31275 -1.071979,-0.41444 -4.381342,-3.48361 -8.159285,-5.81572 -3.777942,-2.33209 -16.970404,-12.27931 -21.838622,-15.16064 -9.874734,-11.63246 -3.324097,-22.27741 6.630801,-23.42518 1.853073,0.73662 4.971422,5.56682 9.029762,7.34768 4.058339,1.78086 9.209297,5.1275 9.99169,5.42059 2.584649,0.96822 9.693674,2.19181 10.653614,2.19181 2.55027,0 7.3753,-0.0173 12.98081,-7.96282 2.18023,-3.09037 4.62178,-11.63735 6.36152,-13.70437 6.00506,-7.13475 3.96736,-12.11526 3.61181,-13.57977 -0.47108,-1.94036 -3.60254,-4.25562 -7.81957,-5.78143 -4.9937,-1.80684 -9.32261,-5.35035 -11.10262,-9.08826 -0.97376,-2.04484 -1.03798,-2.39239 -1.03835,-5.61879 -2.8e-4,-2.4527 0.26577,-4.87299 0.92756,-8.43817 l 0.92796,-4.99904 -3.26098,-3.38271 -3.26099,-3.38271 1.06855,-1.01188 c 1.28834,-1.22001 5.83132,-2.94143 6.7981,-2.94143 1.4948,0 2.86558,-1.24242 5.42508,-5.717417 3.34272,-5.844388 2.81116,-7.448193 2.27702,-7.770647 -8.43886,-5.094496 -16.73608,-11.319654 -17.00394,-12.757534 -0.15518,-0.833034 2.8303,-1.025876 4.37827,-1.265859 3.44592,-0.534208 5.65884,0.86094 14.08931,2.332531 l 6.05036,1.056126 2.15932,-2.41721 c 5.26582,-5.894683 6.39734,-7.172748 8.19428,-8.026462 4.38305,-2.082368 5.44359,-1.636537 11.24199,-1.176251 6.51023,0.516791 15.45754,5.416635 20.36213,9.198078 5.76088,4.44164 9.54967,7.836541 10.21578,13.2286 0.0821,5.165262 0.33363,8.712895 -1.94052,14.327145 -8.35218,14.82 -9.0346,13.09649 -13.18086,40.56266 2.17332,29.04452 -0.01,6.58079 1.51123,17.77764 2.01775,14.85624 5.15745,21.25214 7.76097,29.11214 3.10796,9.3829 -3.82232,-6.85963 6.89827,18.25736 7.40189,17.34169 1.73336,9.4802 20.74809,29.84712 22.23785,23.81924 31.68865,28.79535 32.78045,31.21737 0.85949,1.90663 -0.55658,0.51117 -1.26439,2.05322 -2.88001,6.27428 -23.46801,29.46897 -31.27514,33.51889 -1.47132,0.76324 -4.92933,1.21915 -5.60063,0.73839 z"            id="path1320"            style="opacity:1;mix-blend-mode:normal;fill:'+color+';fill-opacity:1;stroke:#000000;stroke-width:1.75072;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"            sodipodi:nodetypes="csscsssssscssssssssssssssccsssssssssscccssscssscsssscccssssssscc" />       </g>     </svg>'
}

function getAmpelwomanSVG(color, size, title) {
    return '<svg     height="'+size+'" width="'+size+'"      id="svg2"    inkscape:version="1.1.2 (0a00cf5339, 2022-02-04)"    sodipodi:docname="YSEQWoman.svg"    sodipodi:version="0.32"    width="277.33334"    version="1.1"    viewBox="0 0 260 260"    xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"    xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"    xmlns:xlink="http://www.w3.org/1999/xlink"    xmlns="http://www.w3.org/2000/svg"    xmlns:svg="http://www.w3.org/2000/svg"    xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"    xmlns:cc="http://creativecommons.org/ns#"    xmlns:dc="http://purl.org/dc/elements/1.1/">   <title      id="title14617">'+title+'</title>   <metadata      id="metadata3">     <rdf:RDF>       <cc:Work          rdf:about="">         <dc:rights>           <cc:Agent>             <dc:title>Public Domain</dc:title>           </cc:Agent>         </dc:rights>         <dc:date>2023-02-26</dc:date>         <dc:format>image/svg+xml</dc:format>         <dc:type            rdf:resource="http://purl.org/dc/dcmitype/StillImage" />         <dc:language>en</dc:language>         <cc:license            rdf:resource="http://artlibre.org/licence/lal" />         <dc:subject>           <rdf:Bag>             <rdf:li>Walking</rdf:li>             <rdf:li>man</rdf:li>           </rdf:Bag>         </dc:subject>         <dc:description>A simplistic shape of a walking man, intended to use as a symbol on a map.</dc:description>         <dc:title>Walking Man</dc:title>       </cc:Work>       <cc:License          rdf:about="http://artlibre.org/licence/lal">         <cc:permits            rdf:resource="http://creativecommons.org/ns#Reproduction" />         <cc:permits            rdf:resource="http://creativecommons.org/ns#Distribution" />         <cc:permits            rdf:resource="http://creativecommons.org/ns#DerivativeWorks" />         <cc:requires            rdf:resource="http://creativecommons.org/ns#ShareAlike" />         <cc:requires            rdf:resource="http://creativecommons.org/ns#Notice" />         <cc:requires            rdf:resource="http://creativecommons.org/ns#Attribution" />       </cc:License>     </rdf:RDF>   </metadata>   <defs      id="defs4">     <marker        style="overflow:visible"        id="Arrow1Lstart"        refX="0.0"        refY="0.0"        orient="auto"        inkscape:stockid="Arrow1Lstart"        inkscape:isstock="true">       <path          transform="scale(0.8) translate(12.5,0)"          style="fill-rule:evenodd;fill:context-stroke;stroke:context-stroke;stroke-width:1.0pt"          d="M 0.0,0.0 L 5.0,-5.0 L -12.5,0.0 L 5.0,5.0 L 0.0,0.0 z "          id="path13982" />     </marker>     <linearGradient        id="linearGradient13258"        inkscape:swatch="solid">       <stop          style="stop-color:#21ba30;stop-opacity:1;"          offset="0"          id="stop13256" />     </linearGradient>     <linearGradient        id="linearGradient10180"        inkscape:swatch="gradient">       <stop          style="stop-color:#000000;stop-opacity:1;"          offset="0"          id="stop10176" />       <stop          style="stop-color:#00ff18;stop-opacity:0;"          offset="1"          id="stop10178" />     </linearGradient>     <inkscape:perspective        sodipodi:type="inkscape:persp3d"        inkscape:vp_x="0 : 203.35696 : 1"        inkscape:vp_y="0 : 999.99997 : 0"        inkscape:vp_z="524.4094 : 203.35696 : 1"        inkscape:persp3d-origin="262.2047 : 141.34909 : 1"        id="perspective36" />     <linearGradient        id="linearGradient3528">       <stop          id="stop3530"          offset="0.0000000"          style="stop-color:#05ff00;stop-opacity:1.0000000;" />       <stop          id="stop3532"          offset="1.0000000"          style="stop-color:#0d8d0b;stop-opacity:0.79274613;" />     </linearGradient>     <linearGradient        id="linearGradient2070">       <stop          id="stop2072"          offset="0.0000000"          style="stop-color:#ff0000;stop-opacity:1.0000000;" />       <stop          id="stop2074"          offset="1.0000000"          style="stop-color:#9a1a00;stop-opacity:1.0000000;" />     </linearGradient>     <inkscape:perspective        id="perspective2852"        inkscape:persp3d-origin="0.49999998 : 17.666676 : 1"        inkscape:vp_z="0.99999997 : 17.833343 : 1"        inkscape:vp_y="0 : 999.99997 : 0"        inkscape:vp_x="0 : 17.833343 : 1"        sodipodi:type="inkscape:persp3d" />     <radialGradient        inkscape:collect="always"        xlink:href="#linearGradient3528"        id="radialGradient3646"        cx="337.89963"        cy="132.50696"        fx="337.89963"        fy="132.50696"        r="61.977695"        gradientTransform="matrix(1,0,0,1.0850228,158.42428,-136.43917)"        gradientUnits="userSpaceOnUse" />   </defs>   <sodipodi:namedview      bordercolor="#666666"      borderopacity="1.0"      id="base"      inkscape:current-layer="layer1"      inkscape:cx="38.325713"      inkscape:cy="62.10185"      inkscape:document-units="px"      inkscape:pageopacity="0.0"      inkscape:pageshadow="2"      inkscape:window-height="882"      inkscape:window-width="1735"      inkscape:window-x="63"      inkscape:window-y="163"      inkscape:zoom="1.4089757"      pagecolor="#ffffff"      showguides="true"      showgrid="true"      inkscape:window-maximized="0"      inkscape:pagecheckerboard="0"      inkscape:snap-global="false">     <inkscape:grid        type="xygrid"        id="grid3648"        empspacing="5"        visible="true"        enabled="true"        snapvisiblegridlinesonly="true"        spacingx="19.999999"        spacingy="19.999999"        originx="0"        originy="0" />   </sodipodi:namedview>   <g      id="layer1"      inkscape:groupmode="layer"      inkscape:label="Layer 1"      transform="translate(-16.323915,-55.333908)">     <g        id="g9267"        transform="translate(8.0920216,-4.1543823)">       <path          id="path1053"          style="fill:'+color+';fill-opacity:1;fill-rule:evenodd;stroke:#000000;stroke-width:1.5;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"          d="m 166.41275,162.6496 c 2.01775,14.85624 5.15745,21.25214 7.76097,29.11214 3.10796,9.3829 2.54033,7.01085 6.89827,18.25736 6.8127,17.5815 1.73336,9.4802 20.74809,29.84712 22.23785,23.81924 31.68865,28.79535 32.78045,31.21737 0.85949,1.90663 -0.55658,0.51117 -1.26439,2.05322 -2.88001,6.27428 -23.46801,29.46897 -31.27514,33.51889 -1.47132,0.76324 -4.92933,1.21915 -5.60063,0.73839 v 8e-5 c -1.93396,-1.38502 -0.71881,-7.57097 4.09457,-20.84409 1.30363,-3.59483 2.54656,-7.32119 2.76206,-8.28079 l 0.39182,-1.74474 -1.38176,-1.47324 c -2.60986,-2.78264 -2.39709,-1.84564 -21.34134,-16.97576 -7.41317,-5.92063 -5.15142,-6.10035 -11.7522,-11.99102 -7.85937,-7.01388 -16.0978,-12.14559 -16.7656,-12.32612 -1.2039,-0.32547 -9.58227,5.66248 -28.39378,28.31953 -20.40248,24.57327 -29.268108,43.60282 -31.775373,42.7117 l -1.455658,-0.51736 -1.190963,-0.90216 C 86.394145,300.90218 85.289767,297.10024 77.912749,290.0321 65.247491,277.89715 60.23388,272.47193 58.642678,269.18005 c -1.135897,-2.34997 -1.199345,-3.27288 -0.289655,-4.21331 0.591699,-0.61171 0.902771,-0.67001 2.607971,-0.4888 2.260977,0.24029 8.211012,1.82731 14.852408,3.96154 5.672588,1.8229 12.4922,5.14378 14.133423,4.43486 2.788677,-1.20457 1.590017,-2.5619 15.071415,-26.82396 13.59936,-24.47432 14.4624,-20.5088 14.4624,-23.89833 0,-2.5096 -1.30643,-9.49616 -3.10635,-10.39694 -1.94761,-0.97469 -3.90362,-0.52535 -7.1363,0.53644 -2.06468,0.67816 -3.83799,1.44771 -4.78125,1.65224 -1.5396,0.33386 -2.57551,-0.6363 -4.3252,-1.31275 -1.071979,-0.41444 -4.381342,-3.48361 -8.159285,-5.81572 -3.777942,-2.33209 -16.970404,-12.27931 -21.838622,-15.16064 -9.874734,-11.63246 -3.324097,-22.27741 6.630801,-23.42518 1.853073,0.73662 5.564615,4.24586 9.029762,7.34768 3.112979,3.16611 11.228439,8.54996 13.953691,10.02974 1.209343,0.61769 8.998513,7.18559 10.364543,0.2013 0.72596,-3.7117 13.92966,-22.21881 15.6694,-24.28583 6.00506,-7.13475 3.96736,-12.11526 3.61181,-13.57977 -0.47108,-1.94036 -3.60254,-4.25562 -7.81957,-5.78143 -4.9937,-1.80684 -9.32261,-5.35035 -11.10262,-9.08826 -0.97376,-2.04484 -1.03798,-2.39239 -1.03835,-5.61879 -2.8e-4,-2.4527 0.26577,-4.87299 0.92756,-8.43817 l 0.92796,-4.99904 -3.26098,-3.38271 c 0,0 -1.69103,-1.02233 -1.80039,-2.37794 -0.0834,-1.03423 0.68314,-1.91282 0.68314,-1.91282 1.31876,-1.18707 4.89126,-2.55228 5.72291,-3.04526 1.44791,-0.85828 2.86558,-1.24242 5.42508,-5.717417 3.34272,-5.844388 4.23955,-6.721535 4.24716,-8.61342 1.81612,-7.426354 -2.9151,-1.000277 5.69837,-9.343299 l 2.00481,-2.865874 c 2.03828,-2.913718 4.51434,-4.02972 6.36333,-4.763915 1.91343,-0.759779 4.02726,-1.422516 9.82566,-0.96223 6.51023,0.516791 16.84128,4.119563 21.74587,7.901004 2.88044,2.22082 5.60788,4.739208 7.69848,7.376397 2.09059,2.63719 3.54434,5.393183 3.8774,8.089212 l 0.0222,0.01328 c 13.92467,-7.897122 19.83614,13.215055 19.83614,13.215055 0,0 7.37863,15.71455 8.0949,25.83025 0.19815,2.79841 4.11627,16.0917 4.11627,16.0917 0,0 -16.65955,-11.40348 -19.89408,-15.70982 -4.24479,-5.65138 -2.03467,-14.14059 -4.75605,-20.66366 -1.21197,-2.90506 -2.08958,-6.91001 -5.0501,-7.97941 -1.40773,-0.5085 -4.93403,1.10662 -4.93403,1.10662 l -6.82255,20.68623 c -10.25063,31.0803 -5.24066,24.46385 -3.71943,35.6607 z"          sodipodi:nodetypes="csssscsccsscsssssscssssssssssssssccccsssssssccccssccssssscccscssscsc" />     </g>   </g> </svg>'
}


var watermarkControl = null
var watermarkControlConfig = {
    "group": "pop",
    "types": ['help','diversificationGraph','outliers','centroidStats']
}

function watermarkControlClicked(type) {
    if (isPlaying() == false) {
        if (layerStates['watermark']) {
            removeWatermarkControl(layerStates['watermark'])
            setIconInactive(layerStates['watermark'])
            if (type && layerStates['watermark'] != type) {
                addWatermarkControl(type)
                setIconActive(type)
                layerStates['watermark'] = type
            } else {
                layerStates['watermark'] = null
            }
        } else {
            if (type) {
                addWatermarkControl(type)
                setIconActive(type)
                layerStates['watermark'] = type
            }

        }
    }
}

function removeWatermarkControlIfExists() {
    if (layerStates['watermark']) {
        removeWatermarkControl(layerStates['watermark'])
        setIconInactive('watermark')
    }
}
function removeWatermarkControl(type) {
    if (watermarkControl && watermarkControl._map != null) {
        watermarkControl.remove()
    }
}

function addWatermarkControl(type) {
    var thehtml = ""
    var width = "350px"
    if (type == 'cladefinder') {
        thehtml = '<iframe class="resized" src="' + getCladeFinderCompleteURL(clade) + '" width="600" height="315"></iframe>'
        //'<div id="" style="overflow:scroll; height:600px;">' + getCloseButtonHTML('help') + ' help' + "</div>"  
        width = '550px'
    }
    if (type == 'help') {
        thehtml = '<iframe style="border:1px solid black;background: oldlace" class="resized" src="' + installationRootURL + 'documentationLinks.html" width="600" height="620"></iframe>'
        width = '650px'
    }
    if (type == 'diversificationGraph') {
        getDiversificationByTMRCAcounts()
        var smoothed = smooth([1,6,15,20,15,6,1])//smooth([1,4,6,4,1])
        width = "550px"
        thehtml = '<div id="" style="overflow:scroll; height:600px;border:1px solid black;background: oldlace">'+getDownloadButtonHTML('diversificationGraphGraph') + getCloseButtonHTML('diversificationGraph')+createSVGDiversificationGraph(smoothed) + "</div>"
    }
    if (type == 'countryExclusionsButton') {
        thehtml = '<div id="" style="overflow:scroll; height:600px;">' + createExclusionsHTML() + "</div>"
    }
    if (type == 'centroidStatsImg') {
        thehtml = '<div id="" style="overflow:scroll; height:600px;border:1px solid black;background: oldlace">' + getCentroidStatsHTML() + "</div>"
    }
    
    L.Control.commonWatermark = L.Control.extend({
        onAdd: function(map) {
            var text = L.DomUtil.create('div');
            text.id = "commonwatermark";
            text.innerHTML = thehtml
            text.style.width = width
            return text;
        },


    });

    L.control.commonwatermark = function(opts) {
        return new L.Control.commonWatermark(opts);
    }

    watermarkControl = L.control.commonwatermark({ position: 'topright'})
    watermarkControl.addTo(lmap);
}
