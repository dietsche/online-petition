var exitModal = $("#exit-modal");
var modalContainer = $(".modal-container");

$("#linkCredits").on("click", function() {
    modalContainer.show().css("display", "flex");
});

exitModal.on("click", function() {
    modalContainer.show().css("display", "none");
});

$("#thanks").ready(function() {
    setTimeout(function() {
        $("#thanks").fadeOut(1500);
        setTimeout(function() {
            $("#congrats").css("display", "inline");
        }, 1500);
    }, 500);
});

var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");
var drawing;
var prevPosition = [];
var canvasData;

$(canvas).on("mousedown", function() {
    drawing = true;
    prevPosition = [];
    drawSignature();
});

$(canvas).on("mouseup", function() {
    drawing = false;
    canvasData = canvas.toDataURL("image/png");
    $("#signature").val(canvasData);
    drawSignature();
});

function drawSignature() {
    $(canvas).on("mousemove", function(e) {
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
