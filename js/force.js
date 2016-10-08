/**
 * Created by ghassaei on 10/2/16.
 */


function Force(force, origin){
    this.force = force;
    this.arrow = new THREE.ArrowHelper(this.getDirection(), origin, this.getMagnitude(), 0xb67df0);
    this.arrow.line.material.linewidth = 4;
    this.update();
    this.arrow.cone._myForce = this;
}

Force.prototype.getObject3D = function(){
    return this.arrow;
};

Force.prototype.setForce = function(force){
    this.force = force;
    this.update();
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
    this.arrow.line.material.color.setHex(0x7700f1);
    this.arrow.cone.material.color.setHex(0x7700f1);
};

Force.prototype.unhighlight = function(){
    this.arrow.line.material.color.setHex(0xb67df0);
    this.arrow.cone.material.color.setHex(0xb67df0);
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
    this.arrow.setLength(this.getMagnitude(), 1, 1);
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