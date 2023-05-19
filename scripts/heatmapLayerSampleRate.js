var countryCoords = {}

var countryCoordsAndCountsLoaded = false
var countryInHg = {}
var countryTotals = {}
var countryMaxSqrt = 0

function loadCountryCoordsAndCounts() {
    countryCoordsAndCountsLoaded = true
$.ajax({
   type:    "GET",
   url:     dataRootURL + "iso3166-country.tsv",
   success: function(text) {
    countryCoords = parseCountryCoords(text.split("\r\n"));
    //addMap(data)
   },
   error: function() {
       // An error occurred
       countryCoordsAndCountsLoaded = false
       alert("error loading country coordinates file");
   }});

$.ajax({
    type:    "GET",
    url:     dataRootURL + dnaType+"_regionCounts.csv",
    success: function(text) {
        countryTotals = parseRegionCounts(text.split("\r\n"));
        countryMaxSqrt = Math.sqrt(Math.max(...Object.values(countryTotals)))
     //addMap(data)
    },
    error: function() {
        // An error occurred
        countryCoordsAndCountsLoaded = false
        alert("error loading country sampling file");
    }});
}

function parseCountryCoords(text) {
    var thedata = []
    for (var i = 1; i < text.length; i++) {
        var rowsplit = text[i].split("\t")
        thedata[rowsplit[0]] = {"lat": parseFloat(rowsplit[2]), "lng": parseFloat(rowsplit[3]), "name": rowsplit[1]}
    }
    return thedata
} 

function parseRegionCounts(text) {
    var thedata = []
    for (var i = 1; i < text.length; i++) {
        var rowsplit = text[i].split(",")
        if (rowsplit[0] != "") {
            thedata[rowsplit[0]] = parseInt(rowsplit[1])
        }
        
    }
    return thedata
} 

var popupcolors = ['yellow','green','blue','orange','red','purple','black']
var wedgecolors = ['black','white']
var popupopacities = [1,1,1,1,1,1,1] //[0.5,0.5,0.5,0.5,0.5,0.5,0.5]
var wedgeopacities = [.7,0]

function normalizeTo100(data) {
    var sum = data.reduce(function (a, b) {return a + b;}, 0)
    var normalized = []
    for (var i = 0; i < data.length; i++) {
        normalized[i] = data[i] / sum * 100
    }
    return normalized
}

function getSVG(data, theclass, colors,opacities,rotation,labels, counts) {
    var thehtml = '<svg viewBox="0 0 64 64" class="'+theclass+'" fill="none">'
    var total = 0
    var transform = ""
    var dashArrayCorrectionFactor = 1.003
    if (rotation != 0) {
        transform = getTransform(rotation)
        rotation = rotation / 360 * 100
    }
    thehtml += '<circle r="25%" cx="50%" cy="50%" style="stroke-dasharray: '+ (data[0]*dashArrayCorrectionFactor)+' 100; stroke: '+colors[0]+'; stroke-opacity: '+opacities[0]+'" ' + transform + '"></circle>'

    if (labels) {
        var thex = (30+24*Math.cos((data[0]/2+rotation)*Math.PI/50))
        var they = (34.5+24*Math.sin((data[0]/2+rotation)*Math.PI/50))
        if (data.length == 1) {
            thex = 30
            they = 34
        }
        thehtml += '<text x="'+thex+'" y="'+they+'" class="pie-legend" fill="black">'+counts[0]+'</text>'
    }
    total += data[0]
    for (var i = 1; i < data.length; i++) {
    thehtml += '<circle r="25%" cx="50%" cy="50%" style="stroke-dasharray: ' + (data[i]*dashArrayCorrectionFactor)+' 100; stroke: '+colors[i]+'; stroke-opacity: '+opacities[i]+ '; stroke-dashoffset: '+ ((-1) * total*dashArrayCorrectionFactor)+'; animation-delay: '+i/(data.length-1)+'s" '+transform+'">  </circle>'
    if (labels) {
        thehtml += '<text x="'+(30+24*Math.cos((data[i]/2+total+rotation)*Math.PI/50))+'" y="'+(34.5+24*Math.sin((data[i]/2+total+rotation)*Math.PI/50))+'" class="pie-legend" fill="black">'+counts[i]+'</text>'
    }
    total += data[i]
    }
    if (labels) {
        thehtml += '<circle r="50%" cx="50%" cy="50%" stroke="black" style="stroke-width:0.25"></circle>'
    }
    return thehtml + "</svg>"
}

