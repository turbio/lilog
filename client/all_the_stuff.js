var timeline = null;
var timeline_ctx = null;
//var timeline_update_interval = 500;
var timeline_update_interval = 50000;
var request_over_wait = 2000;
var clients_panel = null;
var servers_panel = null;

var log_entries = [];
var requests = [];

var clients = [];
clients.find = function(name){
	return Array.from(this).find(function(c){
		return name == c.name;
	});
}
clients.remove = function(client){
	this.splice(this.indexOf(client), 1);
}

var servers = [];
servers.find = function(name){
	return Array.from(this).find(function(c){
		return name == c.name;
	});
}
servers.remove = function(server){
	this.splice(this.indexOf(server), 1);
}

function request(from, to){
	to.addRequest(this);
	from.addRequest(this);

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

		this.to.element.classList.add('blink');
	}else{
		this.remove();
		this.from.element.classList.add('blink');
	}
};
request.prototype.remove = function(){
	this.to.removeRequest(this);
	this.from.removeRequest(this);
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
	this.requests = [];
	this.element = this.createElement();

	servers.push(this);
}
server.prototype.addRequest = function(request){
	this.requests.push(request);
};
server.prototype.removeRequest = function(request){
	this.requests.splice(this.requests.indexOf(request), 1);
	if(this.requests.length == 0 ){
		window.setTimeout(this.remove.bind(this), request_over_wait);
	}
};
server.prototype.createElement = function(){
	var element = document.createElement('div');
	element.innerHTML = this.name;

	element.addEventListener('animationend', function(event){
		this.classList.remove('blink');
	});

	servers_panel.appendChild(element);

	return element;
};
server.prototype.remove = function(){
	if(this.requests.length == 0){
		this.element.style.height = 0;
		this.element.style['margin-top'] = 0;
		this.element.style['margin-bottom'] = 0;
		this.element.style['padding-top'] = 0;
		this.element.style['padding-bottom'] = 0;
		servers.remove(this);
		var self = this;
		this.element.addEventListener('transitionend', function(event){
			if(event.propertyName == 'height'){
				self.element.parentElement.removeChild(self.element);
			}
		});
	}
}
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
	this.requests = [];
	this.element = this.createElement();

	clients.push(this);
}
client.prototype.addRequest = function(request){
	this.requests.push(request);
};
client.prototype.removeRequest = function(request){
	this.requests.splice(this.requests.indexOf(request), 1);

	if(this.requests.length == 0 ){
		window.setTimeout(this.remove.bind(this), request_over_wait);
	}
};
client.prototype.createElement = function(){
	var element = document.createElement('div');
	element.innerHTML = this.name;
	element.addEventListener('animationend', function(event){
		this.classList.remove('blink');
	});

	clients_panel.appendChild(element);

	return element;
};
client.prototype.remove = function(){
	if(this.requests.length == 0){
		//while the removal animation is playing, it should already be considered
		//to not exist
		clients.remove(this);
		this.element.style.height = 0;
		this.element.style['margin-top'] = 0;
		this.element.style['margin-bottom'] = 0;
		this.element.style['padding-top'] = 0;
		this.element.style['padding-bottom'] = 0;
		var self = this;
		this.element.addEventListener('transitionend', function(event){
			if(event.propertyName == 'height'){
				self.element.parentElement.removeChild(self.element);
			}
		});
	}
}
client.prototype.requested = function(){
	this.count++;
};

window.onload = function(){
	var socket = io.connect('http://' + window.location.host);
	socket.on('new', function(data){
		var new_server = new server(data.path);
		var new_client = new client(data.from);
		var new_request = new request(new_client, new_server);
		log_entries.push(data);
	});
	socket.on('past', function(data){
		log_entries = data;
	});

	clients_panel = document.getElementById('clients');
	servers_panel = document.getElementById('servers');
};

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
