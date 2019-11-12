$("#linkCredits").on("click", function() {
    console.log("CLICK!");
});
//Modal:
// var darkness = document.getElementById("darkness");
var exitModal = $("#exit-modal");
var modalContainer = $(".modal-container");

$("body").on("click", function() {
    console.log("click");
    modalContainer.show().css("display", "flex");
});

$("#linkCredits").on("click", function() {
    console.log("click");
    modalContainer.show().css("display", "flex");
});

exitModal.on("click", function() {
    modalContainer.remove();
});

var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");
let drawing;
let prevPosition = [];
let canvasData;

$("#canvas").on("mousedown", function() {
    drawing = true;
    prevPosition = [];
    drawSignature();
});

$("#canvas").on("mouseup", function() {
    drawing = false;
    canvasData = canvas.toDataURL("image/png");
    $("#signature").val(canvasData);
    console.log("canvasData: ", canvasData);
    drawSignature();
});

function drawSignature() {
    $("#canvas").on("mousemove", function(e) {
        if (!drawing) {
            return;
        } else {
            context.strokeStyle = "darkblue";
            context.lineWidth = 3;
            context.beginPath();
            context.moveTo(prevPosition[0], prevPosition[1]);
            context.lineTo(e.pageX - this.offsetLeft, e.pageY - this.offsetTop);
            context.stroke();
            prevPosition = [
                e.pageX - this.offsetLeft,
                e.pageY - this.offsetTop
            ];
        }
    });
}
