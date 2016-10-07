/**
 * Created by ghassaei on 9/16/16.
 */

var nodeMaterial = new THREE.MeshBasicMaterial({color: 0x000000, side:THREE.DoubleSide});
var nodeGeo = new THREE.CircleGeometry(0.2,20);
nodeGeo.rotateX(Math.PI/2);


function Node(position, index){

    this.index = index;
    position = position.clone();

    this.object3D = new THREE.Mesh(nodeGeo, nodeMaterial);
    this.object3D._myNode = this;
    this.object3D.position.set(position.x, position.y, position.z);

    this.beams = [];
    this.externalForces = [];
    this.fixed = false;
    this.reset();
}

Node.prototype.setFixed = function(fixed){
    this.fixed = fixed;
};

Node.prototype.addExternalForce = function(force){
    this.externalForces.push(force);
};

Node.prototype.addBeam = function(beam){
    this.beams.push(beam);
};

Node.prototype.getBeams = function(){
    return this.beams;
};

Node.prototype.getIndex = function(){//in nodes array
    return this.index;
};

Node.prototype.getPosition = function(){
    return this.object3D.position;
};

Node.prototype.getObject3D = function(){
    return this.object3D;
};

Node.prototype.highlight = function(){
};

Node.prototype.unhighlight = function(){
};

Node.prototype.move = function(position){
    this.object3D.position.set(position.x, position.y, position.z);
    _.each(this.beams, function(beam){
        beam.updatePosition();
    });
};

Node.prototype.reset = function(){
    this.solved = false;
};

Node.prototype.solve = function(){
};

Node.prototype.destroy = function(){
    //object3D is removed in outer scope
    this.object3D._myNode = null;
    this.object3D = null;
    this.beams = null;
};