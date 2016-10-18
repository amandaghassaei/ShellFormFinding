/**
 * Created by ghassaei on 10/7/16.
 */

globals = {};

$(function() {

    window.addEventListener('resize', function(){
        globals.threeView.onWindowResize();
    }, false);

    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();
    var raycasterPlane = new THREE.Plane(new THREE.Vector3(0,0,1));
    var nodesPlane = new THREE.Plane(new THREE.Vector3(0,1,0), 0);
    var toolTipFixedNode = new THREE.Mesh(nodeFixedGeo, nodeMaterialFixed.clone());
    toolTipFixedNode.material.transparent = true;
    toolTipFixedNode.material.side = THREE.FrontSide;
    toolTipFixedNode.material.opacity = 0.5;
    toolTipFixedNode.visible = false;
    var highlightedObj;
    var isDragging = false;
    var mouseDown = false;
    var isDraggingArrow = false;

    $(document).dblclick(function() {
        if (highlightedObj && highlightedObj.getMagnitude){
            globals.controls.editMoreInfo(highlightedObj.getMagnitude().toFixed(2), function(val){
                highlightedObj.setForce(new THREE.Vector3(0, val, 0));
                globals.forceArrayUpdated();
            });
        }
    });

    document.addEventListener('mousedown', function(){
        if (globals.addRemoveFixedMode){
            if (highlightedObj){
                var state = !highlightedObj.fixed;
                globals.schematic.setFixed(highlightedObj.getIndex(), state);
                highlightedObj.setFixed(state);
                globals.setFixedHasChanged(state);
            }
            globals.addRemoveFixedMode = false;
            toolTipFixedNode.visible = false;
        }
        if (highlightedObj && highlightedObj.type == "beam"){
            if (globals.currentMaterial == "none"){
            } else {
                var needsUpdate = highlightedObj.setMaterial(globals.materials[globals.currentMaterial]);
                if (needsUpdate){
                    globals.dynamicModel.updateMaterialAssignments();
                    globals.dynamicSimMaterialsChanged = true;
                    globals.staticModel.updateMaterialAssignments();
                    globals.staticModel.resetQArray();
                }
            }
        }
        mouseDown = true;
    }, false);
    document.addEventListener('mouseup', function(e){
        if (isDraggingArrow) {
            isDraggingArrow = false;
            globals.threeView.enableControls(true);
        }
        isDragging = false;
        mouseDown = false;

        globals.highlighter.subDivide();

    }, false);

    function dragArrow(){
        globals.threeView.enableControls(false);
        raycasterPlane.set(raycasterPlane.normal, -highlightedObj.getPosition().z);
        var intersection = new THREE.Vector3();
        raycaster.ray.intersectPlane(raycasterPlane, intersection);
        highlightedObj.setForce(new THREE.Vector3(0, intersection.y, 0));
        globals.forceArrayUpdated();
    }

    document.addEventListener( 'mousemove', mouseMove, false );
    function mouseMove(e){

        if (mouseDown) {
            isDragging = true;
            globals.highlighter.setVisiblitiy(false);
        }

        e.preventDefault();
        globals.controls.hideMoreInfo();
        mouse.x = (e.clientX/window.innerWidth)*2-1;
        mouse.y = - (e.clientY/window.innerHeight)*2+1;
        raycaster.setFromCamera(mouse, globals.threeView.camera);

        if (!globals.addRemoveFixedMode && ((isDragging && highlightedObj && highlightedObj.getMagnitude) || isDraggingArrow)){//force
            isDraggingArrow = true;
            dragArrow();
            globals.controls.showMoreInfo("Force: " +
                highlightedObj.getMagnitude().toFixed(2) + " N", e);
            return;
        }

        var _highlightedObj = null;
        if (!isDragging) {
            var objsToIntersect = globals.schematic.getChildren();
            if (globals.dynamicSimVisible && (globals.viewMode == "length" || globals.viewMode == "force")) objsToIntersect = objsToIntersect.concat(globals.dynamicModel.getChildren());
            if (globals.staticSimVisible && (globals.viewMode == "length" || globals.viewMode == "force")) objsToIntersect = objsToIntersect.concat(globals.staticModel.getChildren());
            _highlightedObj = checkForIntersections(e, objsToIntersect);
        }
        if (highlightedObj && (_highlightedObj != highlightedObj)) highlightedObj.unhighlight();
        highlightedObj = _highlightedObj;

        if (globals.addRemoveFixedMode){
            if (highlightedObj && highlightedObj.fixed){
                highlightedObj.highlight();
                toolTipFixedNode.visible = false;
            } else {
                if (highlightedObj) toolTipFixedNode.material.opacity = 1;
                else toolTipFixedNode.material.opacity = 0.5;
                toolTipFixedNode.visible = true;
                var intersection = new THREE.Vector3();
                raycaster.ray.intersectPlane(nodesPlane, intersection);
                toolTipFixedNode.position.set(intersection.x, intersection.y, intersection.z);
            }
        }

        if (globals.viewMode == "length"){
            if (highlightedObj && (highlightedObj.type == "dynamicBeam" || highlightedObj.type == "staticBeam")){
                globals.controls.showMoreInfo("Length: " +
                        highlightedObj.getLength().toFixed(2) + " m", e);
            }
        } else if (globals.viewMode == "force"){
            if (highlightedObj && (highlightedObj.type == "dynamicBeam" || highlightedObj.type == "staticBeam")){
                globals.controls.showMoreInfo("Internal Force: " +
                        highlightedObj.getForce().toFixed(2) + " N", e);
            }
        }

        if (!isDragging && !globals.addRemoveFixedMode && !highlightedObj){
            var intersection = new THREE.Vector3();
            raycaster.ray.intersectPlane(nodesPlane, intersection);
            globals.highlighter.highlight(intersection);
        } else {
            globals.highlighter.setVisiblitiy(false);
        }

    }

    function checkForIntersections(e, objects){
        var _highlightedObj = null;
        var intersections = raycaster.intersectObjects(objects, true);
        if (intersections.length > 0) {
            var objectFound = false;
            if (globals.addRemoveFixedMode){
                _.each(intersections, function (thing) {//look for nodes
                    if (objectFound) return;
                    if (thing.object && thing.object._myNode) {
                        _highlightedObj = thing.object._myNode;
                        objectFound = true;
                    }
                });
            } else {
                _.each(intersections, function (thing) {
                    if (thing.object && thing.object._myBeam) {
                        if (objectFound) return;
                        _highlightedObj = thing.object._myBeam;
                        _highlightedObj.highlight();
                        objectFound = true;
                    } else if (thing.object && thing.object._myForce) {
                        if (_highlightedObj) _highlightedObj.unhighlight();
                        _highlightedObj = thing.object._myForce;
                        thing.object._myForce.highlight();
                        objectFound = true;
                        globals.controls.showMoreInfo("Force: " +
                            _highlightedObj.getMagnitude().toFixed(2) + " N", e);
                    }
                });
            }
        }
        return _highlightedObj;
    }

    globals = initGlobals();
    globals.schematic = initSchematic(globals);
    globals.dynamicModel = initDynamicModel(globals);
    globals.staticModel = initStaticModel(globals);
    globals.threeView.render();
    globals.threeView.sceneAdd(toolTipFixedNode);
    globals.highlighter = initHighlighter();

});