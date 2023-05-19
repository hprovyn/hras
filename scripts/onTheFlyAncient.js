
function hideOnTheFlyAncientSlider() {
    document.getElementById('ontheflyancientslider').innerHTML = ""
}


var otfAncientMax = 20000

function addOnTheFlyAncientSlider() {

    if (!waterGrid ||waterGrid.length ==0) {
        loadWaterGrid()
    }
    var min = 500
    var max = otfAncientMax
    var start1 = 3000
    var start2 = 5000
    var step = 500
    var otfancientslider = document.getElementById('ontheflyancientslider')
    otfancientslider.innerHTML = '<div class="range-slider container"><div id="ancientSliderLabel"></div><span class="outputOne"></span><span class="outputTwo"></span><span class="full-range"></span><span class="incl-range"></span><input name="rangeOne" value="'+start1+'" min="'+min+'" max="'+max+'" step="'+step+'" type="range"><input name="rangeTwo" value="'+start2+'" min="'+min+'" max="'+max+'" step="'+step+'" type="range"></div>'
    otfancientslider.innerHTML += '<br><br><div id="otfPresetsDiv"></div>'
    addOTFPresets()
    presetActivate('BA')
    //otfancientslider.innerHTML = '<div class="slider"><input type="range" min="'+min+'" max="'+max+'" step="500" value="500" oninput="rangeValue.innerText = this.value"><p id="rangeValue">500</p></div>'
//<span class="output outputOne"></span><span class="output outputTwo"></span>

    var rangeOne = document.querySelector('input[name="rangeOne"]'),
    rangeTwo = document.querySelector('input[name="rangeTwo"]'),
    ancientSliderLabel = document.getElementById('ancientSliderLabel'),

    outputOne = document.querySelector('.outputOne'),
    outputTwo = document.querySelector('.outputTwo'),
    inclRange = document.querySelector('.incl-range'),
    updateView = function () {
        var startEnd = getStartEnd()
        ancientSliderLabel.innerHTML = "From " + startEnd.start + " to " + startEnd.end + " ybp"
        if (this.getAttribute('name') === 'rangeOne') {
            outputOne.style.left = this.value / this.getAttribute('max') * 100 + '%';
        } else {
            outputTwo.style.left = this.value / this.getAttribute('max') * 100 + '%';
        }
        if (parseInt(rangeOne.value) > parseInt(rangeTwo.value)) {
            inclRange.style.width = (rangeOne.value - rangeTwo.value) / this.getAttribute('max') * 100 + '%';
            inclRange.style.left = rangeTwo.value / this.getAttribute('max') * 100 + '%';
        } else {
            inclRange.style.width = (rangeTwo.value - rangeOne.value) / this.getAttribute('max') * 100 + '%';
            inclRange.style.left = rangeOne.value / this.getAttribute('max') * 100 + '%';
        }
        

    };
    if (otfAncientLoaded == false) {
    }


    updateView.call(rangeOne);
    updateView.call(rangeTwo);
    $('input[type="range"]').on('mouseup', function() {
        this.blur();
    }).on('mousedown input', function () {
        updateView.call(this);
        updateFrequencyMapForAncientInterval()
    });


}

var presets = {
    //"UP": {"title": "Upper Paleolithic", "start":50000, "end":12000},
    "MESO":{"title": "Mesolithic", "start":20000,"end":10000},
    "NEO": {"title": "Neolithic", "start":10000, "end":5000}, 
    "BA": {"title": "Bronze Age", "start":5000, "end": 3000}, 
    "IA": {"title": "Iron Age", "start":3000, "end":2000},
    "ROM": {"title": "Roman Empire", "start":2000, "end":1500},
    "MA": {"title": "Middle Age", "start": 1500, "end":500}
    }

function addOTFPresets() {

    var presetsKeys = Object.keys(presets)
    presetsKeys.sort(function (a) {presets[a]['start']})
    var theelement = document.getElementById('otfPresetsDiv')

    for (var i = 0; i < presetsKeys.length; i++) {
        var thisn = presets[presetsKeys[i]]
        theelement.innerHTML += '<button id="'+presetsKeys[i]+'" title="'+thisn['title']+'" onclick="updateFrequencyMapForAncientInterval('+ thisn['start'] +', ' + thisn['end'] + '); presetActivate(\''+presetsKeys[i]+'\')">'+presetsKeys[i]+'</button>'
    }
}

