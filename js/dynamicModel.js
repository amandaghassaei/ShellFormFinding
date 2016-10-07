/**
 * Created by ghassaei on 10/7/16.
 */

function initDynamicModel(globals){

    var object3D = new THREE.Object3D();
    //object3D.position.y = globals.planeHeight;
    globals.threeView.sceneAdd(object3D);

    var schematic = globals.schematic;

    var geo = schematic.cloneGeo(object3D);
    var nodes = geo.nodes;
    _.each(nodes, function(node){
        node.hide();
    });
    var edges = geo.edges;
    _.each(edges, function(edges){
        edges.setColor(0xdddddd);
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

    runSolver();

    function runSolver(){
        initTypedArrays();
        var params = calcSolveParams();
        dt = params.dt;
        numSteps = params.numSteps;

        globals.threeView.startAnimation(function(){
            for (var j=0;j<numSteps;j++){
                solveStep();
            }
            render();
        });
    }

    function stopSolver(){

    }

    function solveStep(){

        for (var i=0;i<nodes.length;i++){
            var rgbaIndex = i*4;

            if (mass[rgbaIndex+1] == 1) continue;
            var force = new THREE.Vector3(externalForces[rgbaIndex], externalForces[rgbaIndex+1], externalForces[rgbaIndex+2]);
            var nodePosition = new THREE.Vector3(lastPosition[rgbaIndex], lastPosition[rgbaIndex+1], lastPosition[rgbaIndex+2]);
            var nodeVelocity = new THREE.Vector3(lastVelocity[rgbaIndex], lastVelocity[rgbaIndex+1], lastVelocity[rgbaIndex+2]);
            var nodeOrigPosition = new THREE.Vector3(originalPosition[rgbaIndex], originalPosition[rgbaIndex+1], originalPosition[rgbaIndex+2]);

            for (var j=0;j<4;j++){
                var neighborIndex = meta[rgbaIndex+j]*4;
                if (neighborIndex<0){
                    //no beam
                    continue;
                }
                var neighborPosition = new THREE.Vector3(lastPosition[neighborIndex], lastPosition[neighborIndex+1], lastPosition[neighborIndex+2]);
                var neighborVelocity = new THREE.Vector3(lastVelocity[neighborIndex], lastVelocity[neighborIndex+1], lastVelocity[neighborIndex+2]);
                var neighborOrigPosition = new THREE.Vector3(originalPosition[neighborIndex], originalPosition[neighborIndex+1], originalPosition[neighborIndex+2]);

                var nominalDist = neighborOrigPosition.sub(nodeOrigPosition);
                var deltaP = neighborPosition.sub(nodePosition).add(nominalDist);
                deltaP.sub(deltaP.clone().normalize().multiplyScalar(nominalDist.length()));
                var deltaV = neighborVelocity.sub(nodeVelocity);
                var _force = deltaP.multiplyScalar(beamK[rgbaIndex+j]).add(deltaV.multiplyScalar(beamD[rgbaIndex+j]));
                force.add(_force);
            }

            //euler integration
            var _mass = mass[rgbaIndex];

            nodeVelocity = force.multiplyScalar(dt/_mass).add(nodeVelocity);
            velocity[rgbaIndex] = nodeVelocity.x;
            velocity[rgbaIndex+1] = nodeVelocity.y;
            velocity[rgbaIndex+2] = nodeVelocity.z;

            nodePosition = nodeVelocity.multiplyScalar(dt).add(nodePosition);
            position[rgbaIndex] = nodePosition.x;
            position[rgbaIndex+1] = nodePosition.y;
            position[rgbaIndex+2] = nodePosition.z;
        }

        var temp = lastPosition;
        lastPosition = position;
        position = temp;

        temp = lastVelocity;
        lastVelocity = velocity;
        velocity = temp;

    }

    function render(){
        for (var i=0;i<nodes.length;i++){
            var node = nodes[i];
            var rgbaIndex = i*4;
            var nodePosition = new THREE.Vector3(lastPosition[rgbaIndex], lastPosition[rgbaIndex+1], lastPosition[rgbaIndex+2]);
            node.render(nodePosition);
        }
        globals.threeView.render();
    }

    function calcSolveParams(){
        var maxFreqNat = 0;
        _.each(edges, function(beam){
            if (beam.getNaturalFrequency()>maxFreqNat) maxFreqNat = beam.getNaturalFrequency();
        });
        var _dt = (1/(2*Math.PI*maxFreqNat))*0.5;//half of max delta t for good measure
        var _numSteps = (1/60)/_dt;
        return {
            dt: _dt,
            numSteps: _numSteps
        }
    }

    function initTypedArrays(){
        var numNodes = nodes.length;

        originalPosition = new Float32Array(numNodes*4);
        position = new Float32Array(numNodes*4);
        lastPosition = new Float32Array(numNodes*4);
        velocity = new Float32Array(numNodes*4);
        lastVelocity = new Float32Array(numNodes*4);
        externalForces = new Float32Array(numNodes*4);
        mass = new Float32Array(numNodes*4);
        meta = new Int8Array(numNodes*4);
        beamK = new Float32Array(numNodes*4);
        beamD = new Float32Array(numNodes*4);

        _.each(nodes, function(node, index){
            var externalForce = node.getExternalForce();
            externalForces[4*index] = externalForce.x;
            externalForces[4*index+1] = externalForce.y;
            externalForces[4*index+2] = externalForce.z;
            var origPosition = node.getOriginalPosition();
            originalPosition[4*index] = origPosition.x;
            originalPosition[4*index+1] = origPosition.y;
            originalPosition[4*index+2] = origPosition.z;
            mass[4*index] = node.getMass();
            mass[4*index+1] = (node.fixed ? 1 : 0);

            meta[4*index] = -1;
            meta[4*index+1] = -1;
            meta[4*index+2] = -1;
            meta[4*index+3] = -1;
            _.each(node.beams, function(beam, i){
                meta[4*index+i] = beam.getOtherNode(node).getIndex();
                beamK[4*index+i] = beam.getK();
                beamD[4*index+i] = beam.getD();
            });

        });
    }


    return {
        runSolver:runSolver,
        stopSolver: stopSolver
    }
}