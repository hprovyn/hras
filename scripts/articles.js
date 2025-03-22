var articles = []
var authors = []
var hrasiProjects = []
var adminFilter = []

async function getArticles(dnaType, rootHg) {
    await $.ajax({
    url: "https://phylogeographer.com/latu/articlesAPI.php",
    data: { 
        "HG_FILTER": rootHg, 
        "DNA_TYPE": dnaType
    },
	    async:false,
      crossDomain: true,
    cache: false,
    type: "GET",
    success: function(response) {
        var respObj = JSON.parse(response);
	articles = Object.values(respObj['articles']);
	authors = respObj['authors'];
	hrasiProjects = respObj['projectsAdmins'];
	layerStates['articles'] = project
    },
    error: function(xhr) {
	    reject(xhr) }
    });
}


function getArticleFilters() {
    var html = '<select id="adminGroup" onchange="articleFilterByProject()">'
    html += '<option selected value="All">All</option>'
	var hrasiProjectIds = Object.keys(hrasiProjects);
	for (var i = 0; i < hrasiProjectIds.length; i++) {
		var theId = hrasiProjectIds[i];
	    html += '<option value=' + theId + '>Project ' + theId + ' - ' + hrasiProjects[theId]["ADMIN_INFO"]["FOCUS"] + '</option>';
    }
    html +='</select><span id="projectInfo"></span>';
	return html;
}

function articleFilterByProject() {
    var selectedGroup = document.getElementById("adminGroup").value
	if (selectedGroup == "All") {
        adminFilter = []
        document.getElementById("projectInfo").innerHTML = "";
	} else {
        var projectId = selectedGroup
	    adminFilter = [hrasiProjects[projectId]["ADMIN_INFO"]["ADMIN"]];
        adminFilter = adminFilter.concat(hrasiProjects[projectId]["ADMIN_INFO"]["ADMINS"])
        document.getElementById("projectInfo").innerHTML = adminFilter.join(', ')
	}
	sortArticles("articles",null,null)
	//alert("show only: " + admins.join(", "));
}

function filterArticles(articles, clade) {
    var downstr = getDownstream(clade)
    var upstr = getUpstream(clade)
    var relevantClades = downstr.concat(upstr)
    var filtered = articles.filter(a => relevantClades.indexOf(a["ADMIN_HG"]) != -1)
	if (adminFilter.length > 0) {
		filtered = filtered.filter(a => adminFilter.indexOf(a["ADMIN"]) != -1)
	}
	return filtered
}

function articlesTable(filteredArticles, headers, tableName, sortBy, sortParams) {
    var html = "<table table-layout=\"fixed\" style=\"width=100%; font-size:90%\" border=\"1\"><tr>"
    var dispOrder = new Array(headers.length);
    var sortable = new Array(headers.length);
    var widths = new Array(headers.length);
    sortable.fill(false)
    dispOrder.fill(0)
    widths.fill("100")

    for( var i = 0; i < headers.length; i++) { 
        dispOrder[headers[i]['order']] = headers[i]['label']
        if (headers[i].hasOwnProperty("sortable")) {
            sortable[headers[i]['order']] = headers[i]['sortable']
        }
	
        if (headers[i].hasOwnProperty("width")) {
            widths[headers[i]['order']] = headers[i]['width']
        }
    }

    for( var i = 0; i < headers.length; i++) {
        if (sortable[i]) {
		var sortParamToPass = ""
		if (sortParams) {
			sortParamToPass = "," + sortParams
		}
            html += '<td width="'+widths[i]+'px"><button onclick="sortArticles(\''+tableName+'\',\''+dispOrder[i]+ '\'' + sortParamToPass + ')">'+dispOrder[i]+"</button></td>"
        } else {
            html += '<td width="'+widths[i]+'px">'+dispOrder[i]+"</td>"
        }
        
    }
    html += "</tr>"
    if (filteredArticles.length > 0 && sortBy && filteredArticles[0].hasOwnProperty(sortBy)) {
        var first = filteredArticles[0][sortBy]
        if (sortBy == "Relevance") {
            filteredArticles.sort((a,b)=>parseInt(b[sortBy].split("|||||")[0]) - parseInt(a[sortBy].split("|||||")[0]))
        } else {
            if (typeof first == 'number') {
                filteredArticles.sort((a,b)=>a[sortBy] - b[sortBy])
            } else {
                //sort array length of likes, not alphanumeric w/ svg
                filteredArticles.sort((a,b)=>a[sortBy].localeCompare(b[sortBy]))
            }
        }
	}
	for( var i = 0; i < filteredArticles.length; i++) {
        html += "<tr>"
		for( var j = 0; j < headers.length; j++) { 
            if (dispOrder[j] == 'Title') {
                var titleLink = filteredArticles[i][dispOrder[j]].split("|||||")
                
                html += "<td onclick=\"window.open('//" + titleLink[1] + "', '_blank')\" style=\"overflow:hidden;cursor:pointer\">" + titleLink[0] + "</td>"
            } else {
                if (dispOrder[j] == 'Relevance') {
                    html +=  "<td style=\"overflow:hidden\">"+filteredArticles[i][dispOrder[j]].split("|||||")[1]+"</td>"
                } else {
                    html += "<td style=\"overflow:hidden\">"+filteredArticles[i][dispOrder[j]]+"</td>"
                }
            }
        }
        html += "</tr>"
    }
	html += "</table>"
	return html
}

