
function instantiateDummyAll(max) {
    var all = {}
    for (var i = 0; i < rows; i++) {
        for (var j = 0; j < cols; j++) {
            all["" + i + "," + j] = max
        }        
    }
    return all
}



var thedenom = []

function expor7() {
    var thelines = []
    for (var i = 0; i < rows; i++) {
        var thisRow = []
        for (var j = 0; j < cols; j++) {
            var thekey = i + "," + j
            if (thedenom.hasOwnProperty(thekey)) {
                thisRow.push(Math.floor(thedenom[thekey] * 100) / 100)
            } else {
                thisRow.push(0)
            }
        }
        thelines.push(thisRow.join(" "))
    }
    
    document.getElementById('denom').innerHTML = thelines.join("<br>")
}

function convertToUnderscoreVar(line) {
    var converted = ""
    var lastZeroesBegin = null
    var col = -1
    for (var i = 0; i < line.length; i++) {
        if (line[i] == "_") {
            if (lastZeroesBegin == null) {
                lastZeroesBegin = col + 1
            }            
        } else {
            if (lastZeroesBegin != null) {
                converted += "_" + translateToBaseUnscaled(col + 1 - lastZeroesBegin)                
                lastZeroesBegin = null
            }
            converted += line[i] + line[i+1] + line[i+2]
            i += 2
        }
        col++
    }
    if (lastZeroesBegin != null) {
        converted += "_" + translateToBaseUnscaled(cols - lastZeroesBegin)                
    }
    return converted
}

var totalDiffs = []
function expor8() {
    var thelines = []
    thelines.push(getMaxOfSurface(thedenom))
    for (var i = 0; i < rows; i++) {
        var thisRow = []
        for (var j = 0; j < cols; j++) {
            var thekey = i + "," + j
            if (thedenom.hasOwnProperty(thekey) && thedenom[thekey] >= maxOverBase3 && waterGrid[i][j] != "0") {
                thisRow.push(translateToBase(thedenom[thekey]))
            } else {
                thisRow.push('_')
            }
        }
        thelines.push(convertToUnderscoreVar(thisRow.join("")))
    }
    document.getElementById('denom').innerHTML = thelines.join("<br>")
}


function getQuotientMap(signals, all) {
    var signal = []
    var denom = []
    for (var i = 0; i < signals.length; i++) {
        addToGradient(signal, signals[i]["x"], signals[i]["y"], signals[i]["r"], signals[i]["i"])
    }
    //denom = instantiateDummyAll(getMaxOfSurface(signal))
    for (var i = 0; i < all.length; i++) {
        addToGradient(denom, all[i]["x"], all[i]["y"], all[i]["r"], all[i]["i"])
    }
    thedenom = denom
    var quotient = divide(signal, denom)
    return quotient
}


function createSVGrect(block, row, bucketRows) {
    return '<rect x="' + block["colStart"] / cols * 100 + '%" y="' + (bucketRows - row % bucketRows - 1) / bucketRows * 100 + '%" width="'+ (block["colEnd"] - block["colStart"] + 1)/cols *100+'%" height="'+ 1 / bucketRows *100 + '%" fill="' + block["fillColor"] + '" fill-opacity="' + (.05 + block["value"] * .70) + '"/>'
}

function getHue(value) {
    var hueSpan = 180 + 40
    excessOfLeftBand = value - 180 / hueSpan
    if (excessOfLeftBand > 0) {
        return 1 - excessOfLeftBand * 220 / 360
    } else {        
        return (1-11/9*value) * 180 / 360
    }
}

var svgOverlays = []

var hues = 10

