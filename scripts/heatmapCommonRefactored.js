var heatmapIconConfigRedesigned = {
    "fn": "heatmapTypeClicked",
    "group": "heatmapType",
    "width": '10%',
    "buttons": [
        {
            "title": "Frequency Heatmap",
            "id": "alpha",
            "icon": imagesDir + "Frequency_new.png"
        },
        {
            "title": "Frequency Heatmap Classic",
            "id": "classic",
            "icon": imagesDir + "Fmap_70.png"
        },
        {
            "title": "Diversity Heatmap",
            "id": "diversity",
            "icon": imagesDir + "Dmap_70.png"
        }
    ]
}

var dnaTypesConfig = {
    "fn": "dnaTypeClicked",
    "group": "dnaType",
    "width": '10%',
    "buttons": [
        {
            "title": "Y-DNA",
            "id": "y",
            "icon": imagesDir + "Y_mode.png"
        },
        {
            "title": "mitochondrial DNA",
            "id": "mt",
            "icon": imagesDir + "mt_mode.png"
        }
    ]
}

var questionConfig = {
    "fn": "watermarkControlClicked",
    "group": "question",
    "width": '10%',
    "buttons": [
        {
            "title": "Help",
            "id": "help",
            "icon": imagesDir + "help.png"
        }
    ]
}

function objectHasAnyKey(object, keys) {
    for (var i = 0; i < keys.length; i++) {
        if (object.hasOwnProperty(keys[i]) && object[keys[i]]) {
            return true
        }
    }
    return false
}

function getButtonsRedesigned(config) {
    var buttons = config['buttons']
    var thehtml = ""
    for (var i = 0; i < buttons.length; i++) {
        var thisConf = buttons[i]
        if (thisConf.hasOwnProperty('requireAny') && objectHasAnyKey(layerStates,thisConf['requireAny']) || thisConf.hasOwnProperty('requireAny') == false) {            
            thehtml +=  getIconRedesigned(thisConf['title'],thisConf['id'],thisConf['icon'], config['fn'] + '(\''+thisConf['id']+'\')',config['width'])
        }
    }
    return thehtml
}

function getIconRedesigned(title, id, icon, fn, width) {
    return '<a  title="'+title+'"> <img style="vertical-align: middle;" id="'+id+'" width="'+width+'" src="'+icon+'" onclick="'+fn+'"></img></a>'
}

function heatmapTypeClicked(type) {
    var thehref = "hras.php?dna_type=" + dnaType + "&map_type=" + type
    if (clade != "") {
        thehref += "&hg=" + clade
    }
    window.location.href = thehref
}

function dnaTypeClicked(type) {
    window.location.href = "hras.php?dna_type=" + type + "&map_type=" + mapType
}

function getWatermarkFromTemplate(title, description, version) {
    var logoURL = imagesDir + "HRAS_logo.jpg"
    var text = '<img src="' + logoURL + '" width="100%"></img>'
    
    text += '<div style="font-size:20"><b>'+title+'</b></div>'+ getButtonsRedesigned(dnaTypesConfig) + "&nbsp;" + getButtonsRedesigned(heatmapIconConfigRedesigned) + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + getButtonsRedesigned(questionConfig) + '<br>' + description
    text += '&nbsp;<a href="#" onclick="alert(\'HRAS does not store the information you enter and does not use cookies. If you think something is not working correctly please contact hunterprovyn@gmail.com\')">Legal / Contact</a>'
    text += '<br>Github repo: <a href="https://github.com/hprovyn/frequency-heatmap">hprovyn/frequency-heatmap</a>'
    text += '<div id="sampleCount"></div>' + version + "<br>"+ '<a href="https://www.phylogeographer.com"><img src="' + imagesDir + 'Phylogeographer-Logo-small-transparent.png" width="55%"/></a><br><a href="https://www.yseq.net"><img src="' + imagesDir + 'YSEQ-GmbH-Logo-small-transparent.png"/></a><a href="https://www.yfull.com"><img src="' + imagesDir + 'YFull-Logo-small-transparent.png"/></a>';
    return text;
}

function getUniqueMap(data) {
    var spotMap = {}
    for (var i = 0; i < data.length; i++) {
        spotKey = data[i]["lat"] + "_" + data[i]["lng"]
        if (spotMap.hasOwnProperty(spotKey)) {
            spotMap[spotKey]["points"].push({clade: data[i]["clade"], id: data[i]["id"]})
            spotMap[spotKey]["weight"] = spotMap[spotKey]["weight"] + data[i]["count"]
        } else {
            spotMap[spotKey] = {lat: data[i]["lat"], lng: data[i]["lng"], points: [{clade: data[i]["clade"], id: data[i]["id"]}], weight: data[i]["count"]}
        }
    }
    return spotMap
}