function presetActivate(thekey) {
    var presetkeys = Object.keys(presets)
    for (var i = 0; i < presetkeys.length; i++) {
        if (thekey == presetkeys[i]) {
            setIconActive(presetkeys[i])
        } else {
            setIconInactive(presetkeys[i])
        }
    }
}
function getStartEnd() {
    var bound1 = document.querySelector('input[name="rangeOne"]').value
    var bound2 = document.querySelector('input[name="rangeTwo"]').value

    var end = Math.min(bound1, bound2)
    var start = Math.max(bound1,bound2)
    return {'start': start, 'end':end}
}
function updateFrequencyMapForAncientInterval(st, en) {
    var start, end
    if (st) {
        start = st
        end = en
        document.querySelector('input[name="rangeOne"]').value = st
        document.querySelector('input[name="rangeTwo"]').value = en
        
        ancientSliderLabel.innerHTML = "From " + start + " to " + end + " ybp"

        var rangeOne = document.querySelector('input[name="rangeOne"]'),
        rangeTwo = document.querySelector('input[name="rangeTwo"]'),    
        inclRange = document.querySelector('.incl-range')

        if (parseInt(rangeOne.value) > parseInt(rangeTwo.value)) {
            inclRange.style.width = (rangeOne.value - rangeTwo.value) / otfAncientMax * 100 + '%';
            inclRange.style.left = rangeTwo.value / otfAncientMax * 100 + '%';
        } else {
            inclRange.style.width = (rangeTwo.value - rangeOne.value) / otfAncientMax * 100 + '%';
            inclRange.style.left = rangeOne.value / otfAncientMax * 100 + '%';
        }
    } else {
        var startEnd = getStartEnd()
        start = startEnd['start']
        end = startEnd['end']
    }

    ancientQMap(start, end, clade, getRadius())
    if (layerStates['pie']) {
        deactivatePieChartLayer()
        addPieChartLayer()
    }
    //alert(end + ' to ' + start + ' ybp')
}

var otfaPointRadiiMap = {}
var nans = []

var otfAncientLoaded = false


var ancientIds = []

function loadOnTheFlyAncientKits() {
    otfaSamples = []
    $.ajax({
        type:    "GET",
        async: false,
        url:     dataRootURL+dnaType+"_onTheFlyAncient.txt",
        success: function(text) {
        parseKitsAncient(text.split("\r\n"))
        ancientIds = otfaSamples.map(f => f['id'])
        otfAncientLoaded = true
        //loadWaterGrid()
        }
    })
}
  
var otfaSamples = []

function parseKitsAncient(lines) {
    for (var i = 0; i < lines.length - 1; i++) {
        var line = lines[i].split(",")
        var id = line[0]
        var thehg = line[1]
        var lat = parseFloat(line[2])
        var lng = parseFloat(line[3])
        var r = parseFloat(line[4])
        var ybp = parseInt(line[5])
        var country = line[6]
        var theproj = line[7]
        if (line[7] == 'A0-T') {
            theproj = thehg
        }
        if (isNaN(lat)) {
            nans.push(id)
        }
        otfaSamples.push({"id": id, "hg":thehg, 'lat': lat, 'lng':lng, 'r':r, "ybp": ybp, "country": country, "main_hg": theproj})
    }
}

function filterOTFA(start, end, subclade) {
    var filtered = []
    filtered = otfaSamples.filter(a => a['ybp'] < start && a['ybp'] > end)
    var downstream = getDownstream(subclade)
    if (subclade != "") {
        filtered = filtered.filter(a => downstream.indexOf(a['hg']) != -1)
    }
    return filtered
}

function squishToPrKeyMap(pts) {
    var prKeyMap = {}
    for (var i = 0; i < pts.length; i++) {
        var prKey = pts[i]['lat'] + "," + pts[i]['lng'] + "," + pts[i]['r']
        if (prKeyMap.hasOwnProperty(prKey)) {
            prKeyMap[prKey]++
        } else {
            prKeyMap[prKey] = 1
        }
    }
    return prKeyMap
}