function addToMap(surface) {
    removeSVGs()
    var precomputedHues = []
    var precomputedHexes = []
    for (var i = 0; i < hues + 1; i++) {
        precomputedHues[i / hues] = getHue(i/hues)
        precomputedHexes[i / hues] = rgbToHex(HSVtoRGB(precomputedHues[i / hues],1,1))
    }


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

    for (const [key, value] of Object.entries(surface)) {
        var strsplit = key.split(",")
        var row = parseInt(strsplit[0])
        var col = parseInt(strsplit[1])
        if (!rowColMap.hasOwnProperty(row)) {
            rowColMap[row] = []
        }
        rowColMap[row][col] = value        
    }
    var rowKeys = Object.keys(rowColMap).sort()
    for (var i = 0; i < rowKeys.length; i++) {
        var row = rowKeys[i]
        var thisRowBucket = Math.floor(row / bucketRows)
        var colKeys = Object.keys(rowColMap[row]).sort()
        var thisBlock = null
        for (var j = 0; j < colKeys.length; j++) {
            var col = colKeys[j]
            var thisTruncVal = Math.floor(rowColMap[row][col] * hues) / hues

            if (thisBlock) {
                if (thisBlock["colEnd"] == col - 1 && thisBlock["value"] == thisTruncVal) {
                    thisBlock["colEnd"] = col
                } else {
                    rects[thisRowBucket] += createSVGrect(thisBlock, row, bucketRows)
                    //var hue = precomputedHues[thisTruncVal]
                    //var fillColor = rgbToHex(HSVtoRGB(hue,1,1))
                    var fillColor = precomputedHexes[thisTruncVal]
                    thisBlock = {"colStart": col, "colEnd": col, "fillColor": fillColor, "value":thisTruncVal}
                }
            } else {
                //var hue = precomputedHues[thisTruncVal]
                //var fillColor = rgbToHex(HSVtoRGB(hue,1,1))
                var fillColor = precomputedHexes[thisTruncVal]
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

function removeSVGs() {
    for (var i = 0; i < svgOverlays.length; i++) {
        lmap.removeLayer(svgOverlays[i])
    }
    svgOverlays = []
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }
  
  function rgbToHex(rgb) {
    return "#" + componentToHex(rgb["r"]) + componentToHex(rgb["g"]) + componentToHex(rgb["b"]);
  }

  function darken(rgb, percent) {
      r = Math.floor(rgb["r"] * percent)
      g = Math.floor(rgb["g"] * percent)
      b = Math.floor(rgb["b"] * percent)
      return rgbToHex(r,g,b)
  }
  
  function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}



var pointRadiiMap = {}

var nans = []

function loadKits(projectName) {
    
  
    $.ajax({
      type:    "GET",
      async: false,
      url:     getProjectBaseDir(projectName) + projectName + "-samples.txt",
      success: function(text) {
        parseKits(projectName, text.split("\r\n"))
      }
    })
  }
  
  function parseKits(projectName, lines) {
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].split(",")
      var hg = line[0]
      var samples = line[1].split(":")
      for (var j = 0; j < samples.length; j++){
          sampleSplit = samples[j].split(" ")
          var lat = parseFloat(sampleSplit[1])
          var lng = parseFloat(sampleSplit[2])
          var id = sampleSplit[0]
          if (ancientIds.indexOf(id) == -1) {
            var radius = parseFloat(sampleSplit[3])
            var prKey = lat + "," + lng + "," + radius
            if (isNaN(lat)) {
                nans.push(projectName + " " + id)
            }
            if (pointRadiiMap.hasOwnProperty(prKey)) {
                pointRadiiMap[prKey]++
            } else {
                pointRadiiMap[prKey] = 1
            }
          }
      }
    }
  }

  function loadAllSamples() {
    for (var i = 0; i < allProjects.length; i++) {
        var project = allProjects[i]
        loadKits(project)
    }
}

function loadPrecomputed(radius) {
  $.ajax({
      type:    "GET",
      async: false,
      url:        getDenomURLbyRadius(radius) ,
      success: function(text) {
        //parsePrecomputed(text.split("\r\n"))
        parseCompressed2(text.split("\r\n"))
        var qMapInput = Object.keys(noAncientsTargetPointRadiiMap).map(function(k) {
          var split = k.split(",")
          return {y:parseFloat(split[0]), x:parseFloat(split[1]), r: getR(parseFloat(split[2])) * radius, i:noAncientsTargetPointRadiiMap[k]}
      })
        var q = getQuotientMapFromSignals(qMapInput)
        addToMap(q)
      }
    })
}

function loadTargetAndAddToMap() {
  var radius = getRadius()
  var qMapInput = Object.keys(noAncientsTargetPointRadiiMap).map(function(k) {
      var split = k.split(",")
      return {y:parseFloat(split[0]), x:parseFloat(split[1]), r: getR(parseFloat(split[2])) * radius, i:noAncientsTargetPointRadiiMap[k]}
  })
  var q = getQuotientMapFromSignals(qMapInput)
  addToMap(q)
  addMarkers()
}

function parsePrecomputed(lines) {
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].split(" ")
    for (var j = 0; j < line.length; j++) {
        if (line[j] != "0") {
            thedenom[i + "," + j] = parseFloat(line[j]) + 0.01
        }
    }
  }
}