var manifestInfo = {}
var version = "";
function getManifest() {
  $.ajax({
    type:    "GET",
    async: false,
    url:     updateManifestFile,
    success: function(text) {
      manifestLines = text.split("\r\n")
      for (var i = 0; i < manifestLines.length; i++) {
        var manSplit = manifestLines[i].split(",")
        manifestInfo[manSplit[0]] = manSplit[1]
      } 
      version = manifestInfo['treeName'] + " " + manifestInfo['YFull-version'];
    },
    error:   function() {
        // An error occurred
        alert("error loading manifest file");
    }
  });
}

function getGridSquare(lat, lon) {
    return [Math.floor((lat - latRange[0]) * cellsAlongOneDegree), Math.floor((lon-lonRange[0]) * cellsAlongOneDegree)]
}
function getGridSquareBounds(row, col) {
    return [[latRange[0] + row / cellsAlongOneDegree, lonRange[0] + col / cellsAlongOneDegree],[latRange[0] + (row + 1) / cellsAlongOneDegree, lonRange[0] + (col + 1) / cellsAlongOneDegree]]
}

var latRange = [-75,75]
var lonRange = [-180,180]
var cellsAlongOneDegree = 10
var rows = Math.floor((latRange[1]-latRange[0]) * cellsAlongOneDegree)
var cols = Math.floor((lonRange[1]-lonRange[0]) * cellsAlongOneDegree)

function parseCompressed2(lines) {
    thedenom = []
    maxIntensity = lines[0]
    recalibrateMax(maxIntensity)
    for (var i = 1; i < lines.length; i++) {
      var line = lines[i]
      var col = 0
      for (var j = 0; j < line.length; j++) {
          if (line[j] != "_") {
            var encoded = line.substring(j, j + 3)            
            var parsed = translateToValue(encoded)
            if (parsed < 0) {
                alert(i + ", " + j + " " + encoded + " yields " + parsed)
            }
            //if (parsed > 2) {
                thedenom[i - 1 + "," + col] = parseFloat(parsed) + 0.01
            //}            
            col++                
          } else {
              var blanks = translateToValueUnscaled(line.substring(j+1, j+4))
              col += blanks
              j++
          }
          j += 2
      }
    }
  }

var maxIntensity = 350
var digits = "1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!#$%()*+,-./:;=?@[]^|{}`~'"
var base = digits.length
var base2 = base * base
var base3 = base * base * base
var maxOverBase3 = maxIntensity / base3

function recalibrateMax(newMax) {
    maxIntensity = newMax
    maxOverBase3 = maxIntensity / base3
}

function translateToBase(value) {
    var translated = Math.floor(value / maxIntensity * (base * base * base - 1))
    var first = Math.floor(translated / base2)
    var second = Math.floor((translated - first * base2 ) / base)
    var third = translated % base
    return digits[first] + "" + digits[second] + "" + digits[third]
}
function translateToValue(encoded) {
    return (digits.indexOf(encoded[0]) * base2 + digits.indexOf(encoded[1]) * base + digits.indexOf(encoded[2]))* maxOverBase3
}
function translateToBaseUnscaled(value) {
    var first = Math.floor(value / base2)
    var second = Math.floor((value - first * base2 ) / base)
    var third = value % base
    return digits[first] + "" + digits[second] + "" + digits[third]
}

function translateToValueUnscaled(encoded) {
    return (digits.indexOf(encoded[0]) * base2 + digits.indexOf(encoded[1]) * base + digits.indexOf(encoded[2]))
}

function getDenomURLbyRadius_old(radius) {
    return denomURLprefix + radius + "km_p66_compressed_b3_lat.txt"
}

function getDenomURLbyRadius(radius) {
    return denomURLprefix + radius + "km_modern.txt"
}

function getRadius() {
    return parseInt(document.getElementById("myRange").value) * 50 + minRadius - 50
}


var entries = []
var hgEntries = []
var snpEntries = {}
function splitHGfromSNPentries() {
    hgEntries = entries.filter(a => a.indexOf(" ") == -1)
    snpEntries = new Set(entries.filter(a => a.indexOf(" ") != -1).map(a => a.split(" ")[0]))
}
var hgMap = {}
var snpToEntry = {}
function getHGs() {
  for (var i = 0; i < entries.length; i++) {
      var splt = entries[i].split(" ")
      var hgsplit = splt[splt.length -1].split("->")
      hgMap[hgsplit[1]] = hgsplit[0]
      if (splt.length > 1) {
          var thesnp = splt[0]
          if (snpToEntry.hasOwnProperty(thesnp)) {
              snpToEntry[thesnp].push(entries[i])
          } else {
              snpToEntry[thesnp] = [entries[i]]
          }
      }
  }
}


