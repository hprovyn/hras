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
          /*var marker = L.marker([circleified[i]["lat"], circleified[i]["lng"]], {icon:mapIcon, title:circleified[i]["id"]}).bindPopup(getPopup(circleified[i]),{
  maxWidth: 560
})
          points.push(marker)
          markers[circleified[i]["id"]] = marker;*/
          circ[circleified[i]["id"]] = circleified[i];
      }
      
      //pointLayer = L.layerGroup(points);
      
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

    /*var intenzDelta = newIntenz - intenz
    if (intenzDelta > 0) {
        for (var i = 0; i < intenzDelta; i++) {
            decrease()
        }
    } else {
        for (var i = 0; i < intenzDelta * -1; i++) {
            increase()
        }
    }
    intenz = newIntenz
    */
    adjustMax()
    addLegend()  

  }



  var maxFactor = 0
  var maxBase = 1.2
  function increase() {
      if (Math.pow(maxBase, maxFactor + 1) * actualMax < 1) {
          maxFactor = maxFactor + 1
          adjustMax()
      }
  }
  function decrease() {
      maxFactor = maxFactor - 1
      adjustMax()
  }
  
  function adjustMax() {
      lmap.removeLayer(heatmapLayer)
      var testData = {
          max: max * hardmaxFactor, //* Math.pow(maxBase, maxFactor),
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

  //btw this is buggy
  var intenz = 3