function getLegend(labels, colors) {
    var svg = '<svg viewBox="0 0 60 100" width="120" fill="none">'
    for (var i = 0; i < labels.length; i++) {
        svg += '<rect x="10" stroke="black" stroke-width=".25px" y="'+(10+i*10)+'" width="8" height="8" rx="3" opacity="0.5" fill="'+colors[i]+'"/>'
        if (labels[i].indexOf('others') == -1) {
            svg += '<a href="#" onclick="submitNewCladeByInteraction(\'' + labels[i].replace('*','') + '\');return false;"><text x="20" y="'+(16+i*10)+'" class="pie-legend" fill="black">'+labels[i]+'</text></a>'
        } else {
            svg += '<text x="20" y="'+(16+i*10)+'" class="pie-legend" fill="black">'+labels[i]+'</text>'
        }
        
    }
    return svg + '</svg>'
}

function reorderAndAddOtherCategory(counts, maxCategories) {
    var tosort = []
    var countKeys = Object.keys(counts)
    for (var i = 0; i < countKeys.length; i++) {
        tosort.push({"key":countKeys[i], "count": counts[countKeys[i]]})
    }
    tosort.sort((a,b) => b["count"]-a["count"]);
    
    if (tosort.length > maxCategories + 1) {
        var otherCatAdded = tosort.splice(0,maxCategories)
        var lumped = tosort.map(t => t['count']).reduce(function (a, b) {return a + b;}, 0)
        otherCatAdded.push({"key": tosort.length + ' others', "count": lumped})
        return otherCatAdded
    } else {
        return tosort
    }
}

function getSampleRatePopupHTML_SVG(hg, code, name, count, drillDownCounts, total) {
    var theprecision = (count/total * 100).toPrecision(2)
    if (count == total) {
        theprecision = '100'
    }
    var reordered = reorderAndAddOtherCategory(drillDownCounts, 6)
    
    var normalized = normalizeTo100(reordered.map(a => a['count']))
    var svg = getSVG(normalized,'pie',popupcolors,popupopacities,-90,true,reordered.map(a => a['count']))
    var labels = reordered.map(a => a['key'])
    return "<div style='text-align:center;font-size:medium'><b>" + hg +"&nbsp;in&nbsp;" + name + "</b><br>" + theprecision + "% = " + count + "&nbsp;/&nbsp;" + total + "&nbsp;samples<br>of which:<br>"+'<span class="mySpan">'+svg+getLegend(labels, popupcolors)+"</span></div>"
}

function getTransform(rotangle) {
    return 'transform="rotate('+rotangle+' 32 32)"';
}

function getRotateAngleToTopCenterWedge(percentage) {
    return -90 - percentage * 180
}

  function iconCircleWithText_SVG(hg, code, name, latLng, txt, circleOptions, count, drillDownCounts, total) {
    var pieradius = getPieRadius(total)
    var normalized = normalizeTo100([count, total - count])
    var icon = L.divIcon({
      html: getSVG(normalized,'wedge',wedgecolors, wedgeopacities,getRotateAngleToTopCenterWedge(count/total),false,null),//'transform="rotate(-90) translate(-64)"'),
      className: 'leaflet-pie-wedge',
      iconSize: [pieradius * 2, pieradius * 2]
    });
    var circle = L.marker(latLng, {
        icon: icon
    }).bindPopup(getSampleRatePopupHTML_SVG(hg, code, name, count, drillDownCounts, total), {
        maxWidth: 560,
        opacity: .5
        });

    return [circle]
  }
  
var circMinRadius = 25
var circMaxRadius = 100
function getPieRadius(count) {
    return circMinRadius + (circMaxRadius - circMinRadius) * Math.sqrt(count) / countryMaxSqrt
}
var piechartlayergroup = null

