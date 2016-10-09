/**
 * Created by ghassaei on 9/16/16.
 */

function initThreeView(globals) {

    var scene = new THREE.Scene();
    var camera = new THREE.OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / -2, -1000, 1000);//-40, 40);
    var renderer = new THREE.WebGLRenderer({antialias: true});
    var controls;

    init();

    function init() {

        var container = $("#threeContainer");
        renderer.setSize(window.innerWidth, window.innerHeight);
        container.append(renderer.domElement);

        scene.background = new THREE.Color(0xe6e6e6);
        //scene.fog = new THREE.FogExp2(0xf4f4f4, 1.7);
        //renderer.setClearColor(scene.fog.color);

        camera.zoom = 15;
        camera.updateProjectionMatrix();
        camera.position.x = 40;
        camera.position.y = 40;
        camera.position.z = 40;

        controls = new THREE.OrbitControls(camera, container.get(0));
        controls.addEventListener('change', render);

        render();
    }

    function render() {
        //renderer.render(scene, camera);
    }

    function startAnimation(callback){
        console.log("starting animation");
        _loop(function(){
            _render();
            callback();
        });

    }

    function _render(){
        renderer.render(scene, camera);
    }

    function _loop(callback){
        callback();
        requestAnimationFrame(function(){
            _loop(callback);
        });
    }

    function sceneAdd(object) {
        scene.add(object);
    }

    function sceneRemove(object) {
        scene.remove(object);
    }

    function sceneClear() {
        scene.children = [];
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.left = -window.innerWidth / 2;
        camera.right = window.innerWidth / 2;
        camera.top = window.innerHeight / 2;
        camera.bottom = -window.innerHeight / 2;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);

        render();
    }

    function enableControls(state){
        controls.enabled = state;
        controls.enableRotate = state;
    }

    return {
        sceneRemove: sceneRemove,
        sceneAdd: sceneAdd,
        sceneClear: sceneClear,
        render: render,
        onWindowResize: onWindowResize,
        startAnimation: startAnimation,
        enableControls: enableControls,
        scene: scene,
        camera: camera
    }
}