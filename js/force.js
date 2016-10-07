/**
 * Created by ghassaei on 10/2/16.
 */


function Force(force, origin){
    this.setForce(force);
    this.arrow = new THREE.ArrowHelper(this.getDirection(), origin, this.getMagnitude(), 0x0000ff);
    this.arrow.setLength(this.getMagnitude(), 1, 1);
    this.arrow.line.material.linewidth = 4;
    this.arrow.cone._myForce = this;
}

Force.prototype.getObject3D = function(){
    return this.arrow;
};

Force.prototype.setForce = function(force){
    this.force = force;
};

Force.prototype.getMagnitude = function(){
    return this.force.length();
};

Force.prototype.setMagnitude = function(magnitude){
    this.setForce(this.getDirection().multiplyScalar(magnitude));
};

Force.prototype.getDirection = function(){
    return this.force.clone().normalize();
};

Force.prototype.setDirection = function(x, y){
    var unitVector = new THREE.Vector3(x,y,0);
    this.arrow.setDirection(unitVector);
    this.setForce(unitVector.clone().multiplyScalar(this.getMagnitude()));
};

Force.prototype.getForce = function(){
    return this.force.clone();
};

Force.prototype.highlight = function(){
    this.arrow.line.material.color.setHex(0x000000);
    this.arrow.cone.material.color.setHex(0x000000);
};

Force.prototype.unhighlight = function(){
    this.arrow.line.material.color.setHex(0xaaaaaa);
    this.arrow.cone.material.color.setHex(0xaaaaaa);
};

Force.prototype.hide = function(){
    this.arrow.visible = false;
};

Force.prototype.update = function(position, scale){
    this.arrow.position.set(position*scale/2, 0, 0.1);
    this.arrow.setDirection(this.getDirection());
    this.arrow.setLength(3*this.getMagnitude()/scale, 10/scale, 10/scale);
};

Force.prototype.move = function(intersection){
    var force = (intersection.sub(new THREE.Vector3(-152.5, 20, 0)).sub(this.arrow.position)).multiplyScalar(1/3);
    force.z = 0;
    this.setForce(force);
};

Force.prototype.destroy = function(){
    this.arrow.cone._myForce = null;
    this.arrow = null;
};