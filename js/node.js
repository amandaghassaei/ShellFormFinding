/**
 * Created by ghassaei on 9/16/16.
 */

var nodeMaterial = new THREE.MeshBasicMaterial({color: 0x000000, side:THREE.DoubleSide});
var nodeMaterialFixed = new THREE.MeshBasicMaterial({color: 0xff0000, side:THREE.DoubleSide});
var nodeGeo = new THREE.CircleGeometry(0.2,20);
nodeGeo.rotateX(Math.PI/2);


function Node(position, index){

    this.index = index;
    position = position.clone();
    this.originalPosition = position.clone();
    this.velocity = new THREE.Vector3(0,0,0);

    this.object3D = new THREE.Mesh(nodeGeo, nodeMaterial);
    this.object3D._myNode = this;

    this.beams = [];
    this.externalForce = null;
    this.fixed = false;
    this.reset();
}

Node.prototype.setFixed = function(fixed){
    this.fixed = fixed;
    if (fixed) this.object3D.material = nodeMaterialFixed;
    else this.object3D.material = nodeMaterial;
};



//forces

Node.prototype.addExternalForce = function(force){
    this.externalForce = force;
};

Node.prototype.getExternalForce = function(){
    return this.externalForce.getForce();
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

Node.prototype.getObject3D = function(){
    return this.object3D;
};

Node.prototype.highlight = function(){
};

Node.prototype.unhighlight = function(){
};

Node.prototype.hide = function(){
    this.object3D.visible = false;
};

Node.prototype.render = function(){
    _.each(this.beams, function(beam){
        beam.updatePosition();
    });
};





Node.prototype.reset = function(){
    this.object3D.position.set(this.originalPosition.x, this.originalPosition.y, this.originalPosition.z);
    this.velocity = new THREE.Vector3(0,0,0);
    this.render();
};




//dynamic solve

Node.prototype.solveDynamics = function(dt){
    if (this.fixed) return;
    var force = this.getExternalForce();
    var position = this.getPosition();
    var originalPosition = this.getOriginalPosition();
    var velocity = this.getVelocity();
    for (var i=0;i<this.beams.length;i++){
        var beam = this.beams[i];
        var neighbor = beam.getOtherNode(this);
        var nominalDistance = originalPosition.clone().sub(neighbor.getOriginalPosition());
        var deltaP = position.clone().sub(neighbor.getPosition()).sub(nominalDistance);
        var deltaV = velocity.clone().sub(neighbor.getVelocity());
        var _force = deltaP.clone().normalize().multiplyScalar(deltaP.length()*beam.getK()).add(
            deltaV.clone().normalize().multiplyScalar(deltaV.length*beam.getD()));
        force.add(_force);
    }
    //euler integration
    var mass = 1;
    this.velocity = force.multiplyScalar(dt/mass).add(velocity);
    position = this.velocity.clone().multiplyScalar(dt).add(position);
    this.object3D.position.set(position.x, position.y, position.z);
};

Node.prototype.getOriginalPosition = function(){
    return this.originalPosition;
};

Node.prototype.getPosition = function(){
    return this.object3D.position;
};

Node.prototype.getVelocity = function(){
    return this.velocity;
};




//deallocate

Node.prototype.destroy = function(){
    //object3D is removed in outer scope
    this.object3D._myNode = null;
    this.object3D = null;
    this.beams = null;
    this.externalForce = null;
};