/**
 * Created by ghassaei on 9/16/16.
 */

var beamMaterialHighlight = new THREE.LineBasicMaterial({color: 0x4444ff, linewidth: 3});

function Beam(nodes){

    nodes[0].addBeam(this);
    nodes[1].addBeam(this);
    this.vertices = [nodes[0].getPosition(), nodes[1].getPosition()];
    this.nodes = nodes;

    var lineGeometry = new THREE.Geometry();
    lineGeometry.dynamic = true;
    lineGeometry.vertices = this.vertices;

    this.material = new THREE.LineBasicMaterial({color: 0x222222, linewidth: 3});
    this.object3D = new THREE.Line(lineGeometry, this.material);
    this.object3D._myBeam = this;

    this.reset();
}

Beam.prototype.highlight = function(){
    this.object3D.material = beamMaterialHighlight;
};

Beam.prototype.unhighlight = function(){
    this.object3D.material = this.material;
};

Beam.prototype.setColor = function(hex){
    this.object3D.material.color.setHex(hex);
};

Beam.prototype.setDefaultColor = function(){
    this.setColor(0x222222);
};

Beam.prototype.setHSLColor = function(val, max, min){
    var scaledVal = (1-(val - min)/(max - min)) * 0.7;
    var color = new THREE.Color();
    color.setHSL(scaledVal, 1, 0.5);
    this.object3D.material.color.set(color);
};

Beam.prototype.reset = function(){
    this.inCompression = false;
    this.force = null;
};

Beam.prototype.getLength = function(){
    return this.vertices[0].clone().sub(this.vertices[1]).length();
};



//dynamic solve

Beam.prototype.getK = function(){
    return 30/this.getLength();
};

Beam.prototype.getD = function(){
    return 2*this.getNaturalFrequency();
};

Beam.prototype.getNaturalFrequency = function(){
    var minMass = this.nodes[0].getMass();
    if (this.nodes[1].getMass()<minMass) minMass = this.nodes[1].getMass();
    return Math.sqrt(this.getK()/minMass);
};

Beam.prototype.getOtherNode = function(node){
    if (this.nodes[0] == node) return this.nodes[1];
    return this.nodes[0];
};



//render

Beam.prototype.getObject3D = function(){
    return this.object3D;
};

Beam.prototype.updatePosition = function(){
    this.object3D.geometry.verticesNeedUpdate = true;
    this.object3D.geometry.computeBoundingSphere();
};



//deallocate

Beam.prototype.destroy = function(){
    this.vertices = null;
    this.object3D._myBeam = null;
    this.object3D = null;
    this.material = null;
    this.nodes = null;
};