function createPieChartLayer() {
    var countryKeys = Object.keys(countryInHg)
    var piechartmarkers = []
    for (var i = 0; i < countryKeys.length;i++) {
        var code = countryKeys[i]
        if (!countryCoords.hasOwnProperty(code)) {
            //alert(code + " not found")
        }
        if (code != "" && countryTotals.hasOwnProperty(code)) {
            var drillDownCounts = drillDownUntilSplit(code, clade)
            var tosubtract = otfaSamples.filter(i => i.country==code).length
            piechartmarkers = piechartmarkers.concat(iconCircleWithText_SVG(clade, code, countryCoords[code]["name"], [countryCoords[code]["lat"], countryCoords[code]["lng"]],countryInHg[code] + "/" + countryTotals[code], {radius: getPieRadius(countryTotals[code]-tosubtract)}, countryInHg[code],drillDownCounts, countryTotals[code]-tosubtract))
        }
    }
    piechartlayergroup = L.layerGroup(piechartmarkers)
}

function addPieChartLayer() {
    //if (piechartlayergroup == null) {
        if (layerStates['livingDead']=='living') {
            convertRawHGCountriesToCounts()
            createPieChartLayer()
        } else {
            otfa_createPieChartLayer()
        }
    
    piechartlayergroup.addTo(lmap);
    layerStates['pie'] = true
    setIconActive('pie','pie')
    //set pie chart icon url to active
}

function pieChartCheckboxClicked(event) {

    if (piechartlayergroup != null && lmap.hasLayer(piechartlayergroup)) {
        deactivatePieChartLayer()
    } else {
        addPieChartLayer()
    }
    addUpdateCentroidsControls()
}

var tmrcaIncrement = null
function addPieChartCheckbox(clade, checked) {
    if (checked != "checked") {
        piechartlayergroup = null
    }

    tmrcaIncrement = 100
    if (tmrca[clade] < 2000) {
        tmrcaIncrement = 25
    }
    var thediv = document.getElementById('pieChartCheckboxDiv')

    thediv.innerHTML = getOptionalLayerIconsDiv(checked)
}

var optionalLayersConfig = {
    "fn": "optionalLayerClicked",
    "group": "optionalLayer",
    "width": '10%',
    "buttons": [
        {
            "title": "Samples",
            "id": "ampelmann",
            "icon": imagesDir + "YSEQ_man.png"
        },
        {
            "title": "Country Stats",
            "id": "pie",
            "icon": imagesDir + "pie.png"
        },
        {
            "title": "Migration from Haplogroup Root to Target Haplogroup",
            "id": "upstream",
            "icon": imagesDir + "upstream.png"
        },
        {
            "title": "Migration from Target Haplogroup to Children",
            "id": "downstream",
            "icon": imagesDir + "downstream.png"
        }
    ]
}

function getOptionalLayerIconsDiv(checked) {
    var thehtml = '<font size="+1">Layers&nbsp;</font>'
    thehtml += getButtonsRedesigned(optionalLayersConfig)
    thehtml += '<div id="centroidControlsDiv"></div'
    return thehtml
}

function optionalLayerClicked(layerType) {
    if (layerType == 'ampelmann') {
        samplesLayerCheckboxClicked()    
    }
    if (layerType == 'pie') {
        pieChartCheckboxClicked()
    }
    if (layerType == 'upstream') {
        migrationCheckboxClicked()
    }
    if (layerType == 'downstream') {
        centroidsCheckboxClicked()
    }
}

function samplesLayerCheckboxClicked(event) {

    if (layerStates['samples'] != true) {
        layerStates['samples'] = true
        updateTMRCAfilterChanged()
        setIconActive('ampelmann', 'ampelmann')
    } else {
        layerStates['samples'] = false
        hideAllRegardlessofTMRCA(tmrcaSamplesGroups)        
        if (layerStates['downstream'] == true) {
            hideAllRegardlessofTMRCA(tmrcaLinesToSamplesGroups)
        }
        setIconInactive('ampelmann', 'ampelmann')

    }   
    addUpdateCentroidsControls()
}

