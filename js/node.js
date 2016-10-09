/**
 * Created by ghassaei on 9/16/16.
 */

var nodeMaterial = new THREE.MeshBasicMaterial({color: 0x000000, side:THREE.DoubleSide});
var nodeMaterialFixed = new THREE.MeshBasicMaterial({color: 0x000000, side:THREE.DoubleSide});
var nodeMaterialDelete = new THREE.MeshBasicMaterial({color: 0xff0000, side:THREE.DoubleSide});
var nodeGeo = new THREE.CircleGeometry(0.2,20);
nodeGeo.rotateX(Math.PI/2);
var nodeFixedGeo = new THREE.CubeGeometry(1, 0.5, 1);
nodeFixedGeo.applyMatrix( new THREE.Matrix4().makeTranslation(0, 0.25, 0) );


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
        if (this.externalForce) this.externalForce.hide();
    }
    else {
        this.object3D.material = nodeMaterial;
        this.object3D.geometry = nodeGeo;
        if (this.externalForce) this.externalForce.show();
    }
};




//forces

Node.prototype.addExternalForce = function(force){
    this.externalForce = force;
};

Node.prototype.getExternalForce = function(){
    return this.externalForce.getForce();
};

Node.prototype.getArea = function(){
    if (this.beams.length<2) return 0;//todo a beam has zero mass?
    var area = 0;
    for (var i=0;i<this.beams.length;i++){
        for (var j=i;j<this.beams.length;j++) {
            if (i==j) continue;
            var beam1 = this.beams[i].getVector();
            var beam1Direction = beam1.clone().normalize();
            var beam2 = this.beams[j].getVector();
            var beam2Direction = beam2.clone().normalize();
            var cos = Math.acos(beam1Direction.dot(beam2Direction));
            if (Math.abs(Math.PI / 2 - cos) < 0.01) {
                //right angle
                area += beam1.length() * beam2.length() * 0.25;
            }
        }
    }
    return area;
};

Node.prototype.getMass = function(){
    return this.getArea()*globals.density;
};

Node.prototype.getSelfWeight = function(){
    return new THREE.Vector3(0,9.8,0).multiplyScalar(this.getMass());
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
    this.object3D.material = nodeMaterialDelete;
};

Node.prototype.unhighlight = function(){
    if (this.fixed) {
        this.object3D.material = nodeMaterialFixed;
    }
    else {
        this.object3D.material = nodeMaterial;
    }
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




//deallocate

Node.prototype.destroy = function(){
    //object3D is removed in outer scope
    this.object3D._myNode = null;
    this.object3D = null;
    this.beams = null;
    this.externalForce = null;
};