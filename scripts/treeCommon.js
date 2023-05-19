function getProjectBaseDir(projectName) {
    return baseDir + projectName + "/"
}

function getTreeURL(projectName) {
    return getProjectBaseDir(projectName) + projectName + treeUrlSuffix;
}

function loadTree(projectName) {

  $.ajax({
      type:    "GET",
      async: false,
      url:     getTreeURL(projectName),
      success: function(text) {
      
               if (lmap == null) {
                 alert('map not loaded')
               }
               parseXML(text);            
      },
      error:   function() {
          // An error occurred
          alert("error loading tree file");
      }
   });
   
}

function parseXML(xml) {
  var parser = new DOMParser();
  var rootxml = parser.parseFromString(xml,"text/xml").documentElement;    
  recurseXMLFromRoot(rootxml);  
}

var ybp = {}
var childParents = {};
var parentChildren = {};
var tmrca = {}

function recurseXMLFromRoot(node) {
  var name = node.getAttribute("name");
  if (node.hasAttribute("formed")) {
    ybp[name] = parseInt(node.getAttribute("formed"));
    tmrca[name] = parseInt(node.getAttribute("tmrca"));
  } else {
    if (Object.keys(childParents).length == 0) {
        ybp[name] = 0;
        tmrca[name] = 0;
    } else {
        ybp[name] = ybp[childParents[name]];
        tmrca[name] = tmrca[childParents[tmrca]];
    }
  }

  parentChildren[name] = []
  for (var i = 0; i < node.children.length; i++) {
    childParents[node.children[i].getAttribute("name")] = name;
    parentChildren[name].push(node.children[i].getAttribute("name"))
    recurseXMLFromRoot(node.children[i]);
  }
}

function getChildren(clade) {
  
  if (parentChildren.hasOwnProperty(clade)) {
      return parentChildren[clade]
  } else {
      return []
  }
}

function getDownstream(clade) {
  var clades = [];
  clades.push(clade);
  
  var children = getChildren(clade);
  for (var i = 0; i < children.length; i++) {
      clades = clades.concat(getDownstream(children[i]))      
  }
  return clades;
}

function getUpstream(clade) {
  var clades = [];
  clades.push(clade);
  
  if (childParents.hasOwnProperty(clade)) {
    var parent = childParents[clade]
    clades = clades.concat(getUpstream(parent))
  }
  return clades
}