var articleInfoHeaders = [
	{"field": "AUTHORS", "label": "Author(s)", "width":"100","order":0},
	{"field": "ART_FIELD", "label": "Field(s)", "width":"100","order":1},
	{"field": "SUBMITTER", "label": "Submitter", "width":"100","order":2},
	{"field": "ADMIN", "label": "Admin Approved", "width":"100","order":3}]

function getArticleInfo(articleId) {
	var thearticle = articles.filter(a => a['ID'] == articleId)[0]
	
        var submissionId = thearticle['SUBMISSION_ID']
	var theauthors = Object.keys(authors).filter(a => authors[a].indexOf(submissionId) != -1)
	
        var thetableready = {}
        for (var j = 0; j < articleInfoHeaders.length; j++) {
            var theheader = articleInfoHeaders[j]
            var thisfield = theheader['field']
            var thislabel = theheader['label']
            if (thearticle.hasOwnProperty(thisfield)) {
                    thetableready[thislabel] = thearticle[thisfield]
            }
	    if (thisfield == 'AUTHORS') {
		    thetableready[thislabel] = theauthors.join("<br>")
	    }
	}
	return thetableready
}

function getArticleRatersTable(articleId, sortBy) {

    var thearticle = articles.filter(a => a['ID'] == articleId)[0]

    var filtered = []
    
    var ratings = Object.keys(thearticle['RATINGS'])
    ratings.forEach(function(rating) {
        for (var i = 0; i < thearticle['RATINGS'][rating].length; i++) {
	    filtered.push({'RATER': thearticle['RATINGS'][rating][i],
			    'RATING': rating})
	}

    })
    
    var headers = [{"field": "RATER", "label": "Rater", "width":"50","order":0, "sortable": true},
    {"field": "RATING", "label": "Rating", "order":1, "sortable": true}]
    
    var ratingToImage = {'LIKE':'like', 'DISLIKE':'dislike', 'N/A': 'na'}

    var tableReady = []
    for (var i = 0 ; i < filtered.length; i++) {
        var thetableready = {}
        var thearticle = filtered[i]
        for (var j = 0; j < headers.length; j++) {
            
            var theheader = headers[j]
            var thisfield = theheader['field']
            var thislabel = theheader['label']

            if (thearticle.hasOwnProperty(thisfield)) {
		if (thisfield == "RATER") {
                    thetableready[thislabel] = thearticle[thisfield]
		}
                if (thisfield == "RATING") {
                    thetableready[thislabel] = '<img width="25px" src="https://phylogeographer.com/scripts/images/'+ratingToImage[thearticle[thisfield]]+'.png"></img>'
                }
	    }
	}
	tableReady.push(thetableready)
    }

    return articlesTable(tableReady, headers, 'articleInfoRaters', sortBy, articleId)
}

