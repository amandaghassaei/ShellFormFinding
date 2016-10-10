/**
 * Created by ghassaei on 10/9/16.
 */


function initStaticModel(globals){

    var object3D = new THREE.Object3D();
    globals.threeView.sceneAdd(object3D);
    setVisibility(globals.staticSimVisible);

    var schematic = globals.schematic;

    var geo = schematic.cloneGeo(object3D);
    var nodes = geo.nodes;
    _.each(nodes, function(node){
        node.hide();
    });
    var edges = geo.edges;
    _.each(edges, function(edge){
        edge.setThreeMaterial(new THREE.LineDashedMaterial({color:0x222222, linewidth: 3, gapSize:0.4, dashSize:0.4}));
        edge.type = "staticBeam";
    });

    var arraysData = resetArrays();
    var indicesMapping = arraysData.indicesMapping;
    var C = arraysData.C;
    var Cf = arraysData.Cf;
    var Q = arraysData.Q;
    var Yf = arraysData.Yf;
    var Fy = arraysData.Fy;

    var Ctranspose = numeric.transpose(C);
    var Cftranspose = numeric.transpose(Cf);

    var Ctrans_Q = numeric.dot(Ctranspose, Q);
    var Ctrans_Q_C = numeric.dot(Ctrans_Q, C);
    var Ctrans_Q_Cf = numeric.dot(Ctrans_Q, Cf);
    var Ctrans_Q_Cf_Yf = numeric.dot(Ctrans_Q_Cf, Yf);

    solve();

    var edgeLengths = [];

    function setViewMode(mode){
        if (mode == "material"){
            for (var i = 0; i < edges.length; i++) {
                edges[i].setMaterialColor();
            }
        } else if (mode == "length"){
            edgeLengths = [];
            if (globals.viewMode == "length"){
                for (var i=0;i<edges.length;i++){
                    edgeLengths.push(edges[i].getLength());
                }
            }
            if (!globals.dynamicSimVisible) setEdgeColors();
        } else if (mode == "none"){
            for (var i = 0; i < edges.length; i++) {
                edges[i].setColor(0x222222);
            }
        }
    }

    function setEdgeColors(min, max){
        if (min === undefined) min = _.min(edgeLengths);
        if (max === undefined) max = _.max(edgeLengths);
        for (var i=0;i<edges.length;i++){
            edges[i].setHSLColor(edgeLengths[i], min, max);
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

    function resetQArray(){
        var _Q = initEmptyArray(edges.length, edges.length);
        for (var i=0;i<edges.length;i++) {
            _Q[i][i] = edges[i].getForceDensity();
        }
        Q = _Q;
        Ctrans_Q = numeric.dot(Ctranspose, Q);
        Ctrans_Q_C = numeric.dot(Ctrans_Q, C);
        Ctrans_Q_Cf = numeric.dot(Ctrans_Q, Cf);
        Ctrans_Q_Cf_Yf = numeric.dot(Ctrans_Q_Cf, Yf);
        solve();
    }

    function resetForceArray(){
        var _Fy = initEmptyArray(nodes.length);
        for (var i=0;i<indicesMapping.length;i++){
            _Fy[i] = nodes[indicesMapping[i]].getExternalForce().y;
        }
        Fy = _Fy;
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
        var _Fy = initEmptyArray(nodes.length);
        var _Yf = initEmptyArray(_fixedIndicesMapping.length);

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
            _Fy[i] = nodes[_indicesMapping[i]].getExternalForce().y;
        }
        for (var i=0;i<_fixedIndicesMapping.length;i++){
            _Yf[i] = nodes[_fixedIndicesMapping[i]].getOriginalPosition().y;
        }

        return {
            C: _C,
            Cf: _Cf,
            Q: _Q,
            Fy: _Fy,
            Yf: _Yf,
            indicesMapping: _indicesMapping,
            fixedIndicesMapping: _fixedIndicesMapping
        }
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
        var Y = numeric.solve(Ctrans_Q_C, numeric.sub(Fy, Ctrans_Q_Cf_Yf));
        render(Y);
    }

    function render(yVals){
        for (var i=0;i<yVals.length;i++){
            var nodePosition = new THREE.Vector3(0,yVals[i]*10,0);
            nodes[indicesMapping[i]].render(nodePosition, true);
        }
    }

    function setVisibility(visible){
        object3D.visible = visible;
    }

    function getChildren(){
        return object3D.children;
    }

    function getEdgeLengths(){
        return edgeLengths.slice();
    }

    return {
        setVisibility: setVisibility,
        updateMaterialAssignments: updateMaterialAssignments,
        setViewMode: setViewMode,
        resetQArray: resetQArray,
        getChildren: getChildren,
        getEdgeLengths: getEdgeLengths,
        setEdgeColors: setEdgeColors,
        resetForceArray: resetForceArray
    }
}