function getR(r) {
  return (r-1)/14*9+1
}

function autocomplete(inp, arrAll, arrHG) {
    var currentFocus;
    inp.addEventListener("input", function(e) {
        var a, b, i, val = this.value;
        closeAllLists();
        if (!val) { return false;}
        var arr = arrAll
        if (val.length < 4 && snpEntries.has(val) == false) {arr = arrHG}
        
        currentFocus = -1;
        a = document.createElement("DIV");
        a.setAttribute("id", this.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");
        a.style.overflowY = "scroll"; 
        a.style.height = "123px";
        this.parentNode.appendChild(a);
  
        var toignore = []
        if (snpEntries.has(val)) {
            var theEntries = snpToEntry[val]
            for (var i = 0; i < theEntries.length; i++) {
              b = document.createElement("DIV");
              b.innerHTML = "<strong>" + theEntries[i].substr(0, val.length) + "</strong>";
              b.innerHTML += theEntries[i].substr(val.length);
              b.innerHTML += "<input type='hidden' value=\"" + theEntries[i] + "\">";
              b.addEventListener("click", function(e) {
                  inp.value = this.getElementsByTagName("input")[0].value;              
                  closeAllLists();
                  submitNewClade();
              });
              a.appendChild(b);    
              toignore.push(theEntries[i])
            }
        }
        for (i = 0; i < arr.length; i++) {
          if (toignore.indexOf(arr[i]) == -1) {
  
          
          if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
            b = document.createElement("DIV");
            b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
            b.innerHTML += arr[i].substr(val.length);
            b.innerHTML += "<input type='hidden' value=\"" + arr[i] + "\">";
            b.addEventListener("click", function(e) {
                inp.value = this.getElementsByTagName("input")[0].value;              
                closeAllLists();
                submitNewClade();
            });
            a.appendChild(b);
          } else {
              var theindex = arr[i].indexOf(val)
              if ( theindex != -1) {
                  b = document.createElement("DIV");
                  b.innerHTML = arr[i].substr(0, theindex);
                  b.innerHTML += "<strong>" + arr[i].substr(theindex, val.length) + "</strong>";
                  b.innerHTML += arr[i].substr(theindex + val.length);
                  b.innerHTML += "<input type='hidden' value=\"" + arr[i] + "\">";
                  b.addEventListener("click", function(e) {
                      inp.value = this.getElementsByTagName("input")[0].value;              
                      closeAllLists();
                      submitNewClade();
                  });
                  a.appendChild(b);
              }
          }
      }
        }
    });
    inp.addEventListener("keydown", function(e) {
        var x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode == 40) {
          currentFocus++;
          addActive(x);
        } else if (e.keyCode == 38) { //up
          currentFocus--;
          addActive(x);
        } else if (e.keyCode == 13) {
          e.preventDefault();
          if (currentFocus > -1) {
            if (x) x[currentFocus].click();
          }
        }
    });
    function addActive(x) {
      if (!x) return false;
      removeActive(x);
      if (currentFocus >= x.length) currentFocus = 0;
      if (currentFocus < 0) currentFocus = (x.length - 1);
      x[currentFocus].classList.add("autocomplete-active");
    }
    function removeActive(x) {
      for (var i = 0; i < x.length; i++) {
        x[i].classList.remove("autocomplete-active");
      }
    }
    function closeAllLists(elmnt) {
      var x = document.getElementsByClassName("autocomplete-items");
      for (var i = 0; i < x.length; i++) {
        if (elmnt != x[i] && elmnt != inp) {
          x[i].parentNode.removeChild(x[i]);
        }
      }
    }
    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
        });
  }

function compare_mtdna_entry( a, b )
{
if ( a.length < b.length){
  return -1;
}
if ( a.length > b.length){
  return 1;
}
return 0;
}

function loadSNPMap() {
    $.ajax({
        type:    "GET",
        async: false,
        url:        autocompletionFile,
        success: function(text) {
          //parsePrecomputed(text.split("\r\n"))
          entries = text.split(",")
          entries.sort(compare_mtdna_entry)
          splitHGfromSNPentries()
          getHGs()
          autocomplete(document.getElementById("newlookup"), entries, hgEntries);
          if (url_param_hg && hgMap.hasOwnProperty(url_param_hg)) {
            document.getElementById('newlookup').value = hgMap[url_param_hg] + "->" + url_param_hg
	    layerStates['livingDead']='living'
		  updateMapRadiusChanged()
            submitNewClade()
          }
        }
    })
}

