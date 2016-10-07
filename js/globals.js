/**
 * Created by ghassaei on 10/7/16.
 */


function initGlobals(){

    var _globals = {
        setXResolution: setXResolution,
        setZResolution: setZResolution,
        setXLength: setXLength,
        setZLength: setZLength
    };

    _globals.dynamicGeoNeedsClone = false;
    _globals.FDMGeoNeedsClone = false;
    _globals.xResolution = 10;
    _globals.zResolution = 10;
    _globals.xLength = 30;
    _globals.zLength = 30;
    _globals.planeHeight = -10;
    _globals.selfWeight = true;

    function setXResolution(val){
        _globals.xResolution = val;
        schematic.update();
        _globals.dynamicGeoNeedsClone = true;
        _globals.FDMGeoNeedsClone = true;
    }
    function setZResolution(val){
        _globals.zResolution = val;
        schematic.update();
        _globals.dynamicGeoNeedsClone = true;
        _globals.FDMGeoNeedsClone = true;
    }
    function setXLength(val){
        _globals.xLength = val;
        schematic.update();
        _globals.dynamicGeoNeedsClone = true;
        _globals.FDMGeoNeedsClone = true;
    }
    function setZLength(val){
        _globals.ZLength = val;
        schematic.update();
        _globals.dynamicGeoNeedsClone = true;
        _globals.FDMGeoNeedsClone = true;
    }

    _globals.threeView = initThreeView(_globals);
    _globals.controls = initControls(_globals);
    _globals.schematic = initSchematic(_globals);
    _globals.dynamicModel = initDynamicModel(_globals);

    return _globals;
}