function ancientQMap(start, end, subclade, radius) {
    if (typeof svgOverlays !== 'undefined') {
        removeSVGs()
    }
    var squishedDenom = squishToPrKeyMap(filterOTFA(start, end, ""))
    
    var qMapDenom = Object.keys(squishedDenom).map(k => {
        var split = k.split(",")
        return {y:parseFloat(split[0]), x:parseFloat(split[1]), r: getR(parseFloat(split[2])) * radius, i:squishedDenom[k]}
    })

    var squishedNumerator = squishToPrKeyMap(filterOTFA(start, end,subclade))
    
    var qMapNumerator =  Object.keys(squishedNumerator).map(k => {
        var split = k.split(",")
        return {y:parseFloat(split[0]), x:parseFloat(split[1]), r: getR(parseFloat(split[2])) * radius, i:squishedNumerator[k]}
    })




    var signal = []
    var denom = []
    for (var i = 0; i < qMapNumerator.length; i++) {
        addToGradient(signal, qMapNumerator[i]["x"], qMapNumerator[i]["y"], qMapNumerator[i]["r"], qMapNumerator[i]["i"])
    }
    //denom = instantiateDummyAll(getMaxOfSurface(signal))
    for (var i = 0; i < qMapDenom.length; i++) {
        addToGradient(denom, qMapDenom[i]["x"], qMapDenom[i]["y"], qMapDenom[i]["r"], qMapDenom[i]["i"])
    }
    thedenom = denom

    var numFilteredOutWater = filterOutWater(signal)
    var quotient = divide(numFilteredOutWater, denom)

    addToMap(quotient)
}

function filterOutWater(surface) {
    var filtered = {}
    for (const [key, value] of Object.entries(surface)) {
        var ijsplit = key.split(",")
        var i = parseInt(ijsplit[0])
        var j = parseInt(ijsplit[1])
        if (waterGrid[i][j] != "0") {
            filtered[key] = value
        }
    }
    return filtered
}

function addAncientCoverageSurface(start, end, radius) {
    removeSVGs()

    var squishedDenom = squishToPrKeyMap(filterOTFA(start, end, ""))
    
    var qMapDenom = Object.keys(squishedDenom).map(k => {
        var split = k.split(",")
        return {y:parseFloat(split[0]), x:parseFloat(split[1]), r: getR(parseFloat(split[2])) * radius, i:squishedDenom[k]}
    })

    var denom = []

    for (var i = 0; i < qMapDenom.length; i++) {
        addToGradient(denom, qMapDenom[i]["x"], qMapDenom[i]["y"], qMapDenom[i]["r"], qMapDenom[i]["i"])
    }

    var denomFilteredOutWater = filterOutWater(denom)

    var quotient = []

    var qMax = getMaxOfSurface(denomFilteredOutWater)

    for (const [key, value] of Object.entries(denomFilteredOutWater)) {
            quotient[key] = denomFilteredOutWater[key] / qMax
    }

    addToMap(quotient)
}



function addAncientCoverageHoleSurface(start, end, radius) {
    removeSVGs()

    var squishedDenom = squishToPrKeyMap(filterOTFA(start, end, ""))
    
    var qMapDenom = Object.keys(squishedDenom).map(k => {
        var split = k.split(",")
        return {y:parseFloat(split[0]), x:parseFloat(split[1]), r: getR(parseFloat(split[2])) * radius, i:squishedDenom[k]}
    })

    var denom = []

    for (var i = 0; i < qMapDenom.length; i++) {
        addToGradient(denom, qMapDenom[i]["x"], qMapDenom[i]["y"], qMapDenom[i]["r"], qMapDenom[i]["i"])
    }

    addAncientCoverageGrayToMap(denom)
}