var actualMax = 0

function divide(numerator, denominator) {
    var quotient = []
    for (const [key, value] of Object.entries(numerator)) {
        if (denominator.hasOwnProperty(key)) {
            var thisQ = numerator[key] / denominator[key]
            quotient[key] = thisQ
        }
    }
    var qMax = Math.min(getMaxOfSurface(quotient), 1)
    actualMax = qMax
    var hardMax = hardmaxFactor * qMax
    var rounded = getRounded(hardMax)
    if (qMax > 0) {
        addLegend(hardMax)
    }
    var filtered = []
    for (const [key, value] of Object.entries(quotient)) {
        var relFreq = value / hardMax
        if (relFreq > 1) {
            relFreq = 1
        }
        if (relFreq > 0.01) {
            filtered[key] = relFreq
        }
    }
    return filtered
}

function getRounded(hardMax) {
    var hardMaxPct = hardMax * 100
    var rounded = Math.round(hardMaxPct)
    if (hardMaxPct < 4) {
        var places = Math.floor(Math.log10(4) - Math.log10(hardMaxPct)) + 1
        rounded = Math.round(hardMaxPct * Math.pow(10,places)) / Math.pow(10,places)
    }
    return rounded
}

function getMaxOfSurface(surface) {
    var max = 0
    for (const [key, value] of Object.entries(surface)) {
        if (value > max) {
            max = value
        }

    }
    return max
}

var kilometersPerDegree = 111.3

function getDist(x1, y1, x2, y2) {
    return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2))
}

function getHeat(x1, y1, x2, y2, radius, cosLat) {
    var dist = getDist(x1 * cosLat, y1, x2 * cosLat, y2)
    if (dist < radius) {
        return (radius - dist) / radius
    } else {
        return 0
    }
}

function getInsideCircleIndicesAndHeat(radius, y) {
    var squares = []
    var radiusInDegrees = radius / kilometersPerDegree
    var r2d2 = radiusInDegrees * radiusInDegrees
    var ridcaod = radiusInDegrees * cellsAlongOneDegree
    var rowz = Math.floor(ridcaod * 2)
    if (rowz % 2 == 0) {
        rowz++;
    }
    var rcenter = (rowz - 1) / 2
    var cosLat = Math.cos(y * Math.PI / 180)
    var colz = Math.floor(ridcaod * 2 / cosLat)
    if (colz % 2 == 0) {
        colz++;
    }
    var ccenter = (colz - 1) / 2

    for (var i = 0; i < rowz; i++) {
        for (var j = 0; j < colz; j++) {
            var heat = getHeat(ccenter,rcenter, j, i, ridcaod, cosLat) / r2d2
            if (heat > 0) {
                squares.push([i-rcenter,j-ccenter,heat])
            }
        }
    }
    return squares
}

function inBounds(row,col) {
    return (row >= 0 && row < rows && col >= 0 && col < cols) 
}

function addToGradient(gradient, x, y, radius, intensity) {
    var indicesAndHeat = getInsideCircleIndicesAndHeat(radius, y)
    var centerGridCell = getGridSquare(y, x)
    for (var i = 0; i < indicesAndHeat.length; i++) {
        thisRow = indicesAndHeat[i][0] + centerGridCell[0]
        thisCol = indicesAndHeat[i][1] + centerGridCell[1]
        if (inBounds(thisRow, thisCol)) {
            var gridkey = thisRow + "," + thisCol
            if (gradient.hasOwnProperty(gridkey)) {
                gradient[gridkey] += indicesAndHeat[i][2] * intensity
            } else {
                gradient[gridkey] = indicesAndHeat[i][2] * intensity
            }
        }
    }    
}

var signal = []
function getQuotientMapFromSignals(signals) {
    signal = []
    for (var i = 0; i < signals.length; i++) {
        addToGradient(signal, signals[i]["x"], signals[i]["y"], signals[i]["r"], signals[i]["i"])
    }
    quotient = divide(signal, thedenom)
    return quotient
}

function setIconActive(id) {
    if (document.getElementById(id)) {
        document.getElementById(id).style.border = '5px solid #555555'
    }
}
function setIconInactive(id) {
    if (document.getElementById(id)) {
        document.getElementById(id).style.border = ''
    }
}

