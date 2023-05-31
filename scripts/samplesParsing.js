var targetPointRadiiMap = []
var noAncientsTargetPointRadiiMap = []
var targetPointRadiiIdSubclades = []


function loadKitsBelowSubclade(projectName, subclade) {
  targetPointRadiiMap = []
  targetPointRadiiIdSubclades = []
  noAncientsTargetPointRadiiMap = []

  $.ajax({
    type:    "GET",
    async: false,
    url:     getProjectBaseDir(projectName) + projectName + "-samples.txt",
    success: function(text) {
      parseKitsBelowSubclade(projectName, subclade, text.split("\r\n"))
    }
  })
}

var hgToCountriesRaw = {}
var hgToPositions = {}
var hgToPositionsAncient

function isAncient(theid) {
  return ancientIds.indexOf(theid) != -1
}

function parseKitsBelowSubclade(projectName, subclade, lines) {
  hgToCountriesRaw = {}
  hgToPositions = {}
  var downstr = getDownstream(subclade)
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].split(",")
    var hg = line[0]
    var isDownstreamTargetClade = false
    if (downstr.indexOf(hg) != -1) {
      isDownstreamTargetClade = true
    }

    if (line.length == 2) {

    
      var samples = line[1].split(":")
      hgToCountriesRaw[hg] = []
      hgToPositions[hg] = []
      for (var j = 0; j < samples.length; j++){
          sampleSplit = samples[j].split(" ")
          var lat = parseFloat(sampleSplit[1])
          var lng = parseFloat(sampleSplit[2])
          var id = sampleSplit[0]
 
          var radius = parseFloat(sampleSplit[3])
          var country = sampleSplit[4]

          if (isDownstreamTargetClade) {
            hgToPositions[hg].push([lat,lng,country,id])

            if (!isAncient(id)) {
              hgToCountriesRaw[hg].push(country)
            }
            
            var prKey = lat + "," + lng + "," + radius
            if (isNaN(lat)) {
                nans.push(projectName + " " + id)
            }

            if (targetPointRadiiMap.hasOwnProperty(prKey)) {
                targetPointRadiiMap[prKey]++
            } else {
                targetPointRadiiMap[prKey] = 1                  
            }
            if (!isAncient(id)) {
              if (noAncientsTargetPointRadiiMap.hasOwnProperty(prKey)) {
                  noAncientsTargetPointRadiiMap[prKey]++
                } else {
                  noAncientsTargetPointRadiiMap[prKey] = 1                  
                }
            }
                 
            if (targetPointRadiiIdSubclades.hasOwnProperty(prKey)) {
                targetPointRadiiIdSubclades[prKey].push({"clade":hg,"id":id})//goes to surface computation
            } else {
                targetPointRadiiIdSubclades[prKey] = [{"clade":hg,"id":id}]
            }
                 
          
          }
          
          
      }
    }
  }
}

var ancient = {}
var ancientLoaded = false
function loadAncient(ancientFilename) {
  $.ajax({
    type:    "GET",
    async: false,
    url:     ancientFilename,
    success: function(text) {
      parseAncient(text.split("\r\n"))
      ancientLoaded = true
    }
  })
}

function parseAncient(lines) {
  
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].split(",")
    var theid = line[0]
    var thehg = line[1]
    var lat =  parseFloat(line[2])
    var lng = parseFloat(line[3])
    var therad = parseFloat(line[4])
    var ybp = parseInt(line[5])
    var thecountry = line[6]
    if (theid != "") {
      ancient[theid] = {"clade": thehg, "lat": lat, "lng": lng, "ybp": ybp, "radius": therad, "country": thecountry}
    }
  }
}
