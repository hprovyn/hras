var branchBasalLines = []
var deadLeaves = []

function countSubclades(clade) {
    if (parentChildren.hasOwnProperty(clade)) {
        return parentChildren[clade].length
    }
    return 0
}
function calculateBranchWeights(clade, level) {
    //var branchWeights, $parentChildren, $branchBasalLines, $deadLeaves;
    var basalSamples = countBasalSamples(clade);
    var thisCount = basalSamples + countSubclades(clade);
    if (parentChildren.hasOwnProperty(clade)) {
        var children = parentChildren[clade]
        for (var i = 0; i < children.length; i++) {
            var child = children[i]
            calculateBranchWeights(child, level + 1);
        }
    } 
    if (thisCount == 0) {
        deadLeaves.push(clade);
    } else {
        branchBasalLines[clade] = {"count": thisCount, "level": level}
    }
}

function countBasalSamples(clade) {
    var count = 0
    var tpris = Object.keys(targetPointRadiiIdSubclades)
    for(var i = 0; i < tpris.length; i++) {
        var theset = targetPointRadiiIdSubclades[tpris[i]]
        for (var j = 0; j < theset.length; j++) {
            if (theset[j]['clade'] == clade) {
                count += 1;
            }
        }
    }
    return count
}

function countIncompleteAtClade(clade) {
    
    var count = 0;
    var incompbaskeys = Object.keys(incompleteBasals)
    for (var i = 0; i< incompbaskeys.length; i++){
        var theid = incompbaskeys[i]
        if (incompleteBasals[theid][0] == clade) {
            count += 1;
        }
    }
    return count;
}

var incompleteBasals = {}

var basalSamplesFile = dataRootURL + "incompleteBasals.csv"

function loadIncompleteBasals(downstr) {
    //is all ids necessary?
    incompleteBasals = {}
    var allIds = []
    var tpris = Object.keys(targetPointRadiiIdSubclades)
    for(var i = 0; i < tpris.length; i++) {
        var theset = targetPointRadiiIdSubclades[tpris[i]]
        for (var j = 0; j < theset.length; j++) {
            allIds.push(theset[j]['id'])
        }
    }
    $.ajax({
      type:    "GET",
      async: false,
      url:     basalSamplesFile,
      success: function(text) {
        parseBasalSamplesFile(downstr, allIds, text.split("\r\n"))
        calculateBranchWeights(clade, 1)
        pruneZeroSampleLeavesToCreateEffectiveGeolocatedPhylogeny(clade);
        getAPosterioriesFromIncompleteBasals();
        updateBasalBranchLinesWithIncompleteBasalAPosterioris();
        assignEffectiveBranchWeights(clade, 1);
        finallyAddDiversityToMap()
      }
    })
  }

  function parseBasalSamplesFile(downstr, allIds, lines) {
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].split(",")
      var theid = line[0]
      if (line.length == 2) {
        var basalSplit = line[1].split(":")
        //be sure to trim EOL chars
        if (downstr.indexOf(basalSplit[0]) != -1 && allIds.indexOf(theid) != -1) {
            incompleteBasals[theid] = basalSplit
        }
      }
      
    }
  }


  
function recursivePrune(root, subclade) {
    
    var parent = childParents[subclade];
    branchBasalLines[parent]["count"] -= 1;
    if (branchBasalLines[parent]["count"] == 0 && parent != root) {
        recursivePrune(root, parent);
    }
}

function pruneZeroSampleLeavesToCreateEffectiveGeolocatedPhylogeny(root) {    
    for (var i = 0; i < deadLeaves.length; i++) {
        var deadLeaf = deadLeaves[i]
        if (deadLeaf != root) {
            recursivePrune(root, deadLeaf);
        }
    }
}

var aposteriories = {}
function getAPosterioriesFromIncompleteBasals() {
    aposteriories = {}
    var incbasalkeys = Object.keys(incompleteBasals)
    for (var i = 0; i < incbasalkeys.length; i++){
        var incBasalId = incbasalkeys[i]
        var aposteriori = calculateIncompleteBasalAPosterioris(incBasalId);
        aposteriories[incBasalId] = aposteriori;
    }
}

function calculateIncompleteBasalAPosterioris(sampleId) {
    var aposteriori = {}
    var theincomplete = incompleteBasals[sampleId]

    for (var i = 0; i < theincomplete.length; i++) {
        var possibleSubclade = theincomplete[i]
        if (branchBasalLines.hasOwnProperty(possibleSubclade)) {
            aposteriori[possibleSubclade] = branchBasalLines[possibleSubclade]['count'] - countIncompleteAtClade(possibleSubclade);
        }
            
    }
    var total = Object.values(aposteriori).reduce((partialSum, a) => partialSum + a, 0)

    var apkeys = Object.keys(aposteriori)
    for(var i = 0; i < apkeys.length; i++ ) {
        var akey = apkeys[i]
        aposteriori[akey] /= total;
    }
    if (Object.keys(aposteriori).length == 1) {
        aposteriori[incompleteBasals[sampleId][0]] = 1;
    }
    return aposteriori;
}

