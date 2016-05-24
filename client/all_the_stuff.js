var timeline = null;
var timeline_ctx = null;

window.onload = function(){
	var socket = io.connect('http://' + window.location.host);
	socket.on('new', function(data){
		console.log(data);
	});
	socket.on('past', function(data){
		console.log(data);
	});

	timeline = document.getElementById('timeline');
	timeline_ctx = timeline.getContext("2d");

	timeline_ctx.moveTo(0,0);
	timeline_ctx.lineTo(0, timeline.height / 2);
	timeline_ctx.strokeStyle = "#fff";
	timeline_ctx.lineWidth = 8
	timeline_ctx.stroke();
};

function new_request(){
}