function articleInfoClicked(articleId) {
	document.getElementById('articles').innerHTML = getCompleteArticleInfoHTML(articleId)
}

function getCompleteArticleInfoHTML(articleId, sortBy) {

    var thearticle = articles.filter(a => a['ID'] == articleId)[0]
var html = thearticle['TITLE'] + '<br>' + 'for ' + thearticle['DNA_TYPE'] + thearticle['ADMIN_HG'] + '<br><br>'
	html += articlesTable([getArticleInfo(articleId)], articleInfoHeaders, 'articleInfoMeta') + "<br>"
	html += 'Ratings<br>' + getArticleRatersTable(articleId, sortBy) + "<br>"
	html += 'All Haplogroups Referenced<br>' + getArticlesAllHgsTable(articleId, sortBy)
	return html
}

function getArticlesAllHgsTable(articleId, sortBy) {
    
    var thearticle = articles.filter(a => a['ID'] == articleId)[0]
    var submissionId = thearticle['SUBMISSION_ID']
    var filtered = articles.filter(a => a['SUBMISSION_ID'] == submissionId)
   
    var headers = [{"field": "ADMIN", "label": "Admin", "width":"150","order":0, "sortable": true},
    {"field": "DNA_TYPE", "label": "DNA type", "order":1, "sortable": true},
    {"field": "ADMIN_HG", "label": "Haplogroup", "order":2, "sortable": true}]

    
    var tableReady = []
    for (var i = 0 ; i < filtered.length; i++) {
        var thetableready = {}
        var thearticle = filtered[i]
        for (var j = 0; j < headers.length; j++) {
            
            var theheader = headers[j]
            var thisfield = theheader['field']
            var thislabel = theheader['label']
            if (thearticle.hasOwnProperty(thisfield)) {
                    thetableready[thislabel] = thearticle[thisfield]
	    }
	}
	tableReady.push(thetableready)
    }
    return articlesTable(tableReady, headers, 'articleInfoAllHgs', sortBy, articleId)
}

