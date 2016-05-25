var timeline = null;
var timeline_ctx = null;
//var timeline_update_interval = 500;
var timeline_update_interval = 50000;
var clients_panel = null;
var servers_panel = null;

var log_entries = [];
var requests = [];

var clients = [];
var servers = [];

clients.find = function(name){
	return Array.from(this).find(function(c){
		return name == c.name;
	});
}
servers.find = function(name){
	return Array.from(this).find(function(c){
		return name == c.name;
	});
}

function request(from, to){
	this.from = from;
	this.to = to;
	this.direction = 'to';
	this.element = this.createElement();
}
request.prototype.createElement = function(){
	var element = document.createElement('div');
	element.classList.add('request');

	var from_dim = elementDim(this.from.element);
	from_dim[0] += (from_dim[2] - 10);

	var to_dim = elementDim(this.to.element);

	element.style.transform = 'translate('
		+ from_dim[0] + 'px ,'
		+ from_dim[1] + 'px)';

	element.addEventListener('DOMNodeInserted', function(){
		window.setTimeout(function(){
			element.style.transform = 'translate('
				+ to_dim[0] + 'px ,'
				+ to_dim[1] + 'px)';
		}, 1);
	});

	var self = this;
	element.addEventListener('transitionend', function(event){
	if(event.propertyName == 'transform'){
		self.reachedDestination();
	}
	});

	document.body.appendChild(element);
	return element;

	requests.push(this);
};
request.prototype.direction = 'to';
request.prototype.reachedDestination = function(){
	if(this.direction == 'to'){
		this.direction = 'from';

		var dest_pos = elementDim(this.from.element);
		dest_pos[0] += dest_pos[2] - 10;

		this.element.style.transform = 'translate('
			+ dest_pos[0] + 'px ,'
			+ dest_pos[1] + 'px)';
	}else{
		this.remove();
	}
};
request.prototype.remove = function(){
	this.element.parentElement.removeChild(this.element);

	var location = requests.indexOf(this);
	requests.splice(location);
};

function server(name){
	var existing_server = servers.find(name);
	if(existing_server){
		existing_server.requested();
		return existing_server;
	}

	this.name = name;
	this.count = 1;
	this.element = this.createElement();

	servers.push(this);
}
server.prototype.createElement = function(){
	var element = document.createElement('div');
	element.innerHTML = this.name;

	servers_panel.appendChild(element);

	return element;
};
server.prototype.requested = function(){
	this.count++;
};

function client(name){
	var existing_client = clients.find(name);
	if(existing_client){
		existing_client.requested();
		return existing_client;
	}

	this.name = name;
	this.count = 1;
	this.element = this.createElement();

	clients.push(this);
}
client.prototype.createElement = function(){
	var element = document.createElement('div');
	element.innerHTML = this.name;

	clients_panel.appendChild(element);

	return element;
};
client.prototype.requested = function(){
	this.count++;
};

window.onload = function(){
	var socket = io.connect('http://' + window.location.host);
	socket.on('new', function(data){
		new request(new client(data.from), new server(data.path));
		log_entries.push(data);
		timeline_update();
	});
	socket.on('past', function(data){
		log_entries = data;
		timeline_update();
	});

	clients_panel = document.getElementById('clients-list');
	servers_panel = document.getElementById('resources-list');

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
