var timeline = null;
var timeline_ctx = null;
//var timeline_update_interval = 500;
var timeline_update_interval = 50000;
var clients = null;
var servers = null;

var log_entries = [];

var request_map = {
	new: function(request){
		var request_client = this.has_client(request);
		if(request_client){
			request_client.count++;
		}else{
			request_client = this.new_client(request);
		}

		var request_server = this.has_server(request);
		if(request_server){
			request_server.clount++;
		}else{
			request_server = this.new_server(request);
		}

		this.new_request(request_client, request_server, request);
	},
	new_request: function(from, to, request){
		var element = document.createElement('div');
		element.classList.add('message');

		var from_pos = elementDim(from.element);
		from_pos[0] += (from_pos[2] - 10);
		var to_pos = elementDim(to.element);

		element.style.transform = 'translate('
			+ from_pos[0] + 'px ,'
			+ from_pos[1] + 'px)';

		var created_request = {
			data: request,
			from: from,
			to: to,
			direction: 'to',
			element: element
		};

		element.addEventListener('DOMNodeInserted', function(){
			window.setTimeout(function(){
				element.style.transform = 'translate('
					+ to_pos[0] + 'px ,'
					+ to_pos[1] + 'px)';
			}, 1);
		});

		element.addEventListener('transitionend', function(event){
			if(event.propertyName == 'transform'){
				if(created_request.direction == 'to'){
					created_request.direction = 'from';
					element.style.transform = 'translate('
						+ from_pos[0] + 'px ,'
						+ from_pos[1] + 'px)';
					var elem_size = Math.max(Math.sqrt(request.size) / 50, 10);
					element.style.height = elem_size + 'px';
					element.style.width = elem_size + 'px';
				}else{
					element.parentElement.removeChild(element);
				}
			}
		});

		document.body.appendChild(element);
		this.requests.push(created_request);
		return created_request;
	},
	new_client: function(request){
		var element = document.createElement('div');
		element.innerHTML = request.from;

		var created_client = {
			count: 1,
			name: request.from,
			element: element
		};

		clients.appendChild(element);

		this.clients.push(created_client);
		return created_client;
	},
	new_server: function(request){
		var element = document.createElement('div');
		element.innerHTML = request.path;

		var created_server = {
			count: 1,
			name: request.path,
			element: element
		};

		servers.appendChild(element);
		this.servers.push(created_server);
		return created_server;
	},
	has_client: function(request){
		return this.clients.find(function(c){
			return request.from == c.name;
		});
	},
	has_server: function(request){
		return this.servers.find(function(s){
			return request.path == s.name;
		});
	},
	clients: [],
	servers: [],
	requests: [],
};

window.onload = function(){
	var socket = io.connect('http://' + window.location.host);
	socket.on('new', function(data){
		request_map.new(data);
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

function timeline_update(){
	timeline_ctx.clearRect(0, 0, timeline.width, timeline.height);

	timeline_ctx.beginPath()

	timeline_ctx.strokeStyle = "#fff";
	timeline_ctx.lineWidth = 1;

	log_entries.forEach(function(request){
		var seconds_diff = (Date.now() - request.time) / 1000;
		var lineX = timeline.width - (seconds_diff * 4);

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

function elementDim(element){
	if(element){
		var p = elementDim(element.parentElement);
		return [
			p[0] + element.offsetLeft,
			p[1] + element.offsetTop,
			element.offsetWidth,
			element.offsetHeight
		];
	}else{
		return [0, 0, 0, 0]
	}
}
