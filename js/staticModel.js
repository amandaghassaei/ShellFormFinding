/**
 * Created by ghassaei on 10/9/16.
 */


function initStaticModel(globals){

    var object3D = new THREE.Object3D();
    globals.threeView.sceneAdd(object3D);
    setVisibility(globals.staticSimVisible);

    var schematic = globals.schematic;

    var nodes;
    var edges;

    function setSolid(isSolid){
        //if (isSolid) dashedMaterial.gapSize = 0.1;
        //else dashedMaterial.gapSize = 0.1;
    }

    function copyNodesAndEdges(){
        object3D.children = [];
        if (nodes){
            _.each(nodes, function(node){
                node.destroy();
            });
        }
        if (edges){
            _.each(edges, function(edge){
                edge.destroy();
            });
        }

        var geo = schematic.cloneGeo(object3D);
        nodes = geo.nodes;
        _.each(nodes, function(node){
            //object3D.add(node.getObject3D());
            node.hide();
        });
        edges = geo.edges;
        _.each(edges, function(edge){
            object3D.add(edge.getObject3D());
            edge.setThreeMaterial(new THREE.LineDashedMaterial({color:0x222222, linewidth: 3, gapSize:0.1, dashSize:0.6}));
            edge.type = "staticBeam";
        });
        resetArrays();
        solve();
    }

    var indicesMapping;
    var fixedIndicesMapping;
    var C;
    var Cf;
    var Q;
    var Xf;
    var F;
    var Ctranspose;
    var Ctrans_Q;
    var Ctrans_Q_C;
    var inv_Ctrans_Q_C;
    var Ctrans_Q_Cf;
    var Ctrans_Q_Cf_Xf;

    var edgeLengths = [];
    var edgeForces = [];

    copyNodesAndEdges();

    function setViewMode(mode){
        if (mode == "material"){
            for (var i = 0; i < edges.length; i++) {
                edges[i].setMaterialColor();
            }
        } else if (mode == "length"){
            calcEdgeLengths();
        } else if (mode == "force") {
            calcEdgeForces();
        } else if (mode == "none"){
            for (var i = 0; i < edges.length; i++) {
                edges[i].setColor(0x222222);
            }
        }
    }

    function calcEdgeForces(){
        var _edgeForces = [];
        for (var i=0;i<edges.length;i++){
            _edgeForces.push(edges[i].getForce());
        }
        edgeForces = _edgeForces;
        if (!globals.dynamicSimVisible) setEdgeColors();
    }

    function calcEdgeLengths(){
        var _edgeLengths = [];
        for (var i=0;i<edges.length;i++){
            _edgeLengths.push(edges[i].getLength());
        }
        edgeLengths = _edgeLengths;
        if (!globals.dynamicSimVisible) setEdgeColors();
    }

    function setEdgeColors(min, max){
        var data;
        if (globals.viewMode == "length") data = edgeLengths;
        else if (globals.viewMode == "force") data = edgeForces;
        else return;
        if (min === undefined) min = _.min(_.compact(data));
        if (max === undefined) max = _.max(_.compact(data));
        for (var i=0;i<edges.length;i++){
            edges[i].setHSLColor(data[i], min, max);
        }
        globals.controls.updateScaleBars(min, max);
    }

    function updateMaterialAssignments(){
        var _edges = globals.schematic.getEdges();
        for (var i=0;i<edges.length;i++){
            edges[i].setMaterial(_edges[i].beamMaterial, true);
        }
        if (globals.viewMode == "material") setViewMode("material");
    }

    function updateFixed(){
        var _fixed = globals.schematic.getFixed();
        for (var i=0;i<nodes.length;i++){
            nodes[i].fixed = _fixed[i];
        }
        resetArrays();
        solve()
    }

    function resetQArray(){
        var _Q = initEmptyArray(edges.length, edges.length);
        for (var i=0;i<edges.length;i++) {
            _Q[i][i] = edges[i].getForceDensity();
        }
        Q = _Q;
        Ctrans_Q = numeric.dot(Ctranspose, Q);
        Ctrans_Q_C = numeric.dot(Ctrans_Q, C);
        inv_Ctrans_Q_C = numeric.inv(Ctrans_Q_C);
        Ctrans_Q_Cf = numeric.dot(Ctrans_Q, Cf);
        Ctrans_Q_Cf_Xf = numeric.dot(Ctrans_Q_Cf, Xf);
        solve();
    }

    function resetForceArray(){
        var _F = initEmptyArray(indicesMapping.length);
        for (var i=0;i<indicesMapping.length;i++){
            var force = nodes[indicesMapping[i]].getExternalForce();
            _F[i] = [force.x, force.y, force.z];
        }
        F = _F;
        solve();
    }

    function resetArrays(){
        var _indicesMapping = [];
        var _fixedIndicesMapping = [];

        for (var i=0;i<nodes.length;i++){
            if (nodes[i].fixed) _fixedIndicesMapping.push(nodes[i].getIndex());
            else _indicesMapping.push(nodes[i].getIndex());
        }

        var _C = initEmptyArray(edges.length, _indicesMapping.length);
        var _Cf = initEmptyArray(edges.length, _fixedIndicesMapping.length);
        var _Q = initEmptyArray(edges.length, edges.length);
        var _F = initEmptyArray(_indicesMapping.length);
        var _Xf = initEmptyArray(_fixedIndicesMapping.length);

        for (var i=0;i<edges.length;i++){
            var edge = edges[i];
            var _nodes = edge.nodes;
            if (_nodes[0].fixed) _Cf[i][_fixedIndicesMapping.indexOf(_nodes[0].getIndex())] = 1;
            else _C[i][_indicesMapping.indexOf(_nodes[0].getIndex())] = 1;
            if (_nodes[1].fixed) _Cf[i][_fixedIndicesMapping.indexOf(_nodes[1].getIndex())] = -1;
            else _C[i][_indicesMapping.indexOf(_nodes[1].getIndex())] = -1;
            _Q[i][i] = edge.getForceDensity();
        }

        for (var i=0;i<_indicesMapping.length;i++){
            var force = nodes[_indicesMapping[i]].getExternalForce();
            _F[i] = [force.x, force.y, force.z];
        }
        for (var i=0;i<_fixedIndicesMapping.length;i++){
            var position = nodes[_fixedIndicesMapping[i]].getOriginalPosition();
            _Xf[i] = [position.x, position.y, position.z];
        }

        indicesMapping = _indicesMapping;
        fixedIndicesMapping = _fixedIndicesMapping;
        C = _C;
        Cf = _Cf;
        Q = _Q;
        Xf = _Xf;
        F = _F;

        Ctranspose = numeric.transpose(C);
        Ctrans_Q = numeric.dot(Ctranspose, Q);
        Ctrans_Q_C = numeric.dot(Ctrans_Q, C);
        inv_Ctrans_Q_C = numeric.inv(Ctrans_Q_C);
        Ctrans_Q_Cf = numeric.dot(Ctrans_Q, Cf);
        Ctrans_Q_Cf_Xf = numeric.dot(Ctrans_Q_Cf, Xf);
    }

    function updateFixedScale(){
        var _Xf = initEmptyArray(fixedIndicesMapping.length);
        for (var i=0;i<fixedIndicesMapping.length;i++){
            var position = nodes[fixedIndicesMapping[i]].getOriginalPosition();
            _Xf[i] = [position.x, position.y, position.z];
        }
        Xf = _Xf;
        Ctrans_Q_Cf_Xf = numeric.dot(Ctrans_Q_Cf, Xf);
        solve();
    }

    function initEmptyArray(dim1, dim2, dim3){
        if (dim2 === undefined) dim2 = 0;
        if (dim3 === undefined) dim3 = 0;
        var array = [];
        for (var i=0;i<dim1;i++){
            if (dim2 == 0) array.push(0);
            else array.push([]);
            for (var j=0;j<dim2;j++){
                if (dim3 == 0) array[i].push(0);
                else array[i].push([]);
                for (var k=0;k<dim3;k++){
                    array[i][j].push(0);
                }
            }
        }
        return array;
    }

    function solve(){
        if (fixedIndicesMapping.length == 0){//no boundary conditions
            var X = initEmptyArray(nodes.length, 3);
            render(X);
            console.warn("no boundary conditions");
            return;
        }
        var X = numeric.dot(inv_Ctrans_Q_C, numeric.sub(F, Ctrans_Q_Cf_Xf));
        render(X);
    }

    function render(X){
        for (var i=0;i<X.length;i++){
            var nodePosition = new THREE.Vector3(X[i][0],X[i][1],X[i][2]);
            var node = nodes[indicesMapping[i]];
            node.render(nodePosition.sub(node.getOriginalPosition()));
        }
        for (var i=0;i<fixedIndicesMapping.length;i++){
            nodes[fixedIndicesMapping[i]].render(new THREE.Vector3(0,0,0));
        }
        for (var i=0;i<edges.length;i++){
            edges[i].render(true);
        }
        calcEdgeLengths();
        calcEdgeForces();
        var sumFL = 0;
        for (var i=0;i<edgeForces.length;i++){
            sumFL += Math.abs(edgeForces[i]*edgeLengths[i]);
        }
        $("#FL").html(sumFL.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","));

        if (globals.viewMode == "material"){
            for (var i = 0; i < edges.length; i++) {
                edges[i].setMaterialColor();
            }
        }
    }

    function setScale(xLength, zLength){
        _.each(nodes, function(node){
            node.updateOriginalPosition(xLength, zLength);
        });
        updateFixedScale();
    }

    function setVisibility(visible){
        object3D.visible = visible;
        setSolid(!globals.dynamicSimVisible);
    }

    function getChildren(){
        return object3D.children;
    }

    function getEdgeLengths(){
        return edgeLengths.slice();
    }

    function getEdgeForces(){
        return edgeForces.slice();
    }

    function getInfo(){
        var data = {};
        data.numNodes = nodes.length;
        data.nodes = [];
        data.externalForces = [];
        _.each(nodes, function(node){
            var position = node.getPosition().clone();
            var externalForce = node.getExternalForce();
            data.nodes.push([position.x, position.y, position.z]);
            data.externalForces.push([externalForce.x, externalForce.y, externalForce.z]);
        });

        data.numFixedNodes = fixedIndicesMapping.length;
        data.fixedNodesIndices = [];
        _.each(fixedIndicesMapping, function(index){
            data.fixedNodesIndices.push(index);
        });

        data.numEdges = edges.length;
        data.edges = [];
        data.edgeQs = [];
        data.edgeLengths = [];
        _.each(edges, function(edge){
            data.edges.push([edge.nodes[0].getIndex(), edge.nodes[1].getIndex()]);
            data.edgeQs.push(edge.getForceDensity());
            data.edgeLengths.push(edge.getLength());
        });

        return JSON.stringify(data, null, 2);
    }

    function getNodes(){
        return nodes;
    }

    function getEdges(){
        return edges;
    }

    return {
        setVisibility: setVisibility,
        updateMaterialAssignments: updateMaterialAssignments,
        setViewMode: setViewMode,
        resetQArray: resetQArray,
        getChildren: getChildren,
        getEdgeLengths: getEdgeLengths,
        getEdgeForces: getEdgeForces,
        setEdgeColors: setEdgeColors,
        resetForceArray: resetForceArray,
        updateFixed: updateFixed,
        copyNodesAndEdges: copyNodesAndEdges,
        setScale: setScale,
        getInfo: getInfo,
        setSolid: setSolid,

        getNodes: getNodes,
        getEdges: getEdges
    }
}