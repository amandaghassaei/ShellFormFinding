/**
 * Created by ghassaei on 10/7/16.
 */


function initGlobals(){

    var _globals = {
        setXResolution: setXResolution,
        setZResolution: setZResolution,
        setXLength: setXLength,
        setZLength: setZLength,
        setForceHasChanged: setForceHasChanged
    };

    _globals.shouldResetDynamicSim = false;
    _globals.shouldResetFDM = false;
    _globals.xResolution = 5;
    _globals.zResolution = 5;
    _globals.xLength = 30;
    _globals.zLength = 30;
    _globals.planeHeight = 0;
    _globals.selfWeight = true;
    _globals.forceHasChanged = false;

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

    _globals.threeView = initThreeView(_globals);
    _globals.gpuMath = initGPUMath();
    _globals.controls = initControls(_globals);
    _globals.schematic = initSchematic(_globals);
    _globals.dynamicModel = initDynamicModel(_globals);


    return _globals;
}