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

    var dt = 0.0001;

    solve();

    function solve(){
        for (var b=0;b<20;b++){
            for (var a=0;a<1000;a++){
                for (var i=0;i<nodes.length;i++){
                    nodes[i].solveDynamics(dt);
                }
            }
            for (var i=0;i<nodes.length;i++){
                nodes[i].render();
            }
            globals.threeView.render();
        }

    }


    return {
        solve:solve
    }
}