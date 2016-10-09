/**
 * Created by ghassaei on 10/7/16.
 */

function initDynamicModel(globals){

    var object3D = new THREE.Object3D();
    globals.threeView.sceneAdd(object3D);

    var schematic = globals.schematic;

    var geo = schematic.cloneGeo(object3D);
    var nodes = geo.nodes;
    _.each(nodes, function(node){
        node.hide();
    });
    var edges = geo.edges;
    _.each(edges, function(edge){
        edge.setColor(0x8cbaed);
        edge.type = "dynamicBeam";
    });

    //variables for solving
    var dt;
    var numSteps;

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

    var textureDim = 0;

    runSolver();

    function reset(){
        initTypedArrays();
        initTexturesAndPrograms(globals.gpuMath);
        setSolveParams();
    }

    function runSolver(){
        reset();
        globals.threeView.startAnimation(function(){
            if (!globals.dynamicSimVisible) return;
            for (var j=0;j<numSteps;j++){
                solveStep();
            }
            render();
        });
    }

    function stopSolver(){

    }

    function setVisibility(state){
        object3D.visible = state;
    }

    function solveStep(){

        if (globals.shouldResetDynamicSim){
            reset();
            globals.shouldResetDynamicSim = false;
            globals.forceHasChanged = false;
            globals.fixedHasChanged = false;
        } else {
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
        }

        var gpuMath = globals.gpuMath;

        gpuMath.step("velocityCalc", ["u_lastPosition", "u_lastVelocity", "u_originalPosition", "u_externalForces",
            "u_mass", "u_meta", "u_beamK", "u_beamD"], "u_velocity");
        gpuMath.step("positionCalc", ["u_velocity", "u_lastPosition", "u_mass"], "u_position");

        gpuMath.swapTextures("u_velocity", "u_lastVelocity");
        gpuMath.swapTextures("u_position", "u_lastPosition");


        //for (var i=0;i<nodes.length;i++){
        //    var rgbaIndex = i*4;
        //
        //    if (mass[rgbaIndex+1] == 1) continue;
        //    var force = new THREE.Vector3(externalForces[rgbaIndex], externalForces[rgbaIndex+1], externalForces[rgbaIndex+2]);
        //    var nodePosition = new THREE.Vector3(lastPosition[rgbaIndex], lastPosition[rgbaIndex+1], lastPosition[rgbaIndex+2]);
        //    var nodeVelocity = new THREE.Vector3(lastVelocity[rgbaIndex], lastVelocity[rgbaIndex+1], lastVelocity[rgbaIndex+2]);
        //    var nodeOrigPosition = new THREE.Vector3(originalPosition[rgbaIndex], originalPosition[rgbaIndex+1], originalPosition[rgbaIndex+2]);
        //
        //    for (var j=0;j<4;j++){
        //        var neighborIndex = meta[rgbaIndex+j]*4;
        //        if (neighborIndex<0){
        //            //no beam
        //            continue;
        //        }
        //        var neighborPosition = new THREE.Vector3(lastPosition[neighborIndex], lastPosition[neighborIndex+1], lastPosition[neighborIndex+2]);
        //        var neighborVelocity = new THREE.Vector3(lastVelocity[neighborIndex], lastVelocity[neighborIndex+1], lastVelocity[neighborIndex+2]);
        //        var neighborOrigPosition = new THREE.Vector3(originalPosition[neighborIndex], originalPosition[neighborIndex+1], originalPosition[neighborIndex+2]);
        //
        //        var nominalDist = neighborOrigPosition.sub(nodeOrigPosition);
        //        var deltaP = neighborPosition.sub(nodePosition).add(nominalDist);
        //        deltaP.sub(deltaP.clone().normalize().multiplyScalar(nominalDist.length()));
        //        var deltaV = neighborVelocity.sub(nodeVelocity);
        //        var _force = deltaP.multiplyScalar(beamK[rgbaIndex+j]).add(deltaV.multiplyScalar(beamD[rgbaIndex+j]));
        //        force.add(_force);
        //    }
        //
        //    //euler integration
        //    var _mass = mass[rgbaIndex];
        //
        //    nodeVelocity = force.multiplyScalar(dt/_mass).add(nodeVelocity);
        //    velocity[rgbaIndex] = nodeVelocity.x;
        //    velocity[rgbaIndex+1] = nodeVelocity.y;
        //    velocity[rgbaIndex+2] = nodeVelocity.z;
        //
        //    nodePosition = nodeVelocity.multiplyScalar(dt).add(nodePosition);
        //    position[rgbaIndex] = nodePosition.x;
        //    position[rgbaIndex+1] = nodePosition.y;
        //    position[rgbaIndex+2] = nodePosition.z;
        //}
        //
        //var temp = lastPosition;
        //lastPosition = position;
        //position = temp;
        //
        //temp = lastVelocity;
        //lastVelocity = velocity;
        //velocity = temp;

    }

    function render(){

        var vectorLength = 4;
        globals.gpuMath.setProgram("packToBytes");
        globals.gpuMath.setUniformForProgram("packToBytes", "u_vectorLength", vectorLength, "1f");
        globals.gpuMath.setSize(textureDim*vectorLength, textureDim);
        globals.gpuMath.step("packToBytes", ["u_position"], "outputBytes");
        var pixels = new Uint8Array(textureDim*textureDim*4*vectorLength);
        if (globals.gpuMath.readyToRead()) {
            globals.gpuMath.readPixels(0, 0, textureDim * vectorLength, textureDim, pixels);
            var parsedPixels = new Float32Array(pixels.buffer);
            for (var i=0;i<nodes.length;i++){
                var rgbaIndex = i*4;
                var nodePosition = new THREE.Vector3(parsedPixels[rgbaIndex], parsedPixels[rgbaIndex+1], parsedPixels[rgbaIndex+2]);
                nodes[i].render(nodePosition);
            }
            //todo do this in shader ?
            if (globals.viewMode == "none"){
                if (globals.viewModeNeedsUpdate){
                    for (var i=0;i<edges.length;i++){
                        edges[i].setColor(0x8cbaed);
                    }
                    globals.viewModeNeedsUpdate = false;
                }
            } else {
                var vals = [];
                if (globals.viewMode == "length"){
                    for (var i=0;i<edges.length;i++){
                        vals.push(edges[i].getLength());
                    }
                }
                var min = _.min(vals);
                var max = _.max(vals);
                for (var i=0;i<edges.length;i++){
                    edges[i].setHSLColor(vals[i], min, max);
                }
                globals.controls.updateScaleBars(min, max);
            }
        }

        //for (var i=0;i<nodes.length;i++){
        //    var node = nodes[i];
        //    var rgbaIndex = i*4;
        //    var nodePosition = new THREE.Vector3(lastPosition[rgbaIndex], lastPosition[rgbaIndex+1], lastPosition[rgbaIndex+2]);
        //    node.render(nodePosition);
        //}
        globals.threeView.render();
        globals.gpuMath.setSize(textureDim, textureDim);
    }

    function calcSolveParams(){
        var _dt = calcDt();
        var _numSteps = 0.5/_dt;
        return {
            dt: _dt,
            numSteps: _numSteps
        }
    }

    function setSolveParams(){
        var params = calcSolveParams();
        dt = params.dt;
        numSteps = params.numSteps;
        globals.gpuMath.setProgram("velocityCalc");
        globals.gpuMath.setUniformForProgram("velocityCalc", "u_dt", dt, "1f");
        globals.gpuMath.setProgram("positionCalc");
        globals.gpuMath.setUniformForProgram("positionCalc", "u_dt", dt, "1f");
    }

    function calcDt(){
        var maxFreqNat = 0;
        _.each(edges, function(beam){
            if (beam.getNaturalFrequency()>maxFreqNat) maxFreqNat = beam.getNaturalFrequency();
        });
        return (1/(2*Math.PI*maxFreqNat))*0.5;//half of max delta t for good measure
    }

    function initTexturesAndPrograms(gpuMath){
        gpuMath.reset();
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
        gpuMath.initTextureFromData("u_externalForces", textureDim, textureDim, "FLOAT", externalForces);
        gpuMath.initTextureFromData("u_mass", textureDim, textureDim, "FLOAT", mass);
        gpuMath.initTextureFromData("u_meta", textureDim, textureDim, "FLOAT", meta);
        globals.gpuMath.initTextureFromData("u_beamK", textureDim, textureDim, "FLOAT", beamK);
        globals.gpuMath.initTextureFromData("u_beamD", textureDim, textureDim, "FLOAT", beamD);

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

        gpuMath.setSize(textureDim, textureDim);
    }

    function calcTextureSize(numNodes){
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
        var _nodes = globals.schematic.getNodes();
        for (var i=0;i<_nodes.length;i++){
            for (var j=0;j<_nodes[i].beams.length;j++){
                var beam = _nodes[i].beams[j];
                beamK[4*i+j] = beam.getK();
                beamD[4*i+j] = beam.getD();
            }
        }
        globals.gpuMath.initTextureFromData("u_beamK", textureDim, textureDim, "FLOAT", beamK, true);
        globals.gpuMath.initTextureFromData("u_beamD", textureDim, textureDim, "FLOAT", beamD, true);
        //recalc dt
        setSolveParams();
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
        for (var i=0;i<_fixed.length;i++){
            for (var j=0;j<_fixed[i].length;j++){
                var index = globals.zResolution*i+j;
                mass[4*index+1] = (_fixed[i][j] ? 1 : 0);
            }
        }
        globals.gpuMath.initTextureFromData("u_mass", textureDim, textureDim, "FLOAT", mass, true);
    }

    function initTypedArrays(){

        textureDim = calcTextureSize(nodes.length);

        originalPosition = new Float32Array(textureDim*textureDim*4);
        position = new Float32Array(textureDim*textureDim*4);
        lastPosition = new Float32Array(textureDim*textureDim*4);
        velocity = new Float32Array(textureDim*textureDim*4);
        lastVelocity = new Float32Array(textureDim*textureDim*4);
        externalForces = new Float32Array(textureDim*textureDim*4);
        mass = new Float32Array(textureDim*textureDim*4);
        meta = new Float32Array(textureDim*textureDim*4);
        beamK = new Float32Array(textureDim*textureDim*4);
        beamD = new Float32Array(textureDim*textureDim*4);

        for (var i=0;i<textureDim*textureDim;i++){
            mass[4*i+1] = 1;//set all fixed by default
        }

        _.each(nodes, function(node, index){
            var origPosition = node.getOriginalPosition();
            originalPosition[4*index] = origPosition.x;
            originalPosition[4*index+1] = origPosition.y;
            originalPosition[4*index+2] = origPosition.z;
            mass[4*index] = node.getMass();

            meta[4*index] = -1;
            meta[4*index+1] = -1;
            meta[4*index+2] = -1;
            meta[4*index+3] = -1;
            _.each(node.beams, function(beam, i){
                meta[4*index+i] = beam.getOtherNode(node).getIndex();
            });
        });

        updateMaterials();
        updateExternalForces();
        updateFixed();
    }

    function getChildren(){
        return object3D.children;
    }

    return {
        runSolver:runSolver,
        stopSolver: stopSolver,
        reset: reset,
        setVisibility: setVisibility,
        getChildren: getChildren
    }
}