function deactivatePieChartLayer() {
    if (lmap.hasLayer(piechartlayergroup)) {
        lmap.removeLayer(piechartlayergroup)
    }
    piechartlayergroup = null
    setIconInactive('pie','pie')
    layerStates['pie'] = false
}

var hgsInCountryCount = {}

function convertRawHGCountriesToCounts() {
    countryInHg = {}
    hgsInCountryCount = {}
    hgCountryCodes = Object.keys(hgToCountriesRaw)
    for (var i = 0; i < hgCountryCodes.length; i++) {
        var thehg = hgCountryCodes[i]
        var thiscountrycounts = hgToCountriesRaw[thehg]
        for (var j = 0; j < thiscountrycounts.length; j++) {
            var code = thiscountrycounts[j]            
            if (countryInHg.hasOwnProperty(code)) {
                countryInHg[code]++
            } else {
                countryInHg[code] = 1
            }
            if (!hgsInCountryCount.hasOwnProperty(code)) {
                hgsInCountryCount[code] = {}
                hgsInCountryCount[code][thehg] = 1
            } else {
                if (!hgsInCountryCount[code].hasOwnProperty(thehg)) {
                    hgsInCountryCount[code][thehg] = 1
                } else {
                    hgsInCountryCount[code][thehg]++
                }
            }
        }
    }
}

function aggregateCountForSubclades(code, clades) {
    var count = 0
    var theseHgCounts = hgsInCountryCount[code]

    for (var i = 0; i < clades.length; i++) {
        var clade = clades[i]
        if (theseHgCounts.hasOwnProperty(clade)) {
            count += theseHgCounts[clade]
        }
    }
    return count
}

function getCountrySampleRateDrillDown(code, hg) {
    var counts = {}

    var basalCount = aggregateCountForSubclades(code, [hg])
    if (basalCount > 0)  {
        counts[hg + "*"] = basalCount
    }
    var children = getChildren(hg)
    for (var i = 0; i < children.length; i++) {
        var child = children[i]
        var downstrChild = getDownstream(child)
        var downstrChildCount = aggregateCountForSubclades(code, downstrChild)
        if (downstrChildCount > 0)  {
            counts[child] = downstrChildCount
        }

    }
    return counts
    //if (hgToCount)
}

function drillDownUntilSplit(code, hg) {
    var drilled = getCountrySampleRateDrillDown(code, hg)
    var drilledKeys = Object.keys(drilled)
    if (drilledKeys.length > 1) {
        return drilled
    }
    if (drilledKeys.length == 0) {
        return drilled
    }
    if (drilledKeys[0].indexOf("*") != -1) {
        return drilled
    }
    var children = getChildren(hg)
    if (children.length > 0) {
        drilled = {}
        for (var i = 0; i < children.length; i++) {
            drilled = {...drilled,
                    ...drillDownUntilSplit(code, children[i])}
        }
    }
    return drilled
}

var livingDeadConfig = {
    "fn": "livingDeadControlClicked",
    "group": "livingDead",
    "width": '10%',
    "buttons": [
        {
            "title": "Living",
            "id": "modern",
            "icon": imagesDir + "heart.png"
        },
        {
            "title": "Ancient",
            "id": "ancient",
            "icon": imagesDir + "skull.png"
        }
    ]
}

function addLivingDeadControl() {
    var thediv = document.getElementById('livingDeadControlDiv')
    thediv.innerHTML = getButtonsRedesigned(livingDeadConfig)
   layerStates['livingDead'] = 'living'
   setIconActive('modern', 'heart')
}

function livingDeadControlClicked() {
    if (layerStates['livingDead'] == "living" ) {
        setIconActive('ancient', 'skull')
        setIconInactive('modern', 'heart')
        layerStates['livingDead'] = 'ancient'
        addOnTheFlyAncientSlider()
        updateFrequencyMapForAncientInterval()
        //load current hg as ancient
    } else {
        setIconInactive('ancient', 'skull')
        setIconActive('modern', 'heart')
        layerStates['livingDead'] = 'living'
        hideOnTheFlyAncientSlider()
        loadPrecomputed(getRadius())
        //load current hg as modern
    }
    if (layerStates['pie']) {
        lmap.removeLayer(piechartlayergroup)
        addPieChartLayer()
    }
}

