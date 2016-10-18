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

    var fixed = initFixed();
    var forces = initForces();
    var geo = calcNodesAndEdges(object3D);
    var nodes = geo.nodes;
    var edges = geo.edges;
    setScale(globals.xLength, globals.zLength);
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

        var _forces = [];
        for (var i=0;i<xResolution;i++){
            for (var j=0;j<zResolution;j++){
                var force = new Force(new THREE.Vector3(0,0,0));
                object3D.add(force.getObject3D());
                _forces.push(force);
            }
        }
        return _forces;
    }

    function calcNodesAndEdges(_object3D){
        var xResolution = globals.xResolution;
        var zResolution = globals.zResolution;

        var _nodes = [];
        var _edges = [];

        for (var i=0;i<xResolution;i++){
            for (var j=0;j<zResolution;j++){
                var x = i/(xResolution-1)-1/2;
                var z = j/(zResolution-1)-1/2;
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

    function cloneGeo(){
        var _nodes = [];
        _.each(nodes, function(node){
            _nodes.push(node.clone());
        });
        var _edges = [];
        _.each(edges, function(edge){
            var node1Index = edge.nodes[0].getIndex();
            var node2Index = edge.nodes[1].getIndex();
            _edges.push(new Beam([_nodes[node1Index], _nodes[node2Index]], edge.getMaterial()));
        });
        return {
            nodes: _nodes,
            edges: _edges
        }
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

    function setScale(xLength, zLength){
        baseplane.scale.set(xLength, 1, zLength);
        _.each(nodes, function(node){
            node.updateOriginalPosition(xLength, zLength);
            node.render(new THREE.Vector3(0,0,0));
        });
        _.each(edges, function(edge){
            edge.render();
        });
        if(globals.dynamicModel) globals.dynamicModel.setScale(xLength, zLength);
        if(globals.staticModel) globals.staticModel.setScale(xLength, zLength);
        if(globals.applySelfWeight) setSelfWeight();
    }

    function subDivide(subDivEdges, subDivNodes, existingNodes){
        //min, max, maxmin, minmax
        var _nodes = [];
        _.each(subDivEdges, function(edge){
            _nodes.push(splitEdge(edge));
        });

        var middlePosition = subDivNodes[0].getOriginalPosition().clone().add(subDivNodes[1].getOriginalPosition()).multiplyScalar(0.5);
        //todo divide by scale
        var node = new Node(middlePosition, nodes.length);
        object3D.add(node.getObject3D());
        nodes.push(node);
        var force = new Force(new THREE.Vector3(0,0,0));
        object3D.add(force.getObject3D());
        node.addExternalForce(force);
        forces.push(force);
        connectNodes(node, _nodes);
        if (existingNodes) connectNodes(node, existingNodes);
        globals.resetSimFromInitialState();
        globals.dynamicModel.copyNodesAndEdges();
        globals.staticModel.copyNodesAndEdges();
        setSelfWeight();
    }

    function splitEdge(edge){
        var _nodes = edge.nodes;
        var material = edge.getMaterial();
        deleteEdge(edge);
        var position1 = _nodes[0].getOriginalPosition();
        var position2 = _nodes[1].getOriginalPosition();
        var position = position1.clone().add(position2).multiplyScalar(0.5);
        //todo divide by scale
        var node = new Node(position, nodes.length);
        object3D.add(node.getObject3D());
        nodes.push(node);
        var force = new Force(new THREE.Vector3(0,0,0));
        object3D.add(force.getObject3D());
        node.addExternalForce(force);
        forces.push(force);
        connectNodes(node, _nodes, material);
        return node;
    }

    function connectNodes(node, _nodes, material){
        _.each(_nodes, function(_node){
            var edge = new Beam([node, _node], material || globals.materials[globals.currentMaterial]);
            edges.push(edge);
            object3D.add(edge.getObject3D());
        });
    }

    function deleteEdge(edge){
        object3D.remove(edge.object3D);
        edge.destroy();
        edges.splice(edges.indexOf(edge), 1);
    }

    return {
        cloneGeo:cloneGeo,
        getChildren:getChildren,
        getFixed: getFixed,
        setFixed: setFixed,
        getNodes: getNodes,
        getEdges: getEdges,
        setSelfWeight: setSelfWeight,
        subDivide: subDivide,
        setScale: setScale
    }
}