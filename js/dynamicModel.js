/**
 * Created by ghassaei on 10/7/16.
 */

function initDynamicModel(globals){

    var object3D = new THREE.Object3D();
    globals.threeView.sceneAdd(object3D);

    var schematic = globals.schematic;

    var nodes;
    var edges;

    function copyNodesAndEdges(isSubdivide){
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
            object3D.add(node.getObject3D());
            node.hide();
        });
        edges = geo.edges;
        _.each(edges, function(edge){
            //edge.setColor(0x8cbaed);
            object3D.add(edge.getObject3D());
            edge.setColor(0x222222);
            edge.type = "dynamicBeam";
        });
        initTypedArrays(isSubdivide);
        if (programsInited) {
            updateTextures(globals.gpuMath, isSubdivide);
            steps = parseInt(setSolveParams());
        }
        setViewMode(globals.viewMode);
    }

    var originalPosition;
    var position;
    var lastPosition;
    var velocity;
    var lastVelocity;
    var externalForces;
    var mass;
    var meta;
    var beamK;
    var beamD;

    var steps;
    var programsInited = false;//flag for initial setup

    var textureDim = 0;

    copyNodesAndEdges();
    initTexturesAndPrograms(globals.gpuMath);
    steps = parseInt(setSolveParams());
    runSolver();

    function averageSubdivide(){
        globals.gpuMath.step("averageSubdivide", ["u_lastPosition", "u_originalPosition", "u_meta", "u_mass"], "u_position");
        globals.gpuMath.swapTextures("u_position", "u_lastPosition");
        globals.gpuMath.step("averageSubdivide", ["u_lastPosition", "u_originalPosition", "u_meta", "u_mass"], "u_position");
        globals.gpuMath.swapTextures("u_position", "u_lastPosition");
    }

    function reset(){
        globals.gpuMath.step("zeroTexture", [], "u_position");
        globals.gpuMath.step("zeroTexture", [], "u_lastPosition");
        globals.gpuMath.step("zeroTexture", [], "u_velocity");
        globals.gpuMath.step("zeroTexture", [], "u_lastVelocity");
    }

    function runSolver(){
        globals.threeView.startAnimation(function(){
            if (!globals.dynamicSimVisible) return;
            for (var j=0;j<steps;j++){
                solveStep();
            }
            render();
        });
    }

    function setVisibility(state){
        object3D.visible = state;
    }

    function solveStep(){

        if (globals.forceHasChanged){
            updateExternalForces();
            globals.forceHasChanged = false;
        }
        if (globals.fixedHasChanged){
            updateFixed();
            globals.fixedHasChanged = false;
        }
        if (globals.dynamicSimMaterialsChanged){
            updateMaterials();
            globals.dynamicSimMaterialsChanged = false;
        }
        if (globals.shouldResetDynamicSim){
            reset();
            globals.shouldResetDynamicSim = false;
        }

        var gpuMath = globals.gpuMath;

        gpuMath.step("velocityCalc", ["u_lastPosition", "u_lastVelocity", "u_originalPosition", "u_externalForces",
            "u_mass", "u_meta", "u_beamK", "u_beamD"], "u_velocity");
        gpuMath.step("positionCalc", ["u_velocity", "u_lastPosition", "u_mass"], "u_position");

        gpuMath.swapTextures("u_velocity", "u_lastVelocity");
        gpuMath.swapTextures("u_position", "u_lastPosition");
    }

    function render(){

        var vectorLength = 3;
        globals.gpuMath.setProgram("packToBytes");
        globals.gpuMath.setUniformForProgram("packToBytes", "u_vectorLength", vectorLength, "1f");
        globals.gpuMath.setSize(textureDim*vectorLength, textureDim);
        globals.gpuMath.step("packToBytes", ["u_position"], "outputBytes");

        var pixels = new Uint8Array(textureDim*textureDim*4*vectorLength);
        if (globals.gpuMath.readyToRead()) {
            var numPixels = nodes.length*vectorLength;
            var height = Math.ceil(numPixels/(textureDim*vectorLength));
            globals.gpuMath.readPixels(0, 0, textureDim * vectorLength, height, pixels);
            var parsedPixels = new Float32Array(pixels.buffer);
            for (var i = 0; i < nodes.length; i++) {
                var rgbaIndex = i * vectorLength;
                var nodePosition = new THREE.Vector3(parsedPixels[rgbaIndex], parsedPixels[rgbaIndex + 1], parsedPixels[rgbaIndex + 2]);
                nodes[i].render(nodePosition);
            }
            for (var i=0;i<edges.length;i++){
                edges[i].render();
            }
            //todo do this in shader ?
            if (globals.viewMode == "none") {
                if (globals.viewModeNeedsUpdate) {
                    for (var i = 0; i < edges.length; i++) {
                        edges[i].setColor(0x222222);
                    }
                    globals.viewModeNeedsUpdate = false;
                }
            } else if (globals.viewMode == "material"){
                //edges should already be set
            } else {
                var vals = [];
                var allVals;
                if (globals.viewMode == "length"){
                    for (var i=0;i<edges.length;i++){
                        vals.push(edges[i].getLength());
                    }
                    allVals = vals;
                    if (globals.staticSimVisible) allVals = vals.concat(globals.staticModel.getEdgeLengths());
                }
                if (globals.viewMode == "force"){
                    for (var i=0;i<edges.length;i++){
                        vals.push(edges[i].getForce());
                    }
                    allVals = vals;
                    if (globals.staticSimVisible) allVals = vals.concat(globals.staticModel.getEdgeForces());
                }

                var min = _.min(_.compact(allVals));
                var max = _.max(_.compact(allVals));
                globals.staticModel.setEdgeColors(min, max);
                for (var i=0;i<edges.length;i++){
                    edges[i].setHSLColor(vals[i], min, max);
                }
                globals.controls.updateScaleBars(min, max);
            }
        }

        globals.threeView.render();
        globals.gpuMath.setSize(textureDim, textureDim);
    }

    function setViewMode(mode){
        if (mode == "material"){
            _.each(edges, function(edge){
                edge.setMaterialColor();
            })
        }
    }

    function setSolveParams(){
        var dt = calcDt();
        var numSteps = 0.5/dt;
        globals.gpuMath.setProgram("velocityCalc");
        globals.gpuMath.setUniformForProgram("velocityCalc", "u_dt", dt, "1f");
        globals.gpuMath.setProgram("positionCalc");
        globals.gpuMath.setUniformForProgram("positionCalc", "u_dt", dt, "1f");
        return numSteps;
    }

    function calcDt(){
        var maxFreqNat = 0;
        _.each(edges, function(beam){
            if (beam.getNaturalFrequency()>maxFreqNat) maxFreqNat = beam.getNaturalFrequency();
        });
        return (1/(2*Math.PI*maxFreqNat))*0.5;//half of max delta t for good measure
    }

    function updateTextures(gpuMath, isSubdivide){
        gpuMath.initTextureFromData("u_originalPosition", textureDim, textureDim, "FLOAT", originalPosition, true);
        gpuMath.initTextureFromData("u_meta", textureDim, textureDim, "FLOAT", meta, true);
        if (isSubdivide) averageSubdivide();
        else reset();
    }

    function initTexturesAndPrograms(gpuMath){

        textureDim = calcTextureSize(nodes.length);

        var vertexShader = document.getElementById("vertexShader").text;

        gpuMath.initTextureFromData("u_position", textureDim, textureDim, "FLOAT", position);
        gpuMath.initFrameBufferForTexture("u_position");
        gpuMath.initTextureFromData("u_lastPosition", textureDim, textureDim, "FLOAT", lastPosition);
        gpuMath.initFrameBufferForTexture("u_lastPosition");
        gpuMath.initTextureFromData("u_velocity", textureDim, textureDim, "FLOAT", velocity);
        gpuMath.initFrameBufferForTexture("u_velocity");
        gpuMath.initTextureFromData("u_lastVelocity", textureDim, textureDim, "FLOAT", lastVelocity);
        gpuMath.initFrameBufferForTexture("u_lastVelocity");

        gpuMath.initTextureFromData("u_originalPosition", textureDim, textureDim, "FLOAT", originalPosition);
        gpuMath.initTextureFromData("u_meta", textureDim, textureDim, "FLOAT", meta);

        gpuMath.createProgram("positionCalc", vertexShader, document.getElementById("positionCalcShader").text);
        gpuMath.setUniformForProgram("positionCalc", "u_velocity", 0, "1i");
        gpuMath.setUniformForProgram("positionCalc", "u_lastPosition", 1, "1i");
        gpuMath.setUniformForProgram("positionCalc", "u_mass", 2, "1i");
        gpuMath.setUniformForProgram("positionCalc", "u_textureDim", [textureDim, textureDim], "2f");

        gpuMath.createProgram("velocityCalc", vertexShader, document.getElementById("velocityCalcShader").text);
        gpuMath.setUniformForProgram("velocityCalc", "u_lastPosition", 0, "1i");
        gpuMath.setUniformForProgram("velocityCalc", "u_lastVelocity", 1, "1i");
        gpuMath.setUniformForProgram("velocityCalc", "u_originalPosition", 2, "1i");
        gpuMath.setUniformForProgram("velocityCalc", "u_externalForces", 3, "1i");
        gpuMath.setUniformForProgram("velocityCalc", "u_mass", 4, "1i");
        gpuMath.setUniformForProgram("velocityCalc", "u_meta", 5, "1i");
        gpuMath.setUniformForProgram("velocityCalc", "u_beamK", 6, "1i");
        gpuMath.setUniformForProgram("velocityCalc", "u_beamD", 7, "1i");
        gpuMath.setUniformForProgram("velocityCalc", "u_textureDim", [textureDim, textureDim], "2f");

        gpuMath.createProgram("packToBytes", vertexShader, document.getElementById("packToBytesShader").text);
        gpuMath.initTextureFromData("outputBytes", textureDim*4, textureDim, "UNSIGNED_BYTE", null);
        gpuMath.initFrameBufferForTexture("outputBytes");
        gpuMath.setUniformForProgram("packToBytes", "u_floatTextureDim", [textureDim, textureDim], "2f");

        gpuMath.createProgram("zeroTexture", vertexShader, document.getElementById("zeroTexture").text);
        gpuMath.createProgram("averageSubdivide", vertexShader, document.getElementById("averageSubdividePosition").text);
        gpuMath.setUniformForProgram("averageSubdivide", "u_lastPosition", 0, "1i");
        gpuMath.setUniformForProgram("averageSubdivide", "u_originalPosition", 1, "1i");
        gpuMath.setUniformForProgram("averageSubdivide", "u_meta", 2, "1i");
        gpuMath.setUniformForProgram("averageSubdivide", "u_mass", 3, "1i");
        gpuMath.setUniformForProgram("averageSubdivide", "u_textureDim", [textureDim, textureDim], "2f");

        gpuMath.setSize(textureDim, textureDim);

        programsInited = true;
    }

    function calcTextureSize(numNodes){
        return 50;
        if (numNodes == 1) return 2;
        for (var i=0;i<numNodes;i++){
            if (Math.pow(2, 2*i) >= numNodes){
                return Math.pow(2, i);
            }
        }
        console.warn("no texture size found for " + numCells + " cells");
        return 0;
    }

    function updateMaterials(){
        for (var i=0;i<nodes.length;i++){
            for (var j=0;j<nodes[i].beams.length;j++){
                var beam = nodes[i].beams[j];
                beamK[4*i+j] = beam.getK();
                beamD[4*i+j] = beam.getD();
            }
        }
        globals.gpuMath.initTextureFromData("u_beamK", textureDim, textureDim, "FLOAT", beamK, true);
        globals.gpuMath.initTextureFromData("u_beamD", textureDim, textureDim, "FLOAT", beamD, true);
        //recalc dt
        if (programsInited) setSolveParams();
    }

    function updateMaterialAssignments(){
        var _edges = globals.schematic.getEdges();
        for (var i=0;i<edges.length;i++){
            edges[i].setMaterial(_edges[i].beamMaterial, true);
        }
        if (globals.viewMode == "material") setViewMode("material");
    }

    function updateExternalForces(){
        for (var i=0;i<nodes.length;i++){
            var externalForce = nodes[i].getExternalForce();
            externalForces[4*i] = externalForce.x;
            externalForces[4*i+1] = externalForce.y;
            externalForces[4*i+2] = externalForce.z;
        }
        globals.gpuMath.initTextureFromData("u_externalForces", textureDim, textureDim, "FLOAT", externalForces, true);
    }

    function updateFixed(){
        var _fixed = globals.schematic.getFixed();
        var num = 0;
        for (var i=0;i<nodes.length;i++){
            mass[4*i+1] = (_fixed[i] ? 1 : 0);
            nodes[i].fixed = _fixed[i];
            if (_fixed[i]) num++;
        }
        globals.gpuMath.initTextureFromData("u_mass", textureDim, textureDim, "FLOAT", mass, true);
    }

    function updateOriginalPosition(){
        for (var i=0;i<nodes.length;i++){
            var origPosition = nodes[i].getOriginalPosition();
            originalPosition[4*i] = origPosition.x;
            originalPosition[4*i+1] = origPosition.y;
            originalPosition[4*i+2] = origPosition.z;
        }
        globals.gpuMath.initTextureFromData("u_originalPosition", textureDim, textureDim, "FLOAT", originalPosition, true);
    }

    function setScale(xLength, zLength){
        _.each(nodes, function(node){
            node.updateOriginalPosition(xLength, zLength);
        });
        updateOriginalPosition();
    }

    function initTypedArrays(isSubdivide){

        textureDim = calcTextureSize(nodes.length);

        originalPosition = new Float32Array(textureDim*textureDim*4);
        if (isSubdivide) {
        } else {
            position = new Float32Array(textureDim*textureDim*4);
            lastPosition = new Float32Array(textureDim*textureDim*4);
            velocity = new Float32Array(textureDim*textureDim*4);
            lastVelocity = new Float32Array(textureDim*textureDim*4);
        }
        externalForces = new Float32Array(textureDim*textureDim*4);
        mass = new Float32Array(textureDim*textureDim*4);
        meta = new Float32Array(textureDim*textureDim*4);
        beamK = new Float32Array(textureDim*textureDim*4);
        beamD = new Float32Array(textureDim*textureDim*4);

        for (var i=0;i<textureDim*textureDim;i++){
            mass[4*i+1] = 1;//set all fixed by default
        }

        _.each(nodes, function(node, index){
            mass[4*index] = node.getSimMass();

            meta[4*index] = -1;
            meta[4*index+1] = -1;
            meta[4*index+2] = -1;
            meta[4*index+3] = -1;
            _.each(node.beams, function(beam, i){
                meta[4*index+i] = beam.getOtherNode(node).getIndex();
            });
        });

        updateOriginalPosition();
        updateMaterials();
        updateExternalForces();
        updateFixed();
    }

    function getChildren(){
        return object3D.children;
    }

    return {
        setVisibility: setVisibility,
        getChildren: getChildren,
        updateMaterialAssignments: updateMaterialAssignments,
        setViewMode: setViewMode,
        copyNodesAndEdges: copyNodesAndEdges,
        setScale: setScale
    }
}