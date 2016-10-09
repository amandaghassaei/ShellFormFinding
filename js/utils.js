/**
 * Created by ghassaei on 10/9/16.
 */


function initUtils(){

    function makeMeshFromNodes(nodes){
        for (var i=0;i<nodes.length;i++){
            var node = nodes[i];
            for (var j=0;j<node.beams.length;j++){
                var beam = node.beams[j];
                var neighbor = beam.getOtherNode(node);


            }
        }
    }

    return {
        makeMeshFromNodes: makeMeshFromNodes
    }
}