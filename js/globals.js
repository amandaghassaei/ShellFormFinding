/**
 * Created by ghassaei on 10/7/16.
 */


function initGlobals(){

    var _globals = {
        setMaterial: setMaterial,
        setViewMode: setViewMode,
        forceArrayUpdated: forceArrayUpdated,
        resetSimFromInitialState: resetSimFromInitialState,
        setFixedHasChanged: setFixedHasChanged
    };

    _globals.xResolution = 5;
    _globals.zResolution = 5;
    _globals.xLength = 30;
    _globals.zLength = 30;
    _globals.planeHeight = 0;
    _globals.density = 0.01;
    _globals.materials = {};
    _globals.currentMaterial = "none";
    _globals.viewMode = "none";
    _globals.percentDamping = 0.5;

    //flags
    _globals.viewModeNeedsUpdate = false;
    _globals.dynamicSimVisible = true;
    _globals.staticSimVisible = true;
    _globals.dynamicSimMaterialsChanged = false;
    _globals.applySelfWeight = true;
    _globals.forceHasChanged = false;
    _globals.addRemoveFixedMode = false;
    _globals.fixedHasChanged = false;
    _globals.shouldResetDynamicSim = false;

    function setMaterial(id, val, color, name){
        if (_globals.materials[id]){
            _globals.materials[id].setVal(val);
            _globals.materials[id].setName(name);
        } else {
            _globals.materials[id] = new Material(val, color, name);
        }
    }

    function setViewMode(val){
        _globals.viewMode = val;
        _globals.viewModeNeedsUpdate = true;//set flag for dynamic sim
    }

    function forceArrayUpdated(){
        globals.forceHasChanged = true;
        if (globals.staticModel) globals.staticModel.resetForceArray();
    }

    function resetSimFromInitialState(){//for dynamic simulation
        _globals.shouldResetDynamicSim = true;
    }

    function setFixedHasChanged(state){
        _globals.fixedHasChanged = true;
        _globals.staticModel.updateFixed();
        if (state) resetSimFromInitialState();//reset dynamic sim flag
    }

    _globals.threeView = initThreeView(_globals);
    _globals.gpuMath = initGPUMath();
    _globals.controls = initControls(_globals);

    return _globals;
}