function updateBasalBranchLinesWithIncompleteBasalAPosterioris() {
    var apkeys = Object.keys(aposteriories)

    for (var i = 0; i < apkeys.length; i++) {
        var sampleId = apkeys[i]
        var count = 0;
        var thissampleapkeys = Object.keys(aposteriories[sampleId])
        for (var j = 0; j < thissampleapkeys.length; j++) {
            var subclade = thissampleapkeys[j]
            if (branchBasalLines.hasOwnProperty(subclade)) {
                branchBasalLines[subclade]['count'] += aposteriories[sampleId][subclade];
                if (count == 0) {
                    branchBasalLines[subclade]['count'] -= 1;
                }
            }
            count += 1;
        }
    }
}

function loadPrecomputed(radius) {
    $.ajax({
        type:    "GET",
        async: false,
        url:        getDenomURLbyRadius_old(radius) ,
        success: function(text) {
          //parsePrecomputed(text.split("\r\n"))
          parseCompressed2(text.split("\r\n"))
          loadTargetAndAddToMap()
        }
      })
  }

var effectiveTreeParentChildren = {}
var branchWeights = {}
function assignEffectiveBranchWeights(subclade, parentWeight) {
    
    if (branchBasalLines.hasOwnProperty(subclade)) {
        var thisCount = branchBasalLines[subclade]["count"];

        if (thisCount > 0) {
            var thisWeight = parentWeight / thisCount;
            branchWeights[subclade] = thisWeight;
            if (parentChildren.hasOwnProperty(subclade)) {
                effectiveTreeParentChildren[subclade] = []
                var children = parentChildren[subclade]
                for( var i = 0; i < children.length; i++) {
                    var child = children[i]
                    effectiveTreeParentChildren[subclade].push(child);
                    assignEffectiveBranchWeights(child, thisWeight);
                }
            } 
        }
    }
}

function getTotalWeightForIncompleteBasalSample(sampleId) {

    var totalWeight = 0;
    var akeys = Object.keys(aposteriories[sampleId])
    for(var i = 0; i < akeys.length; i++) {
        var subclade = akeys[i]
        if (branchWeights.hasOwnProperty(subclade)){
            totalWeight += branchWeights[subclade] * aposteriories[sampleId][subclade];
        }
        
    }
    return totalWeight;
}

function finallyAddDiversityToMap() {
    var radius = getRadius()
    //var heatmapInput = points.map(function(p) {return {id: p[0], lat: p[1], lng: p[2], count: p[3] / Math.pow(p[4], 1.3), radius: p[4] * baseRadius / ((1 + Math.cos(p[1] / 180 * Math.PI)) / 2) / 1.1 , clade: p[5]}})

    heatmapInput = []
    Object.keys(targetPointRadiiIdSubclades).map(function(k) {
        var split = k.split(",")
        var lat = parseFloat(split[0])
        var lng = parseFloat(split[1])
        var thegridsq = getGridSquare(lat, lng)
        var thedenomweight = thedenom[thegridsq[0]+","+thegridsq[1]]
        var ther = getR(parseFloat(split[2]))
        
        for (var j = 0; j <targetPointRadiiIdSubclades[k].length;j++) {

            var id = targetPointRadiiIdSubclades[k][j]['id']
            var clade = targetPointRadiiIdSubclades[k][j]['clade']
            var theweight = branchWeights[clade]
            if (incompleteBasals.hasOwnProperty(id)) {
                theweight = getTotalWeightForIncompleteBasalSample(id)
            }
            heatmapInput.push({id:id,lat:lat, lng:lng, radius: ther * baseRadius * radius / 400, count: theweight / thedenomweight / ther / ther,clade:clade})
        }
    })
    addHeatMapClassic(heatmapInput)    
}

var baseRadius = 3// / 400 * 229;
var scalePercentages = []
var scalePercentageFactor = 0.1745 * 3.7

var heatmapInput = {}

function loadTargetAndAddToMap() {
    if (clade) {
        var downstr = getDownstream(clade)
        loadIncompleteBasals(downstr)    
    }
  }

function updateScalePercentages() {

}

function createMarker(circlifiedDatum,color) {
    return L.marker([circlifiedDatum["lat"], circlifiedDatum["lng"]], {icon:getYSEQIconNoOffset(color, circlifiedDatum["id"]), title:circlifiedDatum["id"]})
    .bindPopup(generateTextForSubclade(circlifiedDatum["clade"],circlifiedDatum["id"]) + '<br><br><iframe class="resized" src="'+getCladeFinderCompleteURL(circlifiedDatum["clade"])+'" width="560" height="315"></iframe>',
    {maxWidth: 560})
}