var diversificationByTMRCA = {}

function getDiversificationByTMRCAcounts() {
    diversificationByTMRCA = {}
    var downstream = getDownstream(clade)
    downstream.splice(0,1)
    for (var i = 0; i < downstream.length; i++) {
        var subc = downstream[i]
        if (childParents.hasOwnProperty(subc)) {
            var thetmrca = tmrca[childParents[subc]]
            if (diversificationByTMRCA.hasOwnProperty(thetmrca)) {
                diversificationByTMRCA[thetmrca]++
            } else {
                diversificationByTMRCA[thetmrca] = 1
            }
        }
    }
}

function getCountInRange(start, end) {
    var diversificationKeys = Object.keys(diversificationByTMRCA)
    var sum = 0
    for (var i = 0; i < diversificationKeys.length; i++) {
        var thetmrca = diversificationKeys[i]
        if (thetmrca >= end && thetmrca < start) {
            sum += diversificationByTMRCA[thetmrca]
        }
    }
    return sum
}

function smooth(coefficients) {

    var coefmid = (coefficients.length - 1 ) / 2
    var smoothed = {}
    var diversificationKeys = Object.keys(diversificationByTMRCA)
    var maxyear = Math.max(...diversificationKeys)
    var maxyeartrunc = Math.floor(maxyear / 100)

    var thecoefs = {}
    for (var i = 1; i <= maxyeartrunc;i++) {
        var centyear = i*100
        thecoefs[centyear] = {}
        var thiscoefsum = 0
        for (var j = 0; j < coefficients.length; j++) {
            var thiscoef = coefficients[j]
            var thisEnd = (i - coefmid + j) * 100 - 50
            var thisStart = (i - coefmid + j) * 100 + 50
            if (thisStart <= maxyeartrunc * 100 + 50 && thisEnd >= 50) {
                thiscoefsum += thiscoef
                thecoefs[centyear][thisEnd+50] = {'count': getCountInRange(thisStart, thisEnd), 'weight': thiscoef}
            }
        }
        
    }

    
    for (var i = 1; i <= maxyeartrunc; i++) {
        var centyear = i*100
        var thesecounts = thecoefs[centyear]
        var coefkeys = Object.keys(thesecounts)
        var sum = 0
        var weights = 0
        for (var j = 0; j < coefkeys.length; j++) {
            var thekey = coefkeys[j]
            sum += thesecounts[thekey]['count'] * thesecounts[thekey]['weight']
            weights += thesecounts[thekey]['weight']
        }
        smoothed[centyear] = sum/weights
    }
    return smoothed
}

function createSVGLine(x1, y1, x2, y2, color) {
    return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+color+'" stroke-width=".5"/>'
}

function createSVGtext(width, x1, y1, txt, color, offsetX, offsetY) {
    var txtOffsetX = 0
    if (offsetX) {
        txtOffsetX = -4 * width / 96
    }
    var txtOffsetY = 0
    if (offsetY) {
        txtOffsetY = 5 * width / 96
    } else {
        txtOffsetY = 1.5 * width / 96
    }
    var fontsize = 0.25 * width / 80
    return '<text x="'+(x1+txtOffsetX)+'" y="'+(y1+txtOffsetY)+'" fill="'+color+'" font-size="'+fontsize+'em">'+txt+'</text>'
}