function addAncientCoverageGrayToMap(surface) {

    precomputedHex = "#000000"

    var buckets = 50
    var svgElems = []
    var rects = []
    var bucketRows = rows / buckets
    for (var i = 0; i < buckets; i++) {
        svgElems[i] = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgElems[i].setAttribute('xmlns', "http://www.w3.org/2000/svg");
        svgElems[i].setAttribute('viewBox', "0 0 " + cols + " " + bucketRows);
        svgElems[i].setAttribute('preserveAspectRatio',"none")
        rects[i] = '<rect x="0" y="0" width= "100%" height="100%" fill-opacity="0"/>'
    }
    
    var rgb = hexToRgb("#ff0000")
    var rowColMap = []
    
    for (var i = 0; i < rows; i++) {
        for (var j = 0; j < cols; j++) {
            var thekey = i + "," + j
            if (surface.hasOwnProperty(thekey) == false && waterGrid[i][j] == "1") {
                if (!rowColMap.hasOwnProperty(i)) {
                    rowColMap[i] = []
                }
                rowColMap[i][j] = 1    //only store indices that are not covered and also not water
            }

        }
    }

    //commence from here


    var rowKeys = Object.keys(rowColMap).sort()
    for (var i = 0; i < rowKeys.length; i++) {
        var row = rowKeys[i]
        var thisRowBucket = Math.floor(row / bucketRows)
        var colKeys = Object.keys(rowColMap[row]).sort()
        var thisBlock = null
        for (var j = 0; j < colKeys.length; j++) {
            var col = colKeys[j]
            var thisTruncVal = 1

            if (thisBlock) {
                if (thisBlock["colEnd"] == col - 1 && thisBlock["value"] == thisTruncVal) {
                    thisBlock["colEnd"] = col
                } else {
                    rects[thisRowBucket] += createSVGrect(thisBlock, row, bucketRows)
                    //var hue = precomputedHues[thisTruncVal]
                    //var fillColor = rgbToHex(HSVtoRGB(hue,1,1))
                    var fillColor = precomputedHex
                    thisBlock = {"colStart": col, "colEnd": col, "fillColor": fillColor, "value":thisTruncVal}
                }
            } else {
                //var hue = precomputedHues[thisTruncVal]
                //var fillColor = rgbToHex(HSVtoRGB(hue,1,1))
                var fillColor = precomputedHex
                thisBlock = {"colStart": col, "colEnd": col, "fillColor": fillColor, "value":thisTruncVal}
            }

        }
        rects[thisRowBucket] += createSVGrect(thisBlock, row, bucketRows)

    }
    // create an orange rectangle
    
    
    
    //rects[thisRowBucket] += '<rect x="' + col / cols * 100 + '%" y="' + (bucketRows - row % bucketRows - 1) / bucketRows * 100 + '%" width="'+1/cols *100+'%" height="'+ 1 / bucketRows *100 + '%" fill="' + fillColor + '" fill-opacity="' + (.25 + value / 2) + '"/>'
    //}
    



var latSpan = latRange[1] - latRange[0]

for (var i = 0; i < buckets; i++) {
    svgElems[i].innerHTML = rects[i]

    svgOverlays.push(L.svgOverlay(svgElems[i], [ [ latRange[0] + latSpan / buckets * i, lonRange[0] ], [ latRange[0] + latSpan / buckets * (i+1), lonRange[1] ] ]))
}
for (var i = 0; i < svgOverlays.length; i++) {
    svgOverlays[i].addTo(lmap);
}

}


//pie charts



function otfa_getCountsForCountry(start, end, code) {
    var filtered = filterOTFA(start, end, "").filter(a => a['country']==code)
    var counts = {}
    for (var i = 0; i < filtered.length; i++) {
        var main_hg = filtered[i]['main_hg']
        if (counts.hasOwnProperty(main_hg) == false) {
            counts[main_hg] = 1
        } else {
            counts[main_hg]++
        }
    }
    return counts
}

  function otfa_createPieChartLayer() {
    var startEnd = getStartEnd()
    var start = startEnd['start']
    var end = startEnd['end']
    var filtered = filterOTFA(start, end, "")
    var countryKeys = filtered.map(a=>a['country'])
    var countryTotals = {}
    var countryInHg = {}
    var subcladeFiltered =  filterOTFA(start, end, clade)
    for (var i = 0; i < countryKeys.length; i++) {
        var code = countryKeys[i]
        countryTotals[code] = filtered.filter(a=>a['country']==code).length
        countryInHg[code] = subcladeFiltered.filter(a=>a['country']==code).length
    }
    var piechartmarkers = []
    for (var i = 0; i < countryKeys.length; i++) {
        var code = countryKeys[i]
        if (!countryCoords.hasOwnProperty(code)) {
            //alert(code + " not found")
        }
        if (code != "" && countryTotals.hasOwnProperty(code)) {
            var drillDownCounts = otfa_getCountsForCountry(start, end, code)
            piechartmarkers = piechartmarkers.concat(iconCircleWithText_SVG(clade, code, countryCoords[code]["name"], [countryCoords[code]["lat"], countryCoords[code]["lng"]],countryInHg[code] + "/" + countryTotals[code], {radius: getPieRadius(countryTotals[code])}, countryInHg[code],drillDownCounts,countryTotals[code]))
        }
    }
    piechartlayergroup = L.layerGroup(piechartmarkers)
}

