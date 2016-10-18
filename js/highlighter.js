/**
 * Created by ghassaei on 10/13/16.
 */


function initHighlighter(){

    var object3D = new THREE.Mesh(new THREE.BoxGeometry(1,0.01,1),
        new THREE.MeshBasicMaterial({opacity:0.1, transparent:true, color:0x000000}));
    globals.threeView.sceneAdd(object3D);
    setVisiblitiy(false);

    function setVisiblitiy(visible){
        object3D.visible = visible;
    }

    function setPosition(position){
        object3D.position.set(position.x, position.y, position.z);
    }

    function setScale(scale){
        object3D.scale.set(scale.x, 1.0, scale.z);
    }

    function subDivide(){
        if (!object3D.visible) return;
        //first get four nodes
        var position = object3D.position.clone();
        var scale = object3D.scale.clone().multiplyScalar(0.5);
        scale.y = 0;
        var nodes = globals.schematic.getNodes();

        var minminVect = position.clone().sub(scale);
        var maxmaxVect = position.clone().add(scale);
        var maxminVect = minminVect.clone();
        maxminVect.x = maxmaxVect.x;
        var minMaxVect = maxmaxVect.clone();
        minMaxVect.x = minminVect.x;

        var vertices = [minminVect, maxmaxVect, maxminVect, minMaxVect];
        var indices = [-1, -1, -1, -1];
        var subDivNodes = [null, null, null, null];

        _.each(nodes, function(node, nodeIndex){
            var position = node.getOriginalPosition();
            _.each(vertices, function(vertex, vertIndex){
                var dist = vertex.clone().sub(position).length();
                if (dist < 0.001){
                    indices[vertIndex] = nodeIndex;
                    subDivNodes[vertIndex] = node;
                }
            })
        });

        if (_.contains(indices, -1)) return;

        var edges = globals.schematic.getEdges();
        var subDivEdges = [];

        _.each(edges, function(edge){
            var numNodes = 0;
            for (var i=0;i<2;i++){
                var node = edge.nodes[i];
                if (_.contains(indices, node.getIndex())){
                    numNodes++;
                    if (numNodes == 2) {
                        subDivEdges.push(edge);
                        break;
                    }
                }
            }
        });

        if (subDivEdges.length<4) {

            var existingNodes = [];
            for (var i=0;i<4;i++) {
                var vertex = object3D.position.clone();
                if (i == 0) vertex.x += scale.x;
                else if (i == 1) vertex.x -= scale.x;
                else if (i == 2) vertex.z += scale.z;
                else if (i == 3) vertex.z -= scale.z;
                _.each(nodes, function (node) {
                    var position = node.getOriginalPosition();
                    var dist = vertex.clone().sub(position).length();
                    if (dist < 0.001) {
                        existingNodes.push(node);
                    }
                });
            }
        }
        globals.schematic.subDivide(subDivEdges, subDivNodes, existingNodes);
        this.setVisiblitiy(false);
    }

    function findBoundingNodes(intersection){
        var minDist = globals.xLength+globals.zLength;
        var maxDist = minDist;
        var minMaxDist = minDist;
        var maxMinDist = maxDist;
        var minVect = null;
        var maxVect = null;
        var minMaxVect = null;
        var maxMinVect = null;
        _.each(nodes, function(node){
            var position = node.getOriginalPosition();
            var diff = intersection.clone().sub(position);
            var length = diff.length();
            if (diff.x<0 && diff.z<0){
                if (length<minDist) {
                    minDist = length;
                    minVect = position.clone();
                }
            } else if (diff.x>0 && diff.z>0){
                if (length<maxDist) {
                    maxDist = length;
                    maxVect = position.clone();
                }
            } else if (diff.x>0 && diff.z<0){
                if (length<maxMinDist) {
                    maxMinDist = length;
                    maxMinVect = position.clone();
                }
            } else if (diff.x<0 && diff.z>0){
                if (length<minMaxDist) {
                    minMaxDist = length;
                    minMaxVect = position.clone();
                }
            }
        });
    }

    function highlight(intersection){
        var nodes = globals.schematic.getNodes();
        var minDist = globals.xLength+globals.zLength;
        var maxDist = minDist;
        var minMaxDist = minDist;
        var maxMinDist = maxDist;
        var minVect = null;
        var maxVect = null;
        var minMaxVect = null;
        var maxMinVect = null;
        _.each(nodes, function(node){
            var position = node.getOriginalPosition();
            var diff = intersection.clone().sub(position);
            if (diff.x<0 && diff.z<0){
                if (diff.length()<minDist) {
                    minDist = diff.length();
                    minVect = position.clone();
                }
            } else if (diff.x>0 && diff.z>0){
                if (diff.length()<maxDist) {
                    maxDist = diff.length();
                    maxVect = position.clone();
                }
            } else if (diff.x>0 && diff.z<0){
                if (diff.length()<maxMinDist) {
                    maxMinDist = diff.length();
                    maxMinVect = position.clone();
                }
            } else if (diff.x<0 && diff.z>0){
                if (diff.length()<minMaxDist) {
                    minMaxDist = diff.length();
                    minMaxVect = position.clone();
                }
            }
        });
        if (minVect && maxVect && minMaxVect && maxMinVect){
            minVect = new THREE.Vector3(Math.max(minVect.x, minMaxVect.x), 0, Math.max(minVect.z, maxMinVect.z));
            maxVect = new THREE.Vector3(Math.min(maxVect.x, maxMinVect.x), 0, Math.min(maxVect.z, minMaxVect.z));
            minMaxVect = new THREE.Vector3(minVect.x, 0, maxVect.z);
            maxMinVect = new THREE.Vector3(maxVect.x, 0, minVect.z);

            if (checkCompleteLoop(minVect, maxVect, minMaxVect, maxMinVect)){
                globals.highlighter.setPosition(maxVect.clone().add(minVect).multiplyScalar(0.5));
                globals.highlighter.setScale(maxVect.clone().sub(minVect));
                globals.highlighter.setVisiblitiy(true);
            } else {
                var data = findLoop(minVect);
                if (data === null) {
                    globals.highlighter.setVisiblitiy(false);
                    console.log("couldn't find loop");
                }
                else {
                    minVect = data.minVect;
                    maxVect = data.maxVect;
                    globals.highlighter.setPosition(maxVect.clone().add(minVect).multiplyScalar(0.5));
                    globals.highlighter.setScale(maxVect.clone().sub(minVect));
                    globals.highlighter.setVisiblitiy(true);
                }
            }
        } else {
            globals.highlighter.setVisiblitiy(false);
        }
    }

    function isConnected(node1, node2){
        var connected = false;
        var intermediate = false;
        var vector = node2.getOriginalPosition().clone().sub(node1.getOriginalPosition()).normalize();
        _.each(node1.beams, function(beam){
            if (connected) return;
            var otherNode = beam.getOtherNode(node1);
            if (otherNode == node2) connected = true;
            else {
                var otherVector = otherNode.getOriginalPosition().clone().sub(node1.getOriginalPosition()).normalize();
                if (otherVector.clone().sub(vector).length()<0.001) intermediate = otherNode;
            }
        });
        if (connected) return true;
        if (intermediate) return isConnected(intermediate, node2);
        return false;
    }

    function findCorner(node, dir, nextDir){
        var corner;
        _.each(node.beams, function(beam){
            if (corner) return;
            var otherNode = beam.getOtherNode(node);
            var direction = otherNode.getOriginalPosition().clone().sub(node.getOriginalPosition()).normalize();
            if (direction.clone().sub(dir).length()<0.001) {
                _.each(otherNode.beams, function(otherBeam){
                    if (corner) return;
                    var otherOtherNode = otherBeam.getOtherNode(otherNode);
                    var otherDirection = otherOtherNode.getOriginalPosition().clone().sub(otherNode.getOriginalPosition()).normalize();
                    if (otherDirection.clone().sub(nextDir).length()<0.001) {
                        corner = otherNode;
                    }
                });
                if (corner) return;
                corner = findCorner(otherNode, dir, nextDir);
            }
        });
        return corner;
    }

    function findLoop(minVect){
        var min;
        var nodes = globals.schematic.getNodes();
        _.each(nodes, function(node){
            if (node.getOriginalPosition().clone().sub(minVect).length()<0.001) min = node;
        });

        var maxMin = findCorner(min, new THREE.Vector3(-1,0,0), new THREE.Vector3(0,0,-1));
        if (!maxMin) return null;
        var max = findCorner(maxMin, new THREE.Vector3(0,0,-1), new THREE.Vector3(1,0,0));
        if (!max) return null;
        var minMax = findCorner(max, new THREE.Vector3(1,0,0), new THREE.Vector3(0,0,1));
        if (!minMax) return null;
        var min = findCorner(minMax, new THREE.Vector3(0,0,1), new THREE.Vector3(-1,0,0));
        if (!min) return null;

        if (checkCompleteLoop(min.getOriginalPosition(), max.getOriginalPosition(), minMax.getOriginalPosition(), maxMin.getOriginalPosition())){
            return {minVect:min.getOriginalPosition(), maxVect:max.getOriginalPosition()};
        }
        return null;
    }

    function checkCompleteLoop(minVect, maxVect, minMaxVect, maxMinVect){

        var min;
        var max;
        var minMax;
        var maxMin;

        var nodes = globals.schematic.getNodes();
        _.each(nodes, function(node){
            if (node.getOriginalPosition().clone().sub(minVect).length()<0.001) min = node;
            else if (node.getOriginalPosition().clone().sub(maxVect).length()<0.001) max = node;
            else if (node.getOriginalPosition().clone().sub(minMaxVect).length()<0.001) minMax = node;
            else if (node.getOriginalPosition().clone().sub(maxMinVect).length()<0.001) maxMin = node;
        });

        if (!min || !max || !minMax || !maxMin) return false;

        var connected = isConnected(min, minMax);
        if (!connected) return false;
        connected = isConnected(minMax, max);
        if (!connected) return false;
        connected = isConnected(max, maxMin);
        if (!connected) return false;
        connected = isConnected(maxMin, min);
        if (!connected) return false;
        return true;
    }

    return {
        setVisiblitiy: setVisiblitiy,
        setPosition: setPosition,
        setScale: setScale,
        subDivide: subDivide,
        highlight: highlight
    }
}