function getPopup(datum) {
    return {}
}
//function getPopup(datum) {
//    return generateTextForSubclade(datum["clade"],datum["id"]) + 
//}


function getUpstreamToHg(subclade) {
    var thisClade = subclade
    var upstr = []
    while (childParents.hasOwnProperty(thisClade) && thisClade != clade) {
        upstr.push(thisClade)
        thisClade = childParents[thisClade]
    }
    upstr.push(clade)
    return upstr
}

function generateTextForSetOfClades(condProb, subclade, upstream) {
    var treehtml = ""
    var condProbText = "1"
    if (condProb != 1) {
        condProbText = Math.round(condProb * 1000) / 10 + "%"
    }
    var computationText = "Weight for " + subclade + " = " + condProbText + " / ("
    var divisors = []
    var weight = 1
    for (var i = 0; i < upstream.length; i++) {
        var branchObj = branchBasalLines[upstream[i]]
        if (branchObj == null || branchObj.hasOwnProperty('count') == false) {
            alert(subclade + " " + upstream[i] + ' not in branchBasalLines')
        }
        var rounded =  Math.round(branchObj['count'] * 100)/100
        treehtml += 'Level ' + branchObj['level'] + ": " + upstream[i] + ", " + rounded + " lines<br>";
        divisors.push(rounded)
        weight = weight / branchObj['count']
    }
    comphtml = computationText + divisors.join(" * ") + ") = " + weight * condProb
    return {"weight": weight, "treehtml": treehtml, "comphtml":comphtml}
}

function generateTextForSubclade(subclade, theid) {
    
    if (aposteriories.hasOwnProperty(theid)) {
        var uniqueUpstream = []
        var cladeOutputs = {}
        var thisPosteriori = aposteriories[theid]
        var aposteriText = "Incomplete Basal Sample";
        var aposteriKeys = Object.keys(thisPosteriori);
        var totalWeight = 0;
        for (var i = 0; i < aposteriKeys.length; i++) {
            var thisClade = aposteriKeys[i]
            aposteriText += "<br>" + thisClade + ": " + Math.round(thisPosteriori[thisClade] * 1000) / 10 + "%"; 
            var thisupstream = getUpstreamToHg(thisClade).reverse()
            cladeOutputs[thisClade] = generateTextForSetOfClades(thisPosteriori[thisClade], thisClade, thisupstream)
            aposteriText += "<br>" + cladeOutputs[thisClade]["comphtml"] + "<br>"
            totalWeight += thisPosteriori[thisClade] * cladeOutputs[thisClade]["weight"]
            for (var j = 0; j < thisupstream.length; j++) {
                if (uniqueUpstream.indexOf(thisupstream[j]) == -1) {
                    uniqueUpstream.push(thisupstream[j])
                }
            }
        }
        var html = "<b>Effective independent lines per haplogroup<br><br></b>"
        var branchLinesDisp = generateTextForSetOfClades(1, subclade, uniqueUpstream)["treehtml"]
        html += branchLinesDisp + "<br>" + aposteriText + "<br>" + "Total Weight = " + totalWeight;
        return html;
    } else {
        var html = "<b>Effective independent lines per haplogroup<br><br></b>"
        var upstream = getUpstreamToHg(subclade).reverse()
        var onesubcladeOutput = generateTextForSetOfClades(1, subclade, upstream)
        html += onesubcladeOutput["treehtml"] + "<br>" + onesubcladeOutput["comphtml"]
        return html
    }
    
}
function generateExplanationHTML() {
    var arr = Object.entries(branchBasalLines)
    arr.sort((firstEl, secondEl) => {return firstEl[1]['level'] - secondEl[1]['level'] })
    var html = "Effective independent lines per haplogroup\n"
    for(var i = 0; i < arr.length; i++) {
        html += 'Level ' + arr[i][1]['level'] + ": " + arr[i][0] + ", " + arr[i][1]['count'] + "\n";
    }
    return html
}

var maxOpacity = 0.65
var minOpacity = .27

var gradient = {'0':'white',
        '.05':'yellow',
        '.4': 'yellow',
        '.66': 'green',
        '.80': 'green',
        '1': 'blue'}

var cfg = getHeatmapConfig(minOpacity, maxOpacity, gradient)
var scalePercentages = ["", "", "40%", "66%", "80%", "100%"];

function addLegend() {
    var text = document.getElementById('legend')
    text.innerHTML = '<br>Relative Diversity<br><div style="width:100%"><div style="width:10%;float:left"><img src="' + imagesDir + 'diversity_heatmap_legend.png" height="12%"></div><div style="margin-left:10%;font-size:10">' + scalePercentages[5] + '<br>' + scalePercentages[4] + '<br>' + scalePercentages[3] + '<br>' + scalePercentages[2] + '<br>' + scalePercentages[1] + '<br>' + scalePercentages[0] + '</div></div>'
}
