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
        globals.shouldResetDynamicSim = true;
    });

    var colors=[
        "#b67df0",
        "#8cbaed",
        "#000000",
        "#d0caca",
        "#f9cdad",
        "#ef4666"
    ];

    var newMaterialNum = 1;
    function materialTypeCallback(val){
        globals.currentMaterial = val;
    }
    var newMaterialCallback = function(){
        var newId = "material" + newMaterialNum;
        var color = colors[newMaterialNum-1];
        $("#materialTypes").append(makeMaterialHTML(newId, color));
        var $parent = $("#" + newId).parent();
        var val = 15;
        setSliderInput("#" + newId, val, 1, 70, 0.01, function(val){
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

    function makeMaterialHTML(newId, color){
        var html = '<label class="radio">' +
            '<input name="materialTypes" value="' + newId + '" data-toggle="radio" checked="" class="custom-radio" type="radio">' +
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

    setCheckbox("#selfWeight", globals.applySelfWeight, function(val){
        var $density = $("#density");
        if (val == true) $density.show();
        else $density.hide();
        globals.applySelfWeight = val;
        globals.schematic.setSelfWeight();
    });

    setRadio("viewMode", globals.viewMode, function(val){
        globals.viewMode = val;
        globals.viewModeNeedsUpdate = true;
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
        $('#aboutModal').modal('show')
    });

    setCheckbox("#dynamic", globals.dynamicSimVisible, function(val){
        globals.dynamicSimVisible = val;
        globals.dynamicModel.setVisibility(val);
        if (val) $(".dynamicSim").show();
        else  $(".dynamicSim").hide();
    });
    setCheckbox("#fdm", globals.fdmSimVisible, function(val){
        globals.fdmSimVisible = val;
        //globals.fdmModel.setVisibility(val);//todo add this in
    });

    setSlider("#damping", globals.percentDamping, 0.01, 1, 0.01, function(val){
        globals.percentDamping = val;
        globals.dynamicSimMaterialsChanged = true;
    }, function(){
        globals.shouldResetDynamicSim = true;
    });

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
        slider.on("slide", function(){
            var val = slider.slider('value');
            callback(val);
        });
        slider.on("slidestop", function(){
            var val = slider.slider('value');
            if (callbackOnStop) callbackOnStop(val);
        })
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
        slider.on("slide", function(){
            var val = slider.slider('value');
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

