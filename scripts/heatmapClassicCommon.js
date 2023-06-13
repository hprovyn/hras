function getMax(arr) {
    return Math.max.apply(Math, arr.map(function(o) { return o["weight"]; }))
}

function getPercentile(arr, perc) {
    var sorted = arr.map(function(o) { return o["weight"]; })
    sorted.sort(function (a,b) {
    return a - b; // Ascending
});
    return sorted[Math.floor(arr.length * perc)]
}

function addHeatMapClassic(input) {
    if (heatmapLayer) {
        lmap.removeLayer(heatmapLayer)
    }

    var inputNoAncient = input.filter(i => isAncient(i.id) == false)

    var testData = {
        data: inputNoAncient
      };

      
      
      
      var points = [];
      var uniqMapNoAncient = getUniqueMap(inputNoAncient)
      max = getPercentile(Object.values(uniqMapNoAncient),.9999)
      testData["max"] = max * hardmaxFactor
      if (mapType == 'diversity') {
        testData.max = testData.max * hardmaxFactor
     }
      updateScalePercentages(testData["max"])

      var uniqMap = getUniqueMap(input)
      var circleifiedOutput = circleify(uniqMap)
      var circleified = circleifiedOutput["circles"]
      var centers = circleifiedOutput["centers"]
      for (var i = 0; i < circleified.length; i++) {
          circ[circleified[i]["id"]] = circleified[i];
      }
      
      heatmapLayer = new HeatmapOverlay(cfg);
      heatmapLayer.addTo(lmap);
      
      heatmapLayer.setData(testData);
      if (input.length > 0) {
          addLegend()
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
          loadTargetAndAddToMap()
        }
      })
  }

  function updateMapMaxChanged() {
    var newIntenz = document.getElementById('hardmaxRange').value
    hardmaxFactor = (21 - parseInt(document.getElementById('hardmaxRange').value)) / 20

    adjustMax()
    addLegend()  

  }

  function adjustMax() {
      lmap.removeLayer(heatmapLayer)
      var testData = {
          max: max * hardmaxFactor,
          data: heatmapInput
      }      
      if (mapType == 'diversity') {
        testData.max = testData.max * hardmaxFactor
      }
      updateScalePercentages(testData.max)
  
      heatmapLayer = new HeatmapOverlay(cfg);
      heatmapLayer.addTo(lmap);
  
      heatmapLayer.setData(testData);
  }

function getHeatmapConfig(minOpacity, maxOpacity, gradient) {
    return {
        "radius": 6,
        "maxOpacity": maxOpacity,
        "minOpacity": minOpacity,
        "blur": 1,
        "scaleRadius": true,
        "gradient": gradient,
        "useLocalExtrema": false,
        latField: 'lat',
        lngField: 'lng',
        valueField: 'count'
      };
}


function addLegend() {
    var text = document.getElementById('legend')
    text.innerHTML = legendTitle + '<br><div style="width:100%"><div style="width:10%;float:left"><img src="' + imagesDir + legendImage + '" height="12%"></div><div style="margin-left:10%;font-size:10">' + scalePercentages[5] + '<br>' + scalePercentages[4] + '<br>' + scalePercentages[3] + '<br>' + scalePercentages[2] + '<br>' + scalePercentages[1] + '<br>' + scalePercentages[0] + '</div></div>'
}
