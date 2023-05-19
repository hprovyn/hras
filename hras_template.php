<?php

//general
$installationRootURL = "$hrasRootURL";
$scriptsRootURL = "$hrasScriptsURL";
$imagesDir = "$hrasImagesURL";
$dataRootURL = "$hrasDataURL";
$leafletMapURL = "$tileServerURL";

//map and dna type defining parameters
$dnaType = "";
$mapType = "";

//dna type specific vars
$allProjects = array();
$updateManifestFile = "";
$title = "";
$description = "";
$heatmapIconDNAtype = "";
$baseDir = "";
$denomURLprefix = "";
$minRadius = 0;
$autocompletionFile = "";
$treeUrlSuffix = "";
$cladeFinderURL = "";

//map type specific vars
$commonHeatmapJS_source_url = "";

//map and dna type specific vars
$additionalScripts = array();

$cladeFinderResult = "";

function curlCladeFinder($snps) {

	$fields = array(
	            'input' => urlencode($snps),
		                    'json' => urlencode('downstream,score')
				            );

	$url = "https://cladefinder.yseq.net/json.php";
	foreach($fields as $key=>$value) { $fields_string .= $key.'='.$value.'&'; }
	rtrim($fields_string, '&');

	$ch = curl_init();

	curl_setopt($ch,CURLOPT_URL, $url);
	curl_setopt($ch,CURLOPT_POST, count($fields));
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch,CURLOPT_POSTFIELDS, $fields_string);
	$result = curl_exec($ch);

	curl_close($ch);
	return $result;
}

if (isset($_GET["snps"])) {
    $snps = $_GET["snps"];
    $cladeFinderResult = curlCladeFinder($snps);
}


if (!isset($_GET["dna_type"])) {
    $_GET["dna_type"] = "y";
}
if (!isset($_GET["map_type"])) {
    $_GET["map_type"] = "alpha";
}

if (isset($_GET["dna_type"])) {
    $dnaType = $_GET["dna_type"];
    if ($dnaType == "y") {
        $updateManifestFile = $dataRootURL . "manifest";
        $title = "Y-DNA";
        $description = "Developed by Hunter Provyn and Thomas Krahn<br>Apache 2.0 License";
        $heatmapIconDNAtype = 'Y';
        $baseDir = $dataRootURL . "haplogroups/y/";
        $allProjects = array('A00','A0','A1a','A1b1','B','C','D','E','F-Y27277','G','H','I1','I2','J1','J2','K-Y28299','L','M','N','O','Q','R1a','R1b','R2','S','T');
        $denomURLprefix = $dataRootURL . "y_denom_";
        $minRadius = 150;
        $autocompletionFile = $dataRootURL . "snpMapHeatYFaceting.csv";
        $treeUrlSuffix = "-lessoutliers-tree.txt";
        $cladeFinderURL = "https://cladefinder.yseq.net/interactive_tree.php";

    } elseif ($dnaType == "mt") {
        $updateManifestFile = $dataRootURL . "mtdna_manifest";
        $title = "mtDNA";
        $description = "Developed by Hunter Provyn and Thomas Krahn<br>Apache 2.0 License";

        $heatmapIconDNAtype = 'mt';
        $baseDir = $dataRootURL . "haplogroups/mt/";
        $allProjects = array("DN","NA","U",'R-a','R9c','R9b','F','R8','R7','R6','R5','R4','R32','R31','R30','R3','R2','T','J','R23','R22','R14','R13',"R12'21","R10","R1","R0a'b","HV-b","HV-a","HV5","HV4","HV32","HV31","HV30","HV3","HV29","HV28","HV27","HV26","HV25","HV21","HV19","HV18","HV13","HV12","HV1","HV0k","HV0j","HV0i","HV0h","V","HV0a7","HV0a6","HV0a5","HV0a4","HV0a3","HV0a2","HV0a1","HV0-a","H","P","A","N10","N11","N13","N14","N1a1a","I","N1a1b1","N1a2","N1a3","N1b","N1c","N5","N2a","W","N21","N22","N3","N6","N7","N8","N9a","N9b","Y","ND","L0","L1","L2","L3a","L3b'f","L3c'd","L3e'i'k'x","L3h","M10","M11","M1'20'51","G","M12","M13'46'61","M14","M15","M16","M17","M19'53","M2","M21","M22","M23'75","M24'41","M25","M26","M27","M28","M29","M29'Q1","Q","M3","M31","M32'56","M33","M34'57","M35","M36","M39'70","M40","M42'74","M44","M4''67","M47","M48","M49","M5","M50","M52","M55'77","M58","M59","M6","M62'68","M69","M7","M71","M72","M73'79","M76","M78","C","Z","M8a","D","M80","M80'D1","M81","M82","M83","M84","M85","M86","E","M9a'b","M91","O","S","X","L4","L5'7","L6");
        $denomURLprefix = $dataRootURL . "mtdna_denom_";
        $minRadius = 200;
        $autocompletionFile = $dataRootURL . "snpMapHeatMTDNA.csv";
        $treeUrlSuffix = "-tree.txt";
        $cladeFinderURL = "https://predict.yseq.net/mt-clade-finder/interactive_tree.php";
    }
}

if (isset($_GET["map_type"])) {
    $mapType = $_GET["map_type"];
    if ($mapType == "alpha") {
        $commonHeatmapJS_source_url = $scriptsRootURL . "heatmapAlphaCommon.js";
        $title = $title . " Relative Frequency";
    }
    if ($mapType == "classic") {
        $title = $title . " Relative Frequency (Classic)";
        array_push($additionalScripts, $scriptsRootURL . "heatmapClassicRefactored.js");
        $commonHeatmapJS_source_url = $scriptsRootURL . "heatmapClassicCommon.js";
    }
    if ($mapType == "diversity") {
        $title = $title . " Diversity";  
        array_push($additionalScripts,  $scriptsRootURL . "diversity.js");
        $commonHeatmapJS_source_url = $scriptsRootURL . "heatmapClassicCommon.js";
    }
    if ($mapType == "classic" || $mapType == "diversity") {
        array_push($additionalScripts, $scriptsRootURL . "heatmap.min.js", $scriptsRootURL . "leaflet-heatmap.js");
    }
}


include("heatmapCommon.php");

?>
