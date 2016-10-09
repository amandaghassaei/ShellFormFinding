/**
 * Created by ghassaei on 10/7/16.
 */


function initGlobals(){

    var _globals = {
        setXResolution: setXResolution,
        setZResolution: setZResolution,
        setXLength: setXLength,
        setZLength: setZLength,
        setForceHasChanged: setForceHasChanged,
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
    _globals.currentMaterial = "material2";
    _globals.viewMode = "none";
    _globals.viewModeNeedsUpdate = false;
    _globals.dynamicSimVisible = true;
    _globals.fdmSimVisible = false;
    _globals.dynamicSimMaterialsChanged = false;

    function setXResolution(val){
        _globals.xResolution = val;
        schematic.update();
        _globals.shouldResetDynamicSim = true;
        _globals.shouldResetFDM = true;
    }
    function setZResolution(val){
        _globals.zResolution = val;
        schematic.update();
        _globals.shouldResetDynamicSim = true;
        _globals.shouldResetFDM = true;
    }
    function setXLength(val){
        _globals.xLength = val;
        schematic.update();
        _globals.shouldResetDynamicSim = true;
        _globals.shouldResetFDM = true;
    }
    function setZLength(val){
        _globals.ZLength = val;
        schematic.update();
        _globals.shouldResetDynamicSim = true;
        _globals.shouldResetFDM = true;
    }

    function setForceHasChanged(){
        _globals.forceHasChanged = true;
    }

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