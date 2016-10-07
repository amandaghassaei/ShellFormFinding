/**
 * Created by ghassaei on 10/7/16.
 */


function initSchematic(globals){

    var object3D = new THREE.Object3D();
    object3D.position.y = globals.planeHeight;
    globals.threeView.sceneAdd(object3D);

    //var edgeMaterial = new THREE.LineBasicMaterial({color:0xff0f00, linewidth:2});

    var nodes = calcNodes();
    var edges = [];

    globals.threeView.render();

    function calcNodes(){
        var xResolution = globals.xResolution;
        var zResolution = globals.zResolution;
        var xLength = globals.xLength;
        var zLength = globals.zLength;

        var _nodes = [];
        var _edges = [];

        for (var i=0;i<xResolution;i++){
            for (var j=0;j<zResolution;j++){
                var x = i/xResolution*xLength-xLength/2;
                var z = j/zResolution*zLength-zLength/2;
                var index = zResolution*i+j;
                var node = new Node(new THREE.Vector3(x, 0, z), index);

                if (j>0){
                    var minusJNode = _nodes[index-1];
                    var edge = new Beam([node, minusJNode]);
                    _edges.push(edge);
                    object3D.add(edge.getObject3D());
                }
                if (i>0){
                    var minusINode = _nodes[index-zResolution];
                    var edge = new Beam([node, minusINode]);
                    _edges.push(edge);
                    object3D.add(edge.getObject3D());
                }

                _nodes.push(node);
                object3D.add(node.getObject3D());
            }
        }
        return _nodes;
    }

    function reset(){
        object3D.children = [];
        _.each(nodes, function(node){
            node.destroy();
        });
        nodes = [];
        _.each(edges, function(edge){
            edge.destroy();
        });
        edges = [];
    }



    function update(){

    }


    return {
        update:update
    }
}