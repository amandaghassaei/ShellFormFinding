/**
 * Created by ghassaei on 10/7/16.
 */


function initControls(globals){

    $("#logo").mouseenter(function(){
        $("#activeLogo").show();
    });
    $("#logo").mouseleave(function(){
        $("#activeLogo").hide();
    });

    var $moreInfo = $("#moreInfo");
    function showMoreInfo(string, e){
        $moreInfo.html(string);
        $moreInfo.css({top: e.clientY - 50, left: e.clientX + 10});
        $moreInfo.show();
    }
    function hideMoreInfo(){
        $moreInfo.hide();
    }

    setLink("#resetDynamicSim", function(){
        globals.dynamicModel.reset();
    });

    var newMaterialNum = 1;
    var newMaterialCallback = function(){
        var newId = "material" + newMaterialNum;
        $("#materialTypes").append(makeMaterialHTML(newId));
        var $parent = $("#" + newId).parent();
        var val = 4;
        setSliderInput("#" + newId, val, 0.1, 30, 0.01, function(val){
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
        globals.setMaterial(newId, val, 0x123456, "Material " + newMaterialNum);
        newMaterialNum++;
    };
    setLink("#addMaterial", newMaterialCallback);
    newMaterialCallback();

    function makeMaterialHTML(newId){
        var html = '<label class="radio">' +
            '<input name="materialTypes" value="' + newId + '" data-toggle="radio" checked="" class="custom-radio" type="radio">' +
            '<span class="icons"><span class="icon-unchecked"></span><span class="icon-checked"></span></span>' +
            '<a href="#" class="editable">Material ' + newMaterialNum + '</a><input class="editableInput" value="Material 1" type="text">' +
            '<div class="radioSlider" id="' + newId + '">' +
            '<span class="label-slider"></span><div class="flat-slider ui-slider ui-corner-all ui-slider-horizontal ui-widget ui-widget-content"></div>' +
            '<input value="" placeholder="" class="form-control" type="text">'+
            '</div>' +
            '</label>';
        return html;
    }

    setLink("#addRemoveFixed", function(){
        globals.addRemoveFixedMode = true;
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
        hideMoreInfo: hideMoreInfo
    }
}

