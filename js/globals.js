/**
 * Created by ghassaei on 10/7/16.
 */


function initGlobals(){

    var _globals = {
        setMaterial: setMaterial
    };

    _globals.shouldResetDynamicSim = false;
    _globals.shouldResetFDM = false;
    _globals.xResolution = 5;
    _globals.zResolution = 5;
    _globals.xLength = 30;
    _globals.zLength = 30;
    _globals.planeHeight = 0;
    _globals.density = 0.01;
    _globals.applySelfWeight = true;
    _globals.forceHasChanged = false;
    _globals.addRemoveFixedMode = false;
    _globals.materials = {};
    _globals.currentMaterial = "none";
    _globals.viewMode = "none";
    _globals.viewModeNeedsUpdate = false;
    _globals.dynamicSimVisible = true;
    _globals.staticSimVisible = true;
    _globals.fdmSimVisible = false;
    _globals.dynamicSimMaterialsChanged = false;
    _globals.percentDamping = 0.5;

    function setMaterial(id, val, color, name){
        if (_globals.materials[id]){
            _globals.materials[id].setVal(val);
            _globals.materials[id].setName(name);
        } else {
            _globals.materials[id] = new Material(val, color, name);
        }
    }

    _globals.threeView = initThreeView(_globals);
    _globals.gpuMath = initGPUMath();
    _globals.controls = initControls(_globals);

    return _globals;
}