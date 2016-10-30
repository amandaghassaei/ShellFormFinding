/**
 * Created by ghassaei on 10/2/16.
 */

//0xb67df0
//0x7700f1

function Force(force, selfWeight){
    this.force = force;
    if (selfWeight === undefined) selfWeight = new THREE.Vector3(0,0,0);
    this.selfWeight = selfWeight.clone();
    this.arrow = new THREE.ArrowHelper(this.getDirection(), new THREE.Vector3(), this.getLength(), 0x999999);
    this.arrow.line.material.linewidth = 4;
    this.update();
    this.arrow.cone._myForce = this;
}

Force.prototype.getObject3D = function(){
    return this.arrow;
};

Force.prototype.setForce = function(force){
    this.force = force.sub(this.selfWeight);
    this.update();
};

Force.prototype.setOrigin = function(origin){
    this.arrow.position.set(origin.x, 0, origin.z);
};

Force.prototype.setSelfWeight = function(selfWeight){
    this.selfWeight = selfWeight;
    this.update();
};

Force.prototype.getMagnitude = function(){//has sign
    return this.getForce().length()*(this.getDirection().y < 0 ? -1 : 1);
};

Force.prototype.getLength = function(){
    return this.getForce().length();
};

Force.prototype.setMagnitude = function(magnitude){
    var totalForce = this.getDirection().multiplyScalar(magnitude);
    this.setForce(totalForce);
};

Force.prototype.getDirection = function(){
    return this.getForce().normalize();
};

Force.prototype.getForce = function(){
    return this.force.clone().add(this.selfWeight);
};

Force.prototype.highlight = function(){
    this.arrow.line.material.color.setHex(0x000000);
    this.arrow.cone.material.color.setHex(0x000000);
};

Force.prototype.unhighlight = function(){
    this.arrow.line.material.color.setHex(0x999999);
    this.arrow.cone.material.color.setHex(0x999999);
};

Force.prototype.getPosition = function(){
    return this.arrow.position;
};

Force.prototype.hide = function(){
    this.arrow.visible = false;
};

Force.prototype.show = function(){
    this.arrow.visible = true;
};

Force.prototype.update = function(){
    this.arrow.setDirection(this.getDirection());
    var length = this.getLength();
    if (length<1.1) length = 1.1;//prevent arrow from having zero length
    this.arrow.setLength(length, 1, 1);
};

Force.prototype.destroy = function(){
    this.arrow.cone._myForce = null;
    this.arrow = null;
};