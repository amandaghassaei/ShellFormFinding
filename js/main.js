/**
 * Created by ghassaei on 10/7/16.
 */


$(function() {

    window.addEventListener('resize', function(){
        globals.threeView.onWindowResize();
    }, false);

    var globals = initGlobals();
    globals.threeView.render();

    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();
    var plane = new THREE.Plane();
    var highlightedObj;
    var isDragging = false;
    var isDraggingArrow = false;

    window.addEventListener('mousedown', function(){
        isDragging = true;
    }, false);
    window.addEventListener('mouseup', function(){
        isDragging = false;
        isDraggingArrow = false;
    }, false);

    function dragArrow(e){
        var intersection = raycaster.intersectObject(plane);
        console.log(intersection);
    }

    window.addEventListener( 'mousemove', mouseMove, false );
    function mouseMove(e){
        e.preventDefault();
        mouse.x = (e.clientX/window.innerWidth)*2-1;
        mouse.y = - (e.clientY/window.innerHeight)*2+1;
        raycaster.setFromCamera(mouse, globals.threeView.camera);

        if (isDraggingArrow){
            dragArrow(e);
            console.log("dragging arrow");
        } else {
            var intersections = raycaster.intersectObjects(globals.schematic.getChildren(), true);
            if (intersections.length > 0) {
                var _highlightedObj = null;
                var objectFound = false;
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
                    }
                });
            }
            if (highlightedObj && _highlightedObj != highlightedObj) highlightedObj.unhighlight();
            if (_highlightedObj) {
                highlightedObj = _highlightedObj;
                if (_highlightedObj.getMagnitude) {
                    //force vector
                    if (isDragging) {
                        isDraggingArrow = true;
                        dragArrow(e);
                    }
                }
            } else {
            }
        }
    }


});