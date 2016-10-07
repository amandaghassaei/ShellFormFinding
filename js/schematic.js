/**
 * Created by ghassaei on 10/7/16.
 */


function initSchematic(globals){

    var edgeMaterial = new THREE.LineBasicMaterial({color:0xff0f00, linewidth:2});
    var nodeGeo = new THREE.CircleGeometry(2,20);
    nodeGeo.rotateX(Math.PI/2);
    var nodeMaterial = new THREE.MeshBasicMaterial({color:0x0000ff, side:THREE.DoubleSide});

    var nodes = calcNodes();
    var nodesObj3D = drawNodes(nodes);

    function calcNodes(){
        var xResolution = globals.xResolution;
        var zResolution = globals.zResolution;
        var xLength = globals.xLength;
        var zLength = globals.zLength;

        var _nodes = [];

        for (var i=0;i<xResolution;i++){
            for (var j=0;j<zResolution;j++){
                var x = i/xResolution*xLength-xLength/2;
                var z = j/zResolution*zLength-zLength/2;
                _nodes.push(new THREE.Vector3(x, 0, z));
            }
        }
        return _nodes;
    }

    function drawNodes(_nodes, oldNodesObj3D){
        _.each(oldNodesObj3D, function(object){
            globals.threeView.sceneRemove(object);
        });
        var _nodesObj3D = [];
        _.each(_nodes, function(node){
            var mesh = new THREE.Mesh(nodeGeo, nodeMaterial);
            mesh.position.set(node.x, node.y, node.z);
            _nodesObj3D.push(mesh);
            globals.threeView.sceneAdd(mesh);
        });
        globals.threeView.render();
        return _nodesObj3D;
    }



    function update(){

    }


    return {
        update:update
    }
}