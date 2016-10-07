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

    _globals.xResolution = 10;
    _globals.zResolution = 10;
    _globals.xLength = 30;
    _globals.zLength = 30;
    _globals.planeHeight = 0;

    function setXResolution(val){
        _globals.xResolution = val;
        schematic.update();
    }
    function setZResolution(val){
        _globals.zResolution = val;
        schematic.update();
    }
    function setXLength(val){
        _globals.xLength = val;
        schematic.update();
    }
    function setZLength(val){
        _globals.ZLength = val;
        schematic.update();
    }

    _globals.threeView = initThreeView(_globals);
    _globals.controls = initControls(_globals);
    _globals.schematic = initSchematic(_globals);

    return _globals;
}