function getTickMod(thetmrca) {
    var mods = [100,200,250,400,500,1000,2000,2500,4000,5000,10000,20000]
    for (var i = 0; i < mods.length; i++) {
        var ticks = thetmrca / mods[i]
        if (ticks < 8) {
            return mods[i]
        }
    }
}
function createSVGDiversificationGraph(smoothed) {
    var theclass = 'claz'
    var width = 512
    var height = 512
    var thehtml = '<svg id="diversificationGraphGraph" width="'+width+'px" height="'+(height+10)+'px" viewBox="0 0 ' + width + " " + height +'" class="'+theclass+'" fill="none">'
    var keys = Object.keys(smoothed)
    var keymax = Math.max(...keys)
    var vals = Object.values(smoothed)
    var valmax = Math.max(...vals)

    var xMin = 100
    var xDisp = keymax / 100 - 1
    var yDisp = valmax

    var xSpace = width * 7/8
    var ySpace = height * 7/8
    var xStart = width * 1/8 / 2 + width / 32
    var yStart = height * 7/8 + height*1/16 - height / 32

    var yDisp = Math.max(...vals)
    function translateDiversification(x,y) {
        return {"x": xSpace - ((x - xMin) / 100 / xDisp * xSpace) + xStart, "y": yStart - y/yDisp*ySpace}
    }
    for (var i = 0; i < keys.length - 1; i++) {
        var thekey = keys[i]
        var theval = smoothed[thekey]
        var translatedFirst = translateDiversification(thekey, theval)
        thekey = keys[i + 1]
        theval = smoothed[thekey]
        var translatedSecond = translateDiversification(thekey, theval)
        thehtml += createSVGLine(translatedFirst['x'], translatedFirst['y'],translatedSecond['x'], translatedSecond['y'],'blue')

    }

    thehtml += createSVGLine(xStart, yStart,(xStart + xSpace), yStart,'black')
    thehtml += createSVGLine(xStart, yStart,xStart, yStart - ySpace, 'black')

    //x ticks
    
    var xticksmod = getTickMod(keymax)
    

    for (var i = 1; i <= keymax / xticksmod; i++ ) {
        if (smoothed.hasOwnProperty(i*xticksmod)) {
            
            var theX = translateDiversification(i*xticksmod, 0)['x']
            var theY = translateDiversification(i*xticksmod, 0)['y']

            thehtml += createSVGLine(theX, theY + width/64, theX, theY - width/64,'black')
            thehtml += createSVGtext(width, theX, theY, i*xticksmod, 'black', true, true)
            
        }
    }
    //x labels
    var halfway = translateDiversification(keymax/2, 0)
    thehtml += createSVGtext(width, halfway['x'], halfway['y']+width/28, 'ybp', 'black', true, true)
    //y ticks
    for (var i = 1; i < 5; i++ ) {

        var theX = translateDiversification(keymax, i/4 * valmax)['x']
        var theY = translateDiversification(keymax, i/4 * valmax)['y']

        thehtml += createSVGLine(theX - width/64, theY, theX + width/64, theY,'black')
        thehtml += createSVGtext(width, theX - width/32, theY, Math.round(i/4*valmax*10)/10, 'black', true, false)
    
    }
    return  thehtml + '</svg>'
}

var canvas = null
var image = null
function createDownloadLink(elem) {
    var svgElem = document.getElementById(elem)
    let {width, height} = svgElem.getBBox(); 
    let clonedSvgElement = svgElem.cloneNode(true)

    image = new Image();

    image.onload = function() {
        canvas = document.createElement('canvas');
        canvas.width = width;
        
        canvas.height = height;
        let context = canvas.getContext('2d');   // draw image in canvas starting left-0 , top - 0
        context.drawImage(image, 0, 0, width, height );  //  downloadImage(canvas); need to implement};
        let png = canvas.toDataURL();
        var download = function(href, name){
            var link = document.createElement('a');
            link.download = name;
            link.style.opacity = "0";
            link.href = href;
            link.click();
            link.remove();
          }
        download(png, clade + " diversification.png");
    }



    image.src = svg2img(elem);
    
    }


      function svg2img(elem){
        var svg = document.getElementById(elem)
        var xml = new XMLSerializer().serializeToString(svg);
        var svg64 = btoa(xml); //for utf8: btoa(unescape(encodeURIComponent(xml)))
        var b64start = 'data:image/svg+xml;base64,';
        var image64 = b64start + svg64;
        return image64;
    }

    function getDownloadButtonHTML(elemId) {
        return '<img title="Download PNG" width="8%" src="' + imagesDir + 'download.png" onclick="createDownloadLink(\''+elemId+'\')"></img>'
    }

    function getCloseButtonHTML(elemId) {
        return '<img title="Close" width="8%" src="' + imagesDir + 'close.png" onclick="optionalLayerControlClicked(\''+elemId+'\')"></img>'
    }

