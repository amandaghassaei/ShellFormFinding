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
    var dt = 0.0001;

    var position;
    var lastPosition;
    var velocity;
    var lastVelocity;
    var externalForces;

    initTypedArrays();

    for (var i=0;i<10;i++){
        for (var j=0;j<1000;j++){
            solve();
        }
        render();
    }



    function solve(){

        for (var i=0;i<nodes.length;i++){

            var node = nodes[i];
            var rgbaIndex = i*4;

            if (node.fixed) continue;
            var force = node.getExternalForce();
            var nodePosition = new THREE.Vector3(lastPosition[rgbaIndex], lastPosition[rgbaIndex+1], lastPosition[rgbaIndex+2]);
            var nodeVelocity = new THREE.Vector3(lastVelocity[rgbaIndex], lastVelocity[rgbaIndex+1], lastVelocity[rgbaIndex+2]);
            for (var j=0;j<node.beams.length;j++){
                var beam = node.beams[j];
                var neighborIndex = beam.getOtherNode(this).getIndex()*4;

                var neighborPosition = new THREE.Vector3(lastPosition[neighborIndex], lastPosition[neighborIndex+1], lastPosition[neighborIndex+2]);
                var neighborVelocity = new THREE.Vector3(lastVelocity[neighborIndex], lastVelocity[neighborIndex+1], lastVelocity[neighborIndex+2]);

                var deltaP = nodePosition.clone().sub(neighborPosition);
                var deltaV = nodeVelocity.clone().sub(neighborVelocity);
                var _force = deltaP.clone().normalize().multiplyScalar(deltaP.length()*beam.getK()).add(
                    deltaV.clone().normalize().multiplyScalar(deltaV.length*beam.getD()));
                force.add(_force);
            }

            //euler integration
            var mass = 1;

            nodeVelocity = force.multiplyScalar(dt/mass).add(nodeVelocity);
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

    function initTypedArrays(){
        var numNodes = nodes.length;

        position = new Float32Array(numNodes*4);
        lastPosition = new Float32Array(numNodes*4);
        velocity = new Float32Array(numNodes*4);
        lastVelocity = new Float32Array(numNodes*4);
        externalForces = new Float32Array(numNodes*4);

        _.each(nodes, function(node, index){
            var externalForce = node.getExternalForce();
            externalForces[4*index] = externalForce.x;
            externalForces[4*index+1] = externalForce.y;
            externalForces[4*index+2] = externalForce.z;
        });
    };


    return {
        solve:solve
    }
}