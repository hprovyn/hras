var numberOfLonBuckets = 10
var lonbucketwidth = 360 / numberOfLonBuckets
var halflonspan = (numberOfLonBuckets) / 2

function getLonBuckets(lons) {
    var lonbuckets = new Array(numberOfLonBuckets).fill(0);
    function getLonBucketIdx(lon) {
        if (lon == 180) return 0
        return Math.floor((lon + 180) / lonbucketwidth)
    } 

        
    for (var i = 0; i < lons.length; i++) {
        lonbuckets[getLonBucketIdx(lons[i])]++
    }

    return lonbuckets
}

function biggestStretch(lonbuckets) {
    var longest = 0
    var streak = 0
    var firststreak = null
    var longestStreakCenter = null
    for (var i = 0; i < numberOfLonBuckets; i++) {
        if (lonbuckets[i] == 0) {
            streak++                
        }
        if (lonbuckets[i] > 0) {
            if (streak > longest) {
                longest = streak
                if (firststreak == null) {
                    firststreak = streak
                }
                longestStreakCenter = i - (longest + 1) / 2
            }
            streak = 0
        }
    }
    return {"firststreak": firststreak, "longest":longest, "laststreak": streak, "streakCenter": longestStreakCenter}
}

function getStreakCenterDegreesFromBucketIdx(streakCenterIdx) {
    return (streakCenterIdx + 0.5) * lonbucketwidth
}
function isWithin180(firststreak, longest, laststreak, streakCenter, lonbuckets) {
    if (longest >= halflonspan) {
        return {"within": true, "offset": 360 - getStreakCenterDegreesFromBucketIdx(streakCenter)}
    }
    var idlwrappedstreak = firststreak + laststreak
    if (halflonspan <= idlwrappedstreak) {
        var coverageStreakCenter = (firststreak + numberOfLonBuckets - laststreak - 1)/2
        return {"within": true, "offset": getStreakCenterDegreesFromBucketIdx(coverageStreakCenter)}
    }
    return {"within": false}
}

var bucketBinomials = [1,4,6,4,1]
function smoothBucketCoverageForIDLSafe(lonbuckets) {
    var bbnOffset = (bucketBinomials.length - 1) / 2
    var smoothed = new Array(numberOfLonBuckets).fill(0);
    for (var i = 0; i < numberOfLonBuckets; i++) {
        for (var j = 0; j < bucketBinomials.length; j++) {
            var theidx = i + j - bbnOffset
            if (theidx < 0) {
                theidx += 10
            } else {
                theidx = theidx % 10
            }
            smoothed[theidx] += lonbuckets[i] * bucketBinomials[j]
        }
    }
    return smoothed
}

function getCenterBucketOfSmoothed(smoothed) {
    var themax = Math.max(...smoothed)
    var nummaxes = smoothed.filter(i => i == themax).length
    var indexof = smoothed.indexOf(themax)
    if (nummaxes == 1) {
        return indexof
    }
    //if two bins tie, define midpoint of bins as midpoint of 180 degree slice
    var lastindexof = smoothed.lastIndexOf(themax)
    var absdiff = Math.abs(lastindexof - indexof)
    if (absdiff <= halflonspan) {
        return (indexof + lastindexof) / 2
    }
    return ((indexof + lastindexof) / 2 + halflonspan) % numberOfLonBuckets
    
    //if more than two bins tie, should add message to list of warnings stating difficulty in calculating centroid due to wide distribution
}


function zippiestIDLSafeCheck(lons) {
    
    var lonmin = Math.min(...lons)
    var lonmax = Math.max(...lons)
    if (lonmax - lonmin < 180) {
        return true
    }
    return false
}


function computeCentroidIDLSafe(points, clade, subclades) {
    if (points.length == 1) {
        return computeCentroid(points, clade, subclades)
    }
    var lons = points.map(p => p[1])

    if (zippiestIDLSafeCheck(lons)) {
        return computeCentroid(points, clade, subclades)
    }
    var offset = 0
    if (points.length == 2) {
        offset = 180
    } else {
        // Three or more AND zippiest test failed.
        // Use binning algorithm to see if there is a 180 degree slice with no coverage.
        // i.e. all samples fall within the other 180 degree slice.

        var lonbuckets = getLonBuckets(lons)
        var theout = biggestStretch(lonbuckets)
        var isWithin180output = isWithin180(theout['firststreak'],theout['longest'],theout['laststreak'],theout['streakCenter'], lonbuckets)

        if (isWithin180output['within']) {
            //zippiest test failed but the points can be shifted by an offset s.th. all are within 180 degree slice
            offset = isWithin180output['offset']
        } else {
            //points cover more than 180 degree slice, compute buckets center of mass to determine best offset
            var smoothedCoverageCenterBucketIdx = getCenterBucketOfSmoothed(smoothBucketCoverageForIDLSafe(lonbuckets))
            offset = getStreakCenterDegreesFromBucketIdx(smoothedCoverageCenterBucketIdx)    
        }
    }
    
    var offsetPoints = applyLonOffset(points, offset)
    var computedOffset = computeCentroid(offsetPoints, clade, subclades)
    //de-apply offset to computed centroid
    return {"centroid": applyLonOffset([computedOffset['centroid']],-1 * offset)[0]}   
}

function applyLonOffset(points, offset) {
    return points.map(p=>
        [p[0], (p[1] + offset + 540) % 360 - 180]
    )
}

function averageIDLSafe(point1,point2) {
    if (Math.abs(point1[1]-point2[1]) < 180) {
        return average(point1,point2)
    }
    var obverseMidpoint = average(point1,point2)
    return applyLonOffset([obverseMidpoint],180)[0]
}