var theajaxresponse = null
function ajaxgetproducts() {
    var cladeFinderRootURL = null
    if (dnaType == 'y') {
        cladeFinderRootURL = "https://predict.yseq.net/clade-finder/"
    }
    if (dnaType == 'mt') {
        cladeFinderRootURL = "https://predict.yseq.net/mt-clade-finder/"
    }
    
    $.post(cladeFinderRootURL + "json.php",
  {
    'input': clade + '--',
    'json': 'phyloeq,products'
  },
  function(data, status){
    theajaxresponse = JSON.parse(data)
    continueShoppingCartControl(theajaxresponse)
    //alert("Data: " + data + "\nStatus: " + status);
  });
}

function getProductsHTML(response) {
    var keys = Object.keys(response['phyloeq'])
    var thehtml = '<div id="shoppingCartControl"><font size="+2">' + clade + " SNP Products available at YSEQ</font><br><br>"
    for (var i = 0; i < keys.length; i++) {
        if (response['phyloeq'][keys[i]].hasOwnProperty('product')) {
            var productId = response['phyloeq'][keys[i]]['product']    
            thehtml += '<a href="https://www.yseq.net/product_info.php?products_id=' + productId + '">' + keys[i] + '</a><br>'
        } else {
            if (dnaType == 'mt') {
                var panelLink = getPanelLink(getPanel(keys[i]))
                thehtml += '<a href="'+panelLink+'">' + keys[i] + '</a><br>'
            } else {
                var wishaSNPId = 108
                thehtml += '<a href="https://www.yseq.net/product_info.php?products_id=' + wishaSNPId + '">' + keys[i] + ' <img width="8%" src="'+imagesDir+'wishsnp.png"></img>' + '</a><br>'
            }            
        }
    }
    return thehtml + "</div>"
}

var panelRanges = {"mt1": [16516,370],
"mt2": [334,786],
"mt3": [536,1172],
"mt4": [1158,1764],
"mt5": [1763,2426],
"mt6": [2417,3054],
"mt7": [3015,3627],
"mt8": [3555,4219],
"mt9": [4204,4904],
"mt10": [4858,5551],
"mt11": [5547,6023],
"mt12": [5842,6569],
"mt13": [6244,6938],
"mt14": [6937,7705],
"mt15": [7523,7891],
"mt16": [7870,8545],
"mt17": [8454,9168],
"mt18": [9120,9847],
"mt19": [9843,10497],
"mt20": [10416,11013],
"mt21": [10988,11662],
"mt22": [11653,12341],
"mt23": [12304,12987],
"mt24": [12984,13581],
"mt25": [13565,14258],
"mt26": [14248,14911],
"mt27": [14754,15400],
"mt28": [15393,16048],
"mt29": [15899,16526]}

function getPanel(snp) {
	var position = parseInt(snp.substring(1,snp.length-1))

    var valid = []
    var prkeys = Object.keys(panelRanges)
	for (var i = 0; i < prkeys.length; i++) {
        var panel = prkeys[i]
        var range = panelRanges[panel]
		if (range[0] < range[1]) {
			if (position > range[0] && position < range[1]) {
				valid.push(panel);
			}
		} else {
			if (position > range[0] || position < range[1]) {
				valid.push(panel);
			}
		}
	}
	if (valid.length == 2) {
		return getBestPanel(position, valid[0], valid[1]);
	} else {
		return valid[0];
	}
}

function getBestPanel(position, panel1, panel2) {

	if (Math.min(Math.abs(position-panelRanges[panel1][0]),Math.abs(position-panelRanges[panel1][1])) > Math.min(Math.abs(position-panelRanges[panel2][0]),Math.abs(position-panelRanges[panel2][1]))) {
		return panel1;
	} else {
		return panel2;
	}
}


function getPanelLink(panel) {
	return "https://www.yseq.net/product_info.php?cPath=28_31&products_id=" + (108720 + parseInt(panel.substring(2)));
}