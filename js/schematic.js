/**
 * Created by ghassaei on 10/7/16.
 */


function initSchematic(globals){

    var object3D = new THREE.Object3D();
    object3D.position.y = globals.planeHeight;
    globals.threeView.sceneAdd(object3D);

    var baseplane = new THREE.Mesh(new THREE.BoxGeometry(1, 0.01, 1), new THREE.MeshBasicMaterial({color: 0xffffff, transparent:true, opacity:0.75}));
    baseplane.position.y = -0.015;
    globals.threeView.sceneAdd(baseplane);
    baseplane.scale.set(globals.xLength, 1, globals.zLength);

    var fixed = initFixed();
    var forces = initForces();
    var geo = calcNodesAndEdges(object3D);
    var nodes = geo.nodes;
    var edges = geo.edges;
    setSelfWeight();

    function setSelfWeight(){
        for (var i=0;i<nodes.length;i++){
            var node = nodes[i];
            if (globals.applySelfWeight) forces[i].setSelfWeight(node.getSelfWeight());
            else forces[i].setSelfWeight(new THREE.Vector3(0,0,0));
        }
        globals.forceArrayUpdated();
    }

    
    function initFixed(){
        var xResolution = globals.xResolution;
        var zResolution = globals.zResolution;
        var _fixed = [];
        for (var i=0;i<xResolution;i++){
            for (var j=0;j<zResolution;j++){
                if ((i==j && i==0) ||
                    (i==xResolution-1 && j==0) ||
                    (j==zResolution-1 && i==0) ||
                    (i==xResolution-1 && j==zResolution-1)) _fixed.push(true);
                else _fixed.push(false);
            }
        }
        return _fixed;
    }

    function setFixed(index, state){
        fixed[index] = state;
    }

    function initForces(){
        var xResolution = globals.xResolution;
        var zResolution = globals.zResolution;
        var xLength = globals.xLength;
        var zLength = globals.zLength;

        var _forces = [];
        for (var i=0;i<xResolution;i++){
            for (var j=0;j<zResolution;j++){
                var x = i/(xResolution-1)*xLength-xLength/2;
                var z = j/(zResolution-1)*zLength-zLength/2;
                var force = new Force(new THREE.Vector3(0,0,0), new THREE.Vector3(x, 0, z));
                object3D.add(force.getObject3D());
                _forces.push(force);
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
                if (fixed[index]) node.setFixed(true);
                node.addExternalForce(forces[index]);

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

    function getChildren(){
        return object3D.children;
    }

    function getFixed(){
        return fixed;
    }

    function getNodes(){
        return nodes;
    }

    function getEdges(){
        return edges;
    }

    function update(){
        var xResolution = globals.xResolution;
        var zResolution = globals.zResolution;
        var xLength = globals.xLength;
        var zLength = globals.zLength;
        baseplane.scale.set(xLength, 1, zLength);

    }

    return {
        cloneGeo:cloneGeo,
        getChildren:getChildren,
        getFixed: getFixed,
        setFixed: setFixed,
        //getNodes: getNodes,
        getEdges: getEdges,
        setSelfWeight: setSelfWeight
    }
}