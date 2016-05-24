var timeline = null;
var timeline_ctx = null;
var timeline_update_interval = 500;
var clients = null;
var servers = null;

var log_entries = [];

window.onload = function(){
	var socket = io.connect('http://' + window.location.host);
	socket.on('new', function(data){
		new_request(data);
		log_entries.push(data);
		timeline_update();
	});
	socket.on('past', function(data){
		log_entries = data;
		timeline_update();
	});

	clients = document.getElementById('clients-list');
	servers = document.getElementById('resources-list');

	timeline = document.getElementById('timeline');
	timeline.width = timeline.parentElement.offsetWidth;
	timeline.height = timeline.parentElement.offsetHeight - 30;
	timeline_ctx = timeline.getContext("2d");

	window.setInterval(timeline_update, timeline_update_interval);
};

function new_request(request){
	if(!Array.from(clients.children).find(function(c){
		return request.from == c.innerHTML;
	})){
		var new_client = document.createElement('div');
		new_client.innerHTML = request.from;
		clients.appendChild(new_client);
	}

	if(!Array.from(servers.children).find(function(c){
		return request.path == c.innerHTML;
	})){
		var new_server = document.createElement('div');
		new_server.innerHTML = request.path;
		servers.appendChild(new_server);
	}
}

function timeline_update(){
	timeline_ctx.clearRect(0, 0, timeline.width, timeline.height);

	timeline_ctx.beginPath()

	timeline_ctx.strokeStyle = "#fff";
	timeline_ctx.lineWidth = 1;

	log_entries.forEach(function(request){
		var seconds_diff = (Date.now() - request.time) / 1000;
		var lineX = timeline.width - (seconds_diff * 2);

		timeline_ctx.moveTo(lineX, 0);
		timeline_ctx.lineTo(lineX, timeline.height);
		timeline_ctx.stroke();
	});


	var x = timeline.width;
	timeline_ctx.fillStyle = "#fff";
	while(x >= 0){
		timeline_ctx.moveTo(x, timeline.height - 10);
		timeline_ctx.lineTo(x, timeline.height);
		timeline_ctx.stroke();

		timeline_ctx.fillText(Math.ceil((timeline.width - x) / 2), x + 2, timeline.height - 2);

		x -= 2 * 20;
	}

	timeline_ctx.closePath()
}
