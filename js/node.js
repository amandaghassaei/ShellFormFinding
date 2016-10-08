/**
 * Created by ghassaei on 9/16/16.
 */

var nodeMaterial = new THREE.MeshBasicMaterial({color: 0x000000, side:THREE.DoubleSide});
var nodeMaterialFixed = new THREE.MeshBasicMaterial({color: 0x000000, side:THREE.DoubleSide});
var nodeGeo = new THREE.CircleGeometry(0.2,20);
nodeGeo.rotateX(Math.PI/2);
var nodeFixedGeo = new THREE.CubeGeometry(1, 0.3, 1);


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
    if (fixed) {
        this.object3D.material = nodeMaterialFixed;
        this.object3D.geometry = nodeFixedGeo;
    }
    else {
        this.object3D.material = nodeMaterial;
        this.object3D.geometry = nodeGeo;
    }
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

Node.prototype.render = function(position){
    position.add(this.originalPosition);
    this.object3D.position.set(position.x, position.y, position.z);
    _.each(this.beams, function(beam){
        beam.updatePosition();
    });
};





Node.prototype.reset = function(){
    this.velocity = new THREE.Vector3(0,0,0);
    this.render(new THREE.Vector3(0,0,0));
};




//dynamic solve

Node.prototype.getOriginalPosition = function(){
    return this.originalPosition;
};

Node.prototype.getPosition = function(){
    return this.object3D.position;
};

Node.prototype.getVelocity = function(){
    return this.velocity;
};

Node.prototype.getMass = function(){
    var density = 1;
    //var area =
    return 1;
};




//deallocate

Node.prototype.destroy = function(){
    //object3D is removed in outer scope
    this.object3D._myNode = null;
    this.object3D = null;
    this.beams = null;
    this.externalForce = null;
};