/**
 * Created by ghassaei on 10/7/16.
 */


function initSchematic(globals){

    var object3D = new THREE.Object3D();
    object3D.position.y = globals.planeHeight;
    globals.threeView.sceneAdd(object3D);

    //var edgeMaterial = new THREE.LineBasicMaterial({color:0xff0f00, linewidth:2});

    
    
    
    
    var fixed = initFixed();
    var forces = initForces(fixed);
    var geo = calcNodesAndEdges(object3D);
    var nodes = geo.nodes;
    var edges = geo.edges;//todo need this?
    
    function initFixed(){
        var xResolution = globals.xResolution;
        var zResolution = globals.zResolution;
        var _fixed = [];
        for (var i=0;i<xResolution;i++){
            _fixed.push([]);
            for (var j=0;j<zResolution;j++){
                if ((i==j && i==0) ||
                    (i==xResolution-1 && j==0) ||
                    (j==zResolution-1 && i==0) ||
                    (i==xResolution-1 && j==zResolution-1)) _fixed[i].push(true);
                else _fixed[i].push(false);
            }
        }
        return _fixed;
    }

    function initForces(_fixed){
        var xResolution = globals.xResolution;
        var zResolution = globals.zResolution;
        var xLength = globals.xLength;
        var zLength = globals.zLength;

        var _forces = [];
        for (var i=0;i<xResolution;i++){
            _forces.push([]);
            for (var j=0;j<zResolution;j++){
                var x = i/(xResolution-1)*xLength-xLength/2;
                var z = j/(zResolution-1)*zLength-zLength/2;
                var force = new Force(new THREE.Vector3(0,5,0), new THREE.Vector3(x, 0, z));
                object3D.add(force.getObject3D());
                if (_fixed[i][j]) force.hide();
                _forces[i].push(force);
            }
        }
        return _forces;
    }

    function calcNodesAndEdges(_object3D){
        var xResolution = globals.xResolution;
        var zResolution = globals.zResolution;
        var xLength = globals.xLength;
        var zLength = globals.zLength;

        var _nodes = [];
        var _edges = [];

        for (var i=0;i<xResolution;i++){
            for (var j=0;j<zResolution;j++){
                var x = i/(xResolution-1)*xLength-xLength/2;
                var z = j/(zResolution-1)*zLength-zLength/2;
                var index = zResolution*i+j;
                var node = new Node(new THREE.Vector3(x, 0, z), index);
                node.addExternalForce(forces[i][j]);
                if (fixed[i][j]) node.setFixed(true);

                if (j>0){
                    var minusJNode = _nodes[index-1];
                    var edge = new Beam([node, minusJNode]);
                    _edges.push(edge);
                    _object3D.add(edge.getObject3D());
                }
                if (i>0){
                    var minusINode = _nodes[index-zResolution];
                    var edge = new Beam([node, minusINode]);
                    _edges.push(edge);
                    _object3D.add(edge.getObject3D());
                }

                _nodes.push(node);
                _object3D.add(node.getObject3D());
            }
        }
        return {
            nodes: _nodes,
            edges: _edges
        };
    }

    function cloneGeo(_object3D){
        return calcNodesAndEdges(_object3D);
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
        update:update,
        cloneGeo:cloneGeo
    }
}