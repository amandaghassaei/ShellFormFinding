/**
 * Created by ghassaei on 10/7/16.
 */


function initControls(globals){

    $("#logo").mouseenter(function(){
        $("#activeLogo").show();
        $("#inactiveLogo").hide();
    });
    $("#logo").mouseleave(function(){
        $("#inactiveLogo").show();
        $("#activeLogo").hide();
    });

    var $moreInfo = $("#moreInfo");
    var $moreInfoInput = $("#moreInfo>input");
    var $moreInfoSpan = $("#moreInfo>span");
    function showMoreInfo(string, e){
        $moreInfo.children("span").html(string);
        $moreInfo.css({top: e.clientY - 50, left: e.clientX + 10});
        $moreInfoSpan.show();
        $moreInfoInput.hide();
        $moreInfo.show();
    }
    function hideMoreInfo(){
        $moreInfo.hide();
    }
    function editMoreInfo(val, callback){
        var $moreInfo = $("#moreInfo");
        $moreInfoInput.show();
        $moreInfoSpan.hide();
        $moreInfoInput.focus();
        $moreInfoInput.val(val);
        $moreInfoInput.change(function(){
            $moreInfoInput.hide();
            $moreInfoInput.unbind("change");
            $moreInfo.hide();
            var newVal = $moreInfoInput.val();
            if (isNaN(parseFloat(newVal))) return;
            newVal = parseFloat(newVal);
            callback(newVal);
        })
    }

    setLink("#resetDynamicSim", function(){
        globals.resetSimFromInitialState();
    });

    var colors=[
        "#b67df0",
        "#8cbaed",
        "#555555",
        "#d0caca",
        "#f9cdad",
        "#ef4666"
    ];

    var newMaterialNum = 1;
    function materialTypeCallback(val){
        globals.currentMaterial = val;
    }
    $("input[name=materialTypes]").on('change', function() {
        var state = $("input[name=materialTypes]:checked").val();
        materialTypeCallback(state);
    });
    var newMaterialCallback = function(){
        var newId = "material" + newMaterialNum;
        var color = colors[newMaterialNum-1];
        $("#materialTypes").append(makeMaterialHTML(newId, color));
        var $parent = $("#" + newId).parent();
        var val = 2;
        setLogSliderInput("#" + newId, val, 0.5, 30, 0.01, function(val){
            globals.setMaterial(newId, val);
        });
        $parent.children(".editable").click(function(e){
            e.preventDefault();
            var $target = $(e.target);
            $target.hide();
            $target.blur();
            $target.parent().children(".radioSlider").hide();
            var $input = $target.parent().children(".editableInput");
            $input.show();
            $input.focus();
            var value = $input.val();
            $input.val('');
            $input.val(value);//put at end of string
        });
        var editableInputCallback = function(e) {
            var $target = $(e.target);
            $target.hide();
            var label = $target.parent().children(".editable");
            label.html($target.val());
            label.show();
            $target.parent().children(".radioSlider").show();
            globals.setMaterial(newId, null, null, $target.val());
        };
        $parent.children(".editableInput").blur(editableInputCallback);
        $parent.children(".editableInput").change(editableInputCallback);
        globals.setMaterial(newId, val, color, "Material " + newMaterialNum);
        globals.currentMaterial = newId;
        $parent.children("input[name=materialTypes]").prop("checked", true);
        $parent.children("input[name=materialTypes]").on('change', function() {
            var state = $("input[name=materialTypes]:checked").val();
            materialTypeCallback(state);
        });
        newMaterialNum++;
        if (newMaterialNum> colors.length){
            $("#addMaterial").hide();
        }
    };
    setLink("#addMaterial", newMaterialCallback);
    newMaterialCallback();
    globals.currentMaterial = "none";

    function makeMaterialHTML(newId, color){
        var html = '<label class="radio">' +
            '<input name="materialTypes" value="' + newId + '" data-toggle="radio" class="custom-radio" type="radio">' +
            '<span class="icons"><span class="icon-unchecked"></span><span class="icon-checked"></span></span>' +
            '<a href="#" class="editable">Material ' + newMaterialNum + '</a><input class="editableInput" value="Material ' + newMaterialNum + '" type="text">' +
            '<div class="radioSlider" id="' + newId + '">' +
            '<span class="label-slider"></span><div class="flat-slider ui-slider ui-corner-all ui-slider-horizontal ui-widget ui-widget-content"></div>' +
            '<input value="" style="border-color:' + color + ';" placeholder="" class="form-control colorPicker" type="text">'+
            '</div>' +
            '</label>';
        return html;
    }

    setLink("#addRemoveFixed", function(){
        globals.addRemoveFixedMode = true;
    });

    setSliderInput("#density", globals.density, 0.0001, 0.1, 0.001, function(val){
        globals.density = val;
        globals.schematic.setSelfWeight();
    });
    setSliderInput("#width", globals.xLength, 1, 100, 0.1, function(val){
        globals.xLength = val;
        globals.schematic.setScale(globals.xLength, globals.zLength);
    });
    setSliderInput("#length", globals.zLength, 1, 100, 0.1, function(val){
        globals.zLength = val;
        globals.schematic.setScale(globals.xLength, globals.zLength);
    });

    setCheckbox("#selfWeight", globals.applySelfWeight, function(val){
        var $density = $("#density");
        if (val == true) $density.show();
        else $density.hide();
        globals.applySelfWeight = val;
        globals.schematic.setSelfWeight();
        if (!val){
            $("input[name=selfWeightMode]").each(function(i) {
                $(this).prop('disabled', true);
            });
            $(".selfWeightMode").css({opacity: 0.5});
        } else {
            $("input[name=selfWeightMode]").each(function(i) {
                $(this).prop('disabled', false);
            });
            $(".selfWeightMode").css({opacity: 1});
        }
    });

    setRadio("selfWeightMode", globals.selfWeightMode, function(val){
        globals.selfWeightMode = val;
        if (val == "constant"){
            globals.schematic.setSelfWeight();
        }
    });

    setRadio("viewMode", globals.viewMode, function(val){
        globals.setViewMode(val);
        var $scaleBars = $("#scaleBars");
        var $controls = $("#controls");
        if (val == "none" || val == "material"){
            $scaleBars.animate({right: -100});
            $controls.animate({right:0});
        } else {
            $scaleBars.animate({right: 0});
            $controls.animate({right:100});
        }
        globals.dynamicModel.setViewMode(val);
        globals.staticModel.setViewMode(val);
    });

    var scaleHTML = "";
    for (var i=0;i<=20;i++){
        scaleHTML += "<div>";
        scaleHTML += "<div id='swatch" + i + "' class='colorSwatch'></div>";
        if (i%5 == 0) scaleHTML += "<span id='label" + i + "'></span>";
        scaleHTML += "</div>";
    }
    $("#scaleBars").html(scaleHTML);

    function updateScaleBars(min, max){
        for (var i=0;i<=20;i++){
            var val = (max-min)*(20-i)/20+min;
            $("#swatch" + i).css("background", hexForVal(val, min, max));
            if (i%5 == 0) $("#label" + i).html(val.toFixed(2));
        }
    }
    function hexForVal(val, min, max){
        var scaledVal = (1-(val - min)/(max - min)) * 0.7;
        var color = new THREE.Color();
        color.setHSL(scaledVal, 1, 0.5);
        return "#" + color.getHexString();
    }

    setLink("#about", function(){
        $('#aboutModal').modal('show');
    });

    var dynamicSimVisCallback = function(val){
        if (globals.dynamicModel) globals.dynamicModel.setVisibility(val);
        if (globals.staticModel) globals.staticModel.setSolid(!val);
        if (val) $(".dynamicSim").show();
        else  {
            $(".dynamicSim").hide();
            if (globals.viewMode == "length" || globals.viewMode == "force") globals.staticModel.setEdgeColors();
        }
    };
    setCheckbox("#dynamic", globals.dynamicSimVisible, function(val){
        globals.dynamicSimVisible = val;
        dynamicSimVisCallback(val);
    });
    dynamicSimVisCallback(globals.dynamicSimVisible);
    setCheckbox("#static", globals.staticSimVisible, function(val){
        globals.staticSimVisible = val;
        globals.staticModel.setVisibility(val);
    });

    setCheckbox("#schematic", globals.schematicVisible, function(val){
        globals.schematicVisible = val;
        globals.schematic.setVisibility(val);
        if (val) $("#schematicOptions").show();
        else $("#schematicOptions").hide();
    });
    setCheckbox("#lockForces", globals.lockForces, function(val){
        globals.lockForces = val;
    });
    setCheckbox("#lockTopology", globals.lockTopology, function(val){
        globals.lockTopology = val;
        //globals.schematic.setVisibility(val);
    });
    setCheckbox("#lockFixedZPosition", globals.lockFixedZPosition, function(val){
        globals.lockFixedZPosition = val;

    });

    setSlider("#damping", globals.percentDamping, 0.01, 1, 0.01, function(val){
        globals.percentDamping = val;
        globals.dynamicSimMaterialsChanged = true;
    }, function(){
        globals.resetSimFromInitialState();
    });

    setLink("#download", function(){
        var blob = new Blob([globals.staticModel.getInfo()], {type: "text/plain;charset=utf-8"});
        saveAs(blob, "shell.txt");
    });

    setLink("#exportSTL", function(){
        if (!globals.exportSTL) globals.exportSTL = initExportSTL(globals);
        globals.setSTLEditing(true);
    });

    setLink("#designMode", function(){
        globals.setSTLEditing(false);
    });

    setButtonGroup("#unitsDropdown", function(val){
        globals.exportSTL.setUnits(val);
    });

    setSliderInput("#stlScale", globals.stlScale, 0.0001, 0.02, 0.0001, function(val){
        globals.stlScale = val;
        globals.exportSTL.setScale();
    });

    setSliderInput("#beamThicknessScale", globals.beamThicknessScale, 0.01, 1, 0.001, function(val){
        globals.beamThicknessScale = val;
        globals.exportSTL.render();
    });

    setCheckbox("#addBase", globals.addBase, function(val){
        globals.addBase = val;
        globals.exportSTL.addBase();
    });

    setLink("#saveSTL", function(){
        globals.exportSTL.saveSTL();
    });

    setCheckbox("#useForces", globals.useForces, function(val){
        globals.useForces = val;
        globals.exportSTL.render();
    });


    function setButtonGroup(id, callback){
        $(id+" a").click(function(e){
            e.preventDefault();
            var $target = $(e.target);
            var val = $target.data("id");
            if (val) {
                $(id+" span.dropdownLabel").html($target.html());
                callback(val);
            }
        });
    }

    function setLink(id, callback){
        $(id).click(function(e){
            e.preventDefault();
            callback(e);
        });
    }

    function setRadio(name, val, callback){
        $("input[name=" + name + "]").on('change', function() {
            var state = $("input[name="+name+"]:checked").val();
            callback(state);
        });
        $(".radio>input[value="+val+"]").prop("checked", true);
    }

    function setInput(id, val, callback, min, max){
        var $input = $(id);
        $input.change(function(){
            var val = $input.val();
            if ($input.hasClass("int")){
                if (isNaN(parseInt(val))) return;
                val = parseInt(val);
            } else {
                if (isNaN(parseFloat(val))) return;
                val = parseFloat(val);
            }
            if (min !== undefined && val < min) val = min;
            if (max !== undefined && val > max) val = max;
            $input.val(val);
            callback(val);
        });
        $input.val(val);
    }

    function setCheckbox(id, state, callback){
        var $input  = $(id);
        $input.on('change', function () {
            if ($input.is(":checked")) callback(true);
            else callback(false);
        });
        $input.prop('checked', state);
    }

    function setSlider(id, val, min, max, incr, callback, callbackOnStop){
        var slider = $(id).slider({
            orientation: 'horizontal',
            range: false,
            value: val,
            min: min,
            max: max,
            step: incr
        });
        slider.on("slide", function(e, ui){
            var val = ui.value;
            callback(val);
        });
        slider.on("slidestop", function(){
            var val = slider.slider('value');
            if (callbackOnStop) callbackOnStop(val);
        })
    }

    function setLogSliderInput(id, val, min, max, incr, callback){

        var scale = (Math.log(max)-Math.log(min)) / (max-min);

        var slider = $(id+">div").slider({
            orientation: 'horizontal',
            range: false,
            value: (Math.log(val)-Math.log(min)) / scale + min,
            min: min,
            max: max,
            step: incr
        });

        var $input = $(id+">input");
        $input.change(function(){
            var val = $input.val();
            if ($input.hasClass("int")){
                if (isNaN(parseInt(val))) return;
                val = parseInt(val);
            } else {
                if (isNaN(parseFloat(val))) return;
                val = parseFloat(val);
            }

            var min = slider.slider("option", "min");
            if (val < min) val = min;
            if (val > max) val = max;
            $input.val(val);
            slider.slider('value', (Math.log(val)-Math.log(min)) / scale + min);
            callback(val, id);
        });
        $input.val(val);
        slider.on("slide", function(e, ui){
            var val = ui.value;
            val = Math.exp(Math.log(min) + scale*(val-min));
            $input.val(val.toFixed(4));
            callback(val, id);
        });
    }

    function setSliderInput(id, val, min, max, incr, callback){

        var slider = $(id+">div").slider({
            orientation: 'horizontal',
            range: false,
            value: val,
            min: min,
            max: max,
            step: incr
        });

        var $input = $(id+">input");
        $input.change(function(){
            var val = $input.val();
            if ($input.hasClass("int")){
                if (isNaN(parseInt(val))) return;
                val = parseInt(val);
            } else {
                if (isNaN(parseFloat(val))) return;
                val = parseFloat(val);
            }

            var min = slider.slider("option", "min");
            if (val < min) val = min;
            if (val > max) val = max;
            $input.val(val);
            slider.slider('value', val);
            callback(val);
        });
        $input.val(val);
        slider.on("slide", function(e, ui){
            var val = ui.value;
            $input.val(val);
            callback(val);
        });
    }

    function update(){
        function setInput(id, val){
            $(id).val(val);
        }
    }

    return {
        update:update,
        showMoreInfo: showMoreInfo,
        hideMoreInfo: hideMoreInfo,
        editMoreInfo: editMoreInfo,
        updateScaleBars: updateScaleBars
    }
}

