/**
 * Created by ghassaei on 10/25/16.
 */


function initExportSTL(globals){

    var object3D = new THREE.Object3D();
    globals.threeView.sceneAddSTL(object3D);
    var material = new THREE.MeshLambertMaterial({color:0x355C70});
    var geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 10);
    var jointGeometry = new THREE.SphereGeometry(0.5, 20, 20);
    var baseGeometry = new THREE.BoxGeometry(1,1,1);

    var beamThicknessScale = 0.3;
    var scale = 0.1;
    var units = "in";

    function setScale(_scale){

        if (_scale !== undefined) scale = _scale;
        var height = 0;
        var nodes = globals.staticModel.getNodes();
        _.each(nodes, function(node){
            if (node.getPosition().y>height) height = node.getPosition().y;
        });
        var string = (globals.xLength*scale).toFixed(2) + units +" x " + (globals.zLength*scale).toFixed(2) + units + " x " + (height*scale).toFixed(2) + units;
        $("#stlDimensions").html(string);
    }

    function setUnits(_units){
        units = _units;
        setScale();
    }

    function render(){

        object3D.children = [];

        var nodes = globals.staticModel.getNodes();
        var edges = globals.staticModel.getEdges();

        var base = new THREE.Mesh(baseGeometry, material);
        //_.each(nodes, function(node){
        //
        //})
        base.scale.set(globals.xLength, 2, globals.zLength);
        object3D.add(base);

        _.each(edges, function(edge){
            if (edge.isFixed()) return;
            var beam = new THREE.Mesh(geometry, material);
            beam.scale.y = edge.getLength();
            var internalForce = edge.getForce();
            beam.scale.x = Math.sqrt(internalForce)*beamThicknessScale;
            beam.scale.z = Math.sqrt(internalForce)*beamThicknessScale;
            var beamAxis = edge.nodes[0].getPosition().clone().sub(edge.nodes[1].getPosition());
            var axis = (new THREE.Vector3(0,1,0)).cross(beamAxis).normalize();
            var angle = Math.acos(new THREE.Vector3(0,1,0).dot(beamAxis.normalize()));
            var quaternion = (new THREE.Quaternion()).setFromAxisAngle(axis, angle);
            var position = (edge.nodes[0].getPosition().clone().add(edge.nodes[1].getPosition())).multiplyScalar(0.5);
            beam.position.set(position.x, position.y, position.z);
            beam.quaternion.set(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
            object3D.add(beam);
        });

        _.each(nodes, function(node){
            var joint = new THREE.Mesh(jointGeometry, material);
            var internalForce = 0;
            _.each(node.beams, function(beam){
                var force = beam.getForce();
                if (force>internalForce) internalForce = force;
            });
            joint.scale.set(Math.sqrt(internalForce)*beamThicknessScale, Math.sqrt(internalForce)*beamThicknessScale, Math.sqrt(internalForce)*beamThicknessScale);
            var position = node.getPosition();
            joint.position.set(position.x, position.y, position.z);
            object3D.add(joint);
        });

        setScale();
    }

    return {
        render: render,
        setUnits: setUnits,
        setScale: setScale
    }
}