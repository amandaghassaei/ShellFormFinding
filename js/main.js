/**
 * Created by ghassaei on 10/7/16.
 */


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
    var isDraggingArrow = false;

    document.addEventListener('mousedown', function(){
        if (globals.addRemoveFixedMode){
            if (highlightedObj){
                var state = !highlightedObj.fixed;
                globals.schematic.setFixed(highlightedObj.getIndex(), state);
                highlightedObj.setFixed(state);
                globals.shouldResetDynamicSim = true;
            }
            globals.addRemoveFixedMode = false;
            toolTipFixedNode.visible = false;
        }
        isDragging = true;
    }, false);
    document.addEventListener('mouseup', function(e){
        if (isDraggingArrow) {
            isDraggingArrow = false;
            globals.threeView.enableControls(true);
        }
        isDragging = false;
    }, false);

    function dragArrow(){
        globals.threeView.enableControls(false);
        raycasterPlane.set(raycasterPlane.normal, -highlightedObj.getPosition().z);
        var intersection = new THREE.Vector3();
        raycaster.ray.intersectPlane(raycasterPlane, intersection);
        highlightedObj.setForce(new THREE.Vector3(0, intersection.y, 0));
        globals.setForceHasChanged();
    }

    document.addEventListener( 'mousemove', mouseMove, false );
    function mouseMove(e){

        e.preventDefault();
        mouse.x = (e.clientX/window.innerWidth)*2-1;
        mouse.y = - (e.clientY/window.innerHeight)*2+1;
        raycaster.setFromCamera(mouse, globals.threeView.camera);

        if (!globals.addRemoveFixedMode && ((isDragging && highlightedObj && highlightedObj.getMagnitude) || isDraggingArrow)){//force
            isDraggingArrow = true;
            dragArrow();
            globals.controls.showMoreInfo("Force: " +
                (highlightedObj.getMagnitude()*(highlightedObj.getDirection().y < 0 ? -1 : 1)).toFixed(2) + " N", e);
            return;
        }

        var _highlightedObj = null;
        if (!isDragging) {
            var intersections = raycaster.intersectObjects(globals.schematic.getChildren(), true);
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
                        if (objectFound) return;
                        if (thing.object && thing.object._myBeam) {
                            thing.object._myBeam.highlight();
                            _highlightedObj = thing.object._myBeam;
                            objectFound = true;
                        } else if (thing.object && thing.object._myForce) {
                            thing.object._myForce.highlight();
                            _highlightedObj = thing.object._myForce;
                            objectFound = true;
                            globals.controls.showMoreInfo("Force: " +
                                (_highlightedObj.getMagnitude()*(_highlightedObj.getDirection().y < 0 ? -1 : 1)).toFixed(2) + " N", e);
                        }
                    });
                }
            }
        }
        if (highlightedObj && (_highlightedObj != highlightedObj)) highlightedObj.unhighlight();
        if (_highlightedObj === null) globals.controls.hideMoreInfo();
        highlightedObj = _highlightedObj;

        if (globals.addRemoveFixedMode){
            if (highlightedObj && highlightedObj.fixed){
                highlightedObj.highlight();
                toolTipFixedNode.visible = false;
            } else {
                if (highlightedObj) toolTipFixedNode.material.opacity = 1;
                else toolTipFixedNode.material.opacity = 0.5;
                toolTipFixedNode.visible = true;
                nodesPlane.set(nodesPlane.normal, 0);
                var intersection = new THREE.Vector3();
                raycaster.ray.intersectPlane(nodesPlane, intersection);
                toolTipFixedNode.position.set(intersection.x, intersection.y, intersection.z);
            }
        }
    }

    var globals = initGlobals();
    globals.threeView.render();
    globals.threeView.sceneAdd(toolTipFixedNode);

});