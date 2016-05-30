var timeline = null;
var timeline_ctx = null;
//var timeline_update_interval = 500;
var timeline_update_interval = 50000;
var request_over_wait = 2000;
var clients_panel = null;
var servers_panel = null;

var log_entries = [];
var requests = [];

var clients = {
	find: function(name){
		return this.arr.find(function(c){
			return name == c.name;
		});
	},
	remove: function(client){
		this.arr.splice(this.arr.indexOf(client), 1);
		while(client.element.firstChild){
			client.element.removeChild(client.element.firstChild);
		}
		while(!clients_panel.lastChild.hasChildNodes()){
			clients_panel.removeChild(clients_panel.lastChild);
		}
	},
	push: function(client){
		this.arr.push(client);
	},
	get_entry: function(){
		available = Array.from(clients_panel.children).find(function(l){
			return !l.hasChildNodes();
		});

		if(!available){
			available = document.createElement('li');
			available.addEventListener('animationend', function(event){
				this.classList.remove('blink');
			});
			clients_panel.appendChild(available);
		}

		return available;
	},
	arr: []
};

var servers = {
	find: function(name){
		return this.arr.find(function(c){
			return name == c.name;
		});
	},
	remove: function(server){
		this.arr.splice(this.arr.indexOf(server), 1);
		while(server.element.firstChild){
			server.element.removeChild(server.element.firstChild);
		}
		while(!servers_panel.lastChild.hasChildNodes()){
			servers_panel.removeChild(servers_panel.lastChild);
		}
	},
	push: function(server){
		this.arr.push(server);
	},
	get_entry: function(){
		available = Array.from(servers_panel.children).find(function(l){
			return !l.hasChildNodes();
		});

		if(!available){
			available = document.createElement('li');
			available.addEventListener('animationend', function(event){
				this.classList.remove('blink');
			});
			servers_panel.appendChild(available);
		}

		return available;
	},
	arr: []
};

function request(from, to, size, verb, status){
	to.addRequest(this);
	from.addRequest(this);

	this.from = from;
	this.to = to;
	this.size = size;
	this.verb = verb;
	this.status = status;

	this.direction = 'to';
	this.element = this.createElement();

	requests.push(this);
}
request.prototype.createElement = function(){
	var element = document.createElement('div');
	element.classList.add('request');
	element.setAttribute('verb', this.verb);
	element.setAttribute('size', this.size);
	element.setAttribute('status', this.status);

	this.from_position = $(this.from.element).offset();
	this.from_position.left += $(this.from.element).width();

	this.to_position = $(this.to.element).offset();

	element.style.transform = 'translate('
		+ this.from_position.left + 'px ,'
		+ this.from_position.top + 'px)';

	var self = this;
	element.addEventListener('DOMNodeInserted', function(){
		window.setTimeout(function(){
			element.style.transform = 'translate('
				+ self.to_position.left + 'px ,'
				+ self.to_position.top + 'px)';
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
};
request.prototype.direction = 'to';
request.prototype.reachedDestination = function(){
	if(this.direction == 'to'){
		this.direction = 'from';

		this.element.style.transform = 'translate('
			+ this.from_position.left + 'px ,'
			+ this.from_position.top + 'px)';

		var size_as_dimensions = (Math.log(this.size + 1) / 2) + 10;

		this.element.style.width = size_as_dimensions + 'px';
		this.element.style.height = size_as_dimensions + 'px';

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
	requests.splice(location, 1);
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
	var text = document.createElement('div');
	text.innerHTML = this.name;

	var entry = servers.get_entry();
	entry.appendChild(text);

	return entry;
};
server.prototype.remove = function(){
	if(this.requests.length == 0){
		servers.remove(this);
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
	var text = document.createElement('div');
	text.innerHTML = this.name;

	var entry = clients.get_entry();
	entry.appendChild(text);

	return entry;
};
client.prototype.remove = function(){
	if(this.requests.length == 0){
		//while the removal animation is playing, it should already be considered
		//to not exist
		clients.remove(this);
	}
}
client.prototype.requested = function(){
	this.count++;
};

$(function(){
	var socket = io.connect('http://' + window.location.host);
	socket.on('new', function(data){
		if(data){
			var new_server = new server(data.path);
			var new_client = new client(data.from);
			var new_request = new request(
				new_client,
				new_server,
				data.size,
				data.verb,
				data.status);
			log_entries.push(data);
		}
	});
	socket.on('past', function(data){
		log_entries = data;
	});

	clients_panel = document.getElementById('clients');
	servers_panel = document.getElementById('servers');
});