function qMap(radius) {
  var qMapInput = points.map(function(p) {return {y: p[1], x: p[2], r: getR(p[4]) * radius, i:1}})
  var qMapDenom = Object.keys(pointRadiiMap).map(function(k) {
      var split = k.split(",")
      return {y:parseFloat(split[0]), x:parseFloat(split[1]), r: getR(parseFloat(split[2])) * radius, i:pointRadiiMap[k]}
  })

  var q = getQuotientMap(qMapInput, qMapDenom)
  addToMap(q)
}

var hardmaxFactor = .5
function updateMapMaxChanged() {
  var q = divide(signal, thedenom)
  addToMap(q)
}



function addLegend(hardMax) {
  const svg1 = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  // set width and height
  svg1.setAttribute("width", "60");
  svg1.setAttribute("height", "120");
  var colors = 10
  // create a circle
  
  for (var i = 0; i < colors + 1; i++) {
      var hue = getHue(i / colors)
      var cir1 = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "rect",
        );
      cir1.setAttribute("x", "0");
      cir1.setAttribute("y", "" + 100 - 10 * i);
      cir1.setAttribute("width", "10");
      cir1.setAttribute("height", "10");
      cir1.setAttribute("fill", rgbToHex(HSVtoRGB(hue,1,1)));
      cir1.setAttribute("fill-opacity", "" + (.05 + i / colors * .70))
      svg1.appendChild(cir1);
  }
  for (var i = 0; i < colors; i++) {
      var cir1 = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line",
        );
      cir1.setAttribute("x1", "10");
      cir1.setAttribute("y1", "" + (10 * i + 10));
      cir1.setAttribute("x2", "7");
      cir1.setAttribute("y2", "" + (10 * i + 10));
      cir1.setAttribute("stroke", "black");
      svg1.appendChild(cir1);
  }
  var line = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line",
    );
  line.setAttribute("x1", "10");
  line.setAttribute("y1", "0");
  line.setAttribute("x2", "10");
  line.setAttribute("y2", "110");
  line.setAttribute("stroke", "black");
  svg1.appendChild(line);
  for (var i = 1; i < colors + 1; i++) {
      var txt = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "text",
        );
      txt.setAttribute("x", "15");
      txt.setAttribute("y", "" + 100 - 10 * i + 14);
      var textNode = document.createTextNode("" + getRounded(hardMax * i / colors) + "%");
      txt.setAttribute("font-size","smaller")
      txt.appendChild(textNode);
      svg1.appendChild(txt);
  }

  
  // attach it to the container


  // attach container to document
  document.getElementById("legend").innerHTML = "Relative Frequency<br>"
  document.getElementById("legend").appendChild(svg1);
}

function processExport(radius) {
  thedenom = []
  qMap(radius)
  var max = getMaxOfSurface(radius)
  recalibrateMax(max)
  expor8()
}

function addMarkers() {
  if (pointLayer) {
      pointLayer.removeFrom(lmap)
  }
  var uniqMapInput = getUniqueMapInput(targetPointRadiiMap)
  var uniqMap = getUniqueMap(uniqMapInput)

  var circleifiedOutput = circleify(uniqMap)
  var circleified = circleifiedOutput["circles"]
  var centers = circleifiedOutput["centers"]
  //var circleified =  circleify(uniqMap)
  var points = []
  for (var i = 0; i < circleified.length; i++) {
      var marker = createMarker(circleified[i])
      points.push(marker)
      markers[circleified[i]["id"]] = marker;
      circ[circleified[i]["id"]] = circleified[i];
  }
  starIcon = L.icon({
      iconUrl: 'images/star2.png',
      iconSize:     [64, 44], // size of the icon
  iconAnchor:   [32, 44], // point of the icon which will correspond to marker's location
  popupAnchor:  [0, -54] // point from which the popup should open relative to the iconAnchor
  
   })
  for (var i = 0; i < centers.length; i++) {
      var marker = L.marker([centers[i]["lat"], centers[i]["lng"]], {icon:starIcon})
      points.push(marker)
  }
  
  pointLayer = L.layerGroup(points);
}

function addHeatmapIconsToDiv(dnaType, hg) {
    document.getElementById('heatmapicons').innerHTML = getHeatmapIcons(hg, 'Alpha', dnaType)
}

function createMarker(circlifiedDatum,color) {


    return L.marker([circlifiedDatum["lat"], circlifiedDatum["lng"]], {icon:getYSEQIconNoOffset(color, circlifiedDatum["id"]), title:circlifiedDatum["id"]})
    .bindPopup('<iframe class="resized" src="' + getCladeFinderCompleteURL(circlifiedDatum["clade"]) + '" width="560" height="315"></iframe>', {
        maxWidth: 560
        })
}