function getArticlesTableForClade(sortBy) {
    var filtered = filterArticles(articles, clade)
    var headers = [{"field": "PUB_YEAR", "label": "Year", "width":"40","order":4, "sortable": true},
    {"field": "RELEVANCE", "label": "Relevance", "width": "50", "order":2, "sortable": true},

    {"field": "SCOPE", "label": "Scope", "width": "50", "order":3},
    {"field": "ADMIN_HG", "label": "Haplogroup", "width": "50", "order":5, "sortable": true},
    {"field": "TMRCA", "label": "TMRCA", "width":"50", "order":6, "sortable": true},
    {"field": "ART_TYPE", "label": "Type", "width":"40", "order":1, "sortable": true},
    {"field": "TITLE", "label": "Title", "width":'450', "order":0},
    {"field": "LIKE", "label": "Likes", "width":"40", "order":7, "sortable": true},
//    {"field": "DISLIKE", "label": "Dislikes", "width":"40", "order":6},
    {"field": "N/A", "label": "N/A", "width":"40","order":8},
    {"field": "MORE", "label": " ", "width":"40","order":9}]  
    var tableReady = []
    for (var i = 0 ; i < filtered.length; i++) {
        var thetableready = {}
        var thearticle = filtered[i]
        for (var j = 0; j < headers.length; j++) {
            
            var theheader = headers[j]
            var thisfield = theheader['field']
            var thislabel = theheader['label']
            if (thearticle.hasOwnProperty(thisfield)) {
		if (thisfield == "TITLE") {

                    thetableready[thislabel] = thearticle["TITLE"] + '|||||' + thearticle["LINK"]
		} else {

		if (thisfield == "ART_TYPE") {
			var iconName = "help"
			var artType = thearticle['ART_TYPE']
		        var artTypeIcons = {"Journal": "journal", "Book": "book", "Video": "video", "Map": "map", "Blog": "blog", "Wikipedia": "wiki"}
			if (artTypeIcons.hasOwnProperty(artType)) {
				iconName = artTypeIcons[artType]
			}
			thetableready[thislabel] = '<img title="' + artType + '" width="25px" src="https://phylogeographer.com/scripts/images/' + iconName + '.png"/>'
		} else {
                    thetableready[thislabel] = thearticle[thisfield]
		}
		}

            } else {
                if (thisfield == "TMRCA") {
                    thetableready[thislabel] = tmrca[thearticle["ADMIN_HG"]]
                }
		if (thisfield == "RELEVANCE") {
            var thistmrca = tmrca[thearticle["ADMIN_HG"]]
            var relevance = 0
			if (tmrca[clade] > thistmrca) {
                relevance = thistmrca/tmrca[clade]
				
			} else {
                relevance = tmrca[clade]/thistmrca
				
            }
            thetableready[thislabel] = Math.round(100*relevance) + "|||||" + getHorizBarSVG(relevance)
		}
		if (thisfield == "SCOPE") {
			var thistmrca = tmrca[thearticle["ADMIN_HG"]]
			var thishg = thearticle["ADMIN_HG"]
			if (clade == thishg) {
				thetableready[thislabel] = "Exact"
			} else {
				if (tmrca[clade] > thistmrca) {
					thetableready[thislabel] = "More specific" 
				} else {
					if (tmrca[clade] < thistmrca) {
						thetableready[thislabel] = "More general"
					} else {
						if (getDownstream(clade).indexOf(thishg) != -1) {	
							thetableready[thislabel] = "More specific" 
						} else {
							thetableready[thislabel] = "More general"
						}
					}
				}
			}
		}
                if (thisfield == "LIKE") {
                    thetableready[thislabel] = '<img width="25px" src="https://phylogeographer.com/scripts/images/like.png"></img> ' + thearticle['RATINGS']['LIKE'].length
                }
                /*if (thisfield == "DISLIKE") {
                    thetableready[thislabel] = '<img width="25px" src="https://phylogeographer.com/scripts/images/dislike.png"></img> ' + thearticle['RATINGS']['DISLIKE'].length
                }*/
                if (thisfield == "N/A") {
                    thetableready[thislabel] = '<img width="25px" src="https://phylogeographer.com/scripts/images/NA.png"></img> ' + thearticle['RATINGS']['N/A'].length
                }

                if (thisfield == "MORE") {
                    thetableready[thislabel] = '<img width="25px" onclick="articleInfoClicked(' + thearticle['ID'] + ')" src="https://phylogeographer.com/scripts/images/more.png"></img> '
                }
            }
        }
        tableReady.push(thetableready)
    }
    return articlesTable(tableReady, headers, 'articles', sortBy)
}

function sortArticles(tableName, sortBy, params) {
	if (tableName == 'articles') {
		document.getElementById('articles').innerHTML = getArticlesTableForClade(sortBy)
	
	}
	if (tableName == 'articleInfoRaters' || tableName == 'articleInfoAllHgs') {
		var articleId = params
		document.getElementById('articles').innerHTML = getCompleteArticleInfoHTML(articleId, sortBy)
	}
}

//sort on tmrca?

//rows.sort((a,b) => parseInt(a[0].substring(5)) > parseInt(b[0].substring(5)))

function getHorizBarSVG(frac) {
    var width = 90 * frac
    var fillColor = rgbToHex(HSVtoRGB(getGreenYellowRedHue(frac),1,1))
    var thesvg =  '<svg width="100" height="10"><rect x="5" y="1" width="'+width+'" height="8" style="fill:'+fillColor +';stroke:black;stroke-width:1;fill-opacity:1;stroke-opacity:1" /></svg> '
    return thesvg
}
    
function getGreenYellowRedHue(frac) {
    return 1/3 * frac
}
