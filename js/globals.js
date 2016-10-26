/**
 * Created by ghassaei on 10/7/16.
 */


function initGlobals(){

    var _globals = {
        setMaterial: setMaterial,
        setViewMode: setViewMode,
        forceArrayUpdated: forceArrayUpdated,
        resetSimFromInitialState: resetSimFromInitialState,
        setFixedHasChanged: setFixedHasChanged,
        setSTLEditing: setSTLEditing
    };

    _globals.xResolution = 5;
    _globals.zResolution = 5;
    _globals.xLength = 30;
    _globals.zLength = 30;
    _globals.planeHeight = 0;
    _globals.density = 0.06;
    _globals.materials = {};
    _globals.currentMaterial = "none";
    _globals.viewMode = "none";
    _globals.percentDamping = 0.5;

    //flags
    _globals.viewModeNeedsUpdate = false;
    _globals.dynamicSimVisible = true;
    _globals.staticSimVisible = true;
    _globals.schematicVisible = true;
    _globals.lockTopology = false;
    _globals.lockForces = false;
    _globals.dynamicSimMaterialsChanged = false;
    _globals.applySelfWeight = true;
    _globals.forceHasChanged = false;
    _globals.addRemoveFixedMode = false;
    _globals.fixedHasChanged = false;
    _globals.shouldResetDynamicSim = false;

    //stl
    _globals.stlEditing = false;
    _globals.stlScale = 0.001;
    _globals.beamThicknessScale = 0.15;
    _globals.addBase = true;

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

    function setSTLEditing(state){
        _globals.stlEditing = state;
        globals.threeView.setSTLEditing(state);

        var $controls = $("#controls");
        var $controlsLeft = $("#controlsLeft");
        var $scaleBars = $("#scaleBars");
        var $exportSTLControls = $("#exportSTLControls");

        if (state){
            $scaleBars.animate({right: -100});
            if (_globals.viewMode == "none" || _globals.viewMode == "material"){
                $controlsLeft.animate({left: -305});
                $controls.animate({right: -420}, function(){
                    $exportSTLControls.animate({right:0});
                });
            } else {
                $controls.animate({right: 0}, function () {
                    $controlsLeft.animate({left: -305});
                    $controls.animate({right: -420}, function () {
                        $exportSTLControls.animate({right: 0});
                    });
                });
            }
            _globals.exportSTL.render();
        } else {
            $exportSTLControls.animate({right:-420}, function(){
                $controlsLeft.animate({left: 0});
                if (_globals.viewMode == "none" || _globals.viewMode == "material"){
                    $scaleBars.animate({right: -100});
                    $controls.animate({right:0});
                } else {
                    $controls.animate({right:0}, function(){
                        $scaleBars.animate({right: 0});
                        $controls.animate({right:100});
                    });

                }
            });
        }
    }

    _globals.threeView = initThreeView(_globals);
    _globals.gpuMath = initGPUMath();
    _globals.controls = initControls(_globals);

    return _globals;
}