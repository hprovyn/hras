function updateScalePercentages(newMax) {
    var bands = Object.keys(cfg.gradient).map(Number).sort().splice(1,6)
    for (var i = 0; i < bands.length; i++) {
        
        var raw = bands[i] * newMax / max * actualMax * 100
        if (raw > 100) {
            raw = 100
        }
        var rounded = Math.round(raw)
        if (raw < 4) {
            var places = Math.floor(Math.log10(4) - Math.log10(raw)) + 1
            rounded = Math.round(raw * Math.pow(10,places)) / Math.pow(10,places)
        }
        var addPlus = ""
        if (rounded != 100 && i == bands.length - 1) {
            addPlus = " and over"
        }
        scalePercentages[i] = rounded + "%" + addPlus
    }
}

function createMarker(circlifiedDatum,color) {
    return L.marker([circlifiedDatum["lat"], circlifiedDatum["lng"]], {icon:getYSEQIconNoOffset(color, circlifiedDatum["id"]), title:circlifiedDatum["id"]})
    .bindPopup('<iframe class="resized" src="' + getCladeFinderCompleteURL(circlifiedDatum["clade"]) + '" width="560" height="315"></iframe>', {
        maxWidth: 560
        })
}


function getPopup(datum) {
    return '<iframe class="resized" src="https://cladefinder.yseq.net/interactive_tree.php?snps=' +  datum["clade"].substring(datum["clade"].indexOf("-") + 1, datum["clade"].length) + '%2B" width="560" height="315"></iframe>'
}

var maxOpacity = 0.7;
var minOpacity = 0.12;
var gradient = {'0':'white',
        '.2': 'blue',
        '.4': 'green',
        '.55': 'yellow',
        '.7': 'orange',
        '.85': 'red',
        '1': 'magenta'}
        
var cfg = getHeatmapConfig(minOpacity, maxOpacity, gradient)


var baseRadius = 3// / 400 * 229;
var scalePercentages = []
var scalePercentageFactor = 0.1745 * 3.7

var heatmapInput = {}
function loadTargetAndAddToMap() {
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
            var theweight = 1

            heatmapInput.push({id:id,lat:lat, lng:lng, radius: ther * baseRadius * radius / 400, count: theweight / thedenomweight / ther / ther,clade:clade})
        }
    })

/*
    heatmapInput = Object.keys(targetPointRadiiMap).map(function(k) {
        var split = k.split(",")
        var lat = parseFloat(split[0])
        var lng = parseFloat(split[1])
        var thegridsq = getGridSquare(lat, lng)
        var thedenomweight = thedenom[thegridsq[0]+","+thegridsq[1]]
        var ther = getR(parseFloat(split[2]))
        
        return {id:"",lat:lat, lng:lng, radius: ther * baseRadius * radius / 400, count:targetPointRadiiMap[k] / thedenomweight / ther / ther,clade:""}
    })*/
    getAlphaComputedMax(radius)
    addHeatMapClassic(heatmapInput)    
    //addMarkers()
  }

var legendTitle = 'Relative Frequency'
var legendImage = 'classic_heatmap_legend.png'

function getAlphaComputedMax(radius) {
    var qMapInput = Object.keys(targetPointRadiiMap).map(function(k) {
        var split = k.split(",")
        return {y:parseFloat(split[0]), x:parseFloat(split[1]), r: getR(parseFloat(split[2])) * radius, i:targetPointRadiiMap[k]}
    })
    var q = getQuotientMapFromSignals(qMapInput)
    return actualMax
}