function loadWaterGrid() {
    $.ajax({
        type:    "GET",
        async: false,
        url: dataRootURL + "watergrid.txt",
        success: function(text) {
          //parsePrecomputed(text.split("\r\n"))
          parseWatergrid(text.split("\r\n"))
        }}          
      )
  }
  
var waterGrid = []

function parseWatergrid(lines) {
    for (var i = 0; i < lines.length; i++) {
        waterGrid[i] = []
        var thisLine = lines[i]
        for (var j = 0; j < thisLine.length; j++) {
            waterGrid[i][j] = thisLine[j]
        }        
    }
}

function updateMapRadiusChanged() {
    hardmaxFactor = (21 - parseInt(document.getElementById('hardmaxRange').value)) / 20
    var radius = getRadius()

    if (layerStates['livingDead'] == 'living') {
        loadPrecomputed(radius)
    } else {
        updateFrequencyMapForAncientInterval()
    }
    
    document.getElementById('radius').innerHTML = 'Radius: ' + radius + " km"
}

function updateMapMaxChangedCommon() {
    hardmaxFactor = (21 - parseInt(document.getElementById('hardmaxRange').value)) / 20

    if (layerStates['livingDead'] == 'living') {
        updateMapMaxChanged()
    } else {
        updateFrequencyMapForAncientInterval()
    }
    
}

function getUniqueMapInput(prm) {
    var pointRadiiKeys = Object.keys(prm)
    var uniqMapInput = []
    for (var i = 0; i < pointRadiiKeys.length; i++) {
        for (var j = 0; j < prm[pointRadiiKeys[i]]; j++) {
            var keysplit = pointRadiiKeys[i].split(",")
            uniqMapInput.push({lat: parseFloat(keysplit[0]),
                lng: parseFloat(keysplit[1]),
                clade:targetPointRadiiIdSubclades[pointRadiiKeys[i]][j]["clade"],
                id:targetPointRadiiIdSubclades[pointRadiiKeys[i]][j]["id"],
                count:1
            })
        }
        
    }
    return uniqMapInput
  }
  
  function oneCircle(cLat, cLon, points, radius, offset) {
    var ps = []
    for (var j = 0; j < points.length; j++) {
        var circLat = Math.cos(j * 2 * Math.PI / points.length) * offset * radius
        var circLng = Math.sin(j * 2 * Math.PI / points.length) * offset * radius
        ps.push({lat: cLat + circLat, lng: cLon + circLng, id:points[j]["id"], clade: points[j]["clade"]})
    }
    return ps
  }
  
  function getSlices(points) {
    var remainder = points.length;
    var ringCap = 10
    var slices = []
    var lastRingEndRange = 0
    while (remainder > 0) {
        var thisRing = Math.min(remainder, ringCap)
        slices.push({points: points.slice(lastRingEndRange,lastRingEndRange+thisRing), length: ringCap})
        remainder -= thisRing
        lastRingEndRange += ringCap
        ringCap += 10
    }
    return slices
  }
  
  function circleify(spotMap) {
    var spotKeys = Object.keys(spotMap)
    var circleified = []
    var offset = 0.01
    var centers = []
    for (var i = 0; i < spotKeys.length; i++) {
        var thisSpot = spotMap[spotKeys[i]]
        var length = thisSpot["points"].length
        if (length == 1) {
            circleified.push({lat: thisSpot["lat"], lng: thisSpot["lng"], id:thisSpot["points"][0]["id"], clade:thisSpot["points"][0]["clade"]})
        } else {
            var slices = getSlices(thisSpot["points"])
            for (var sl = 0; sl < slices.length; sl++) {
                var ps = oneCircle(thisSpot["lat"], thisSpot["lng"], slices[sl]["points"], slices[sl]["length"], offset)            
                for (var j = 0; j < ps.length; j++) {
                    circleified.push(ps[j])
                }
            }
            centers.push({lat: thisSpot["lat"], lng: thisSpot["lng"]})
            
            //for (var j = 0; j < length; j++) {
                //var circLat = Math.cos(j * 2 * Math.PI / length) * offset * length
                //var circLng = Math.sin(j * 2 * Math.PI / length) * offset * length
                //circleified.push({lat: thisSpot["lat"] + circLat, lng: thisSpot["lng"] + circLng, id:thisSpot["points"][j]["id"], clade: thisSpot["points"][j]["clade"]})
  
            //}
        }
    }
    //return [circleified, centers]
    return {circles:circleified, centers: centers}
  }

function getCladeFinderCompleteURL(subclade) {
    return cladeFinderURL + '?snps=' +  subclade + '--'
}
