/**
 * Created by ghassaei on 10/8/16.
 */


function Material(val, color, name){
    this.val = val;
    this.name = name;
}

Material.prototype.setVal = function(val){
    if (val === undefined || val === null) return;
    this.val = val;
    globals.dynamicSimMaterialsChanged = true;
};

Material.prototype.setName = function(name){
    if (name === undefined || name === null) return;
    this.name = name;
};

Material.prototype.getStiffness = function(){
    return this.val;
};