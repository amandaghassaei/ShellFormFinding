/**
 * Created by ghassaei on 10/7/16.
 */

$(function() {

    var threeView = initThreeView();

    window.addEventListener('resize', function(){
        threeView.onWindowResize();
    }, false);

    $("#logo").mouseenter(function(){
        $("#activeLogo").show();
    });
    $("#logo").mouseleave(function(){
        $("#activeLogo").hide();
    });






});