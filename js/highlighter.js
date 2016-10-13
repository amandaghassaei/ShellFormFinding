/**
 * Created by ghassaei on 10/13/16.
 */


function initHighlighter(){

    var object3D = new THREE.Mesh(new THREE.BoxGeometry(1,0.01,1),
        new THREE.MeshBasicMaterial({opacity:0.1, transparent:true, color:0x000000}));
    globals.threeView.sceneAdd(object3D);
    setVisiblitiy(false);

    function setVisiblitiy(visible){
        object3D.visible = visible;
    }

    function setPosition(position){
        object3D.position.set(position.x, position.y, position.z);
    }

    function setScale(scale){
        object3D.scale.set(scale.x, 1.0, scale.z);
    }

    return {
        setVisiblitiy: setVisiblitiy,
        setPosition: setPosition,
        setScale: setScale
    }
}