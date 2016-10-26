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
    baseGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, -0.5, 0));

    var base = new THREE.Mesh(baseGeometry, material);
    globals.threeView.sceneAddSTL(base);
    addBase();

    var units = "mm";
    var dimensions = new THREE.Vector3(0,0,0);
    var boundingBox = null;

    function setScale(){

        var scale = globals.stlScale*1000;
        if (units == "in") scale /= 25.4;
        var string = (dimensions.x*scale).toFixed(1) + units +" x " + (dimensions.z*scale).toFixed(1) + units + " x " + (dimensions.y*scale).toFixed(1) + units;
        $("#stlDimensions").html(string);
    }

    function setUnits(_units){
        units = _units;
        setScale();
    }

    function addBase(){
        base.visible = globals.addBase;
    }

    function render(){

        var beamThicknessScale = globals.beamThicknessScale;

        object3D.children = [];

        var nodes = globals.staticModel.getNodes();
        var edges = globals.staticModel.getEdges();

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

        boundingBox = (new THREE.Box3()).setFromObject(object3D);
        dimensions = boundingBox.max.sub(boundingBox.min);
        base.scale.x = dimensions.x;
        base.scale.y = Math.abs(boundingBox.min.y);
        base.scale.z = dimensions.z;

        setScale();
    }

    function saveSTL(){
        var _union = null;
        _.each(object3D.children, function(child){
            var geo = child.geometry.clone();
            geo.applyMatrix(new THREE.Matrix4().makeScale(child.scale.x, child.scale.y, child.scale.z));
            geo.applyMatrix(new THREE.Matrix4().makeRotationFromQuaternion(child.quaternion));
            geo.applyMatrix(new THREE.Matrix4().makeTranslation(child.position.x, child.position.y, child.position.z));
            var csgObj = new ThreeBSP(geo);
            if (_union) _union.union(csgObj);
            else _union = csgObj;
        });

        var result = _union.toMesh( new THREE.MeshLambertMaterial({color: 0xff0000}) );
		result.geometry.computeVertexNormals();
		globals.threeView.scene.add( result );

        //var result = union.toMesh();
        //result.geometry.computeVertexNormals();
        //var data = {geo: result.geometry, offset:new THREE.Vector3(0,0,0), orientation:new THREE.Quaternion(0,0,0,1)};
        //var stlBin = geometryToSTLBin([data]);
        //if (!stlBin) return;
        //var blob = new Blob([stlBin], {type: 'application/octet-binary'});
        //saveAs(blob, "shell.stl");
    }

    return {
        render: render,
        setUnits: setUnits,
        setScale: setScale,
        addBase: addBase,
        saveSTL: saveSTL
    }
}