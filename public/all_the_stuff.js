//a resource list is a panel containing a list of either servers/clients/etc
//which can have requests going between them
//the resource list manages creation and lifetime of all the items within it
function resource_list(list_element){
	this.list = [];
	this.list_element = list_element;
}
//the primary external interface to the resource list, all everything should be doing
//is creating resources. Their deletion is handled by the resource list
resource_list.prototype.create = function(name){
	var existing_item = this.find(name);
	if(existing_item){
		return existing_item;
	}

	var available_spaces = this.list_element.find(':empty');

	var available_space;
	if(available_spaces.length == 0){
		available_space = $('<li></li>')
			.on('animationend', function(event){
				$(this).removeClass('blink');
			})
			.appendTo(this.list_element);
	}else{
		available_space = available_spaces.first();
	}

	var new_item = new resource_item(name, available_space, this);

	//this.list_element.height(this.list_element.parent().innerHeight())
	this.list.push(new_item);

	return new_item;
}
//used for resource items upon creation in order to determine if a resource
//already exists
resource_list.prototype.find = function(name){
	return this.list.find(function(r){
		return name == r.name;
	});
}
//used by resource items when they are being deleted
//either by themselves or the resource list
resource_list.prototype.remove = function(resource_item){
	this.list.splice(this.list.indexOf(resource_item), 1);
	resource_item.element.empty();

	while(this.list_element.children().last().is(':empty')){
		this.list_element.children().last().remove();
	}
}

//resource items appear visually as items in the resource panel
//all have a corresponding resource list which managers their creation
//each resource has a list of corresponding requests
function resource_item(name, element, parent_list){
	this.name = name;
	this.parent_list = parent_list;

	//the number of times this resource has been involved in a request
	this.count = 1;
	this.requests = [];
	this.element = this.createElement(element);
}
resource_item.prototype.addRequest = function(request){
	this.count++;
	this.requests.push(request);
};
resource_item.prototype.removeRequest = function(request){
	this.requests.splice(this.requests.indexOf(request), 1);

	if(this.requests.length == 0 ){
		window.setTimeout(this.remove.bind(this), request_over_wait);
	}
};
resource_item.prototype.createElement = function(element){
	$('<div>' + this.name + '</div>')
		.appendTo(element);
	return element;

};
resource_item.prototype.remove = function(){
	//a resource should not be removed while it has active requests
	if(this.requests.length == 0){
		this.parent_list.remove(this);
	}
}
resource_item.prototype.blink = function(){
	this.element.removeClass('blink');
	this.element.addClass('blink');
}

//represents a single request between two resources
//rendered visibly as a moving circle
function request(from, to, size, verb, status){
	to.addRequest(this);
	from.addRequest(this);
	from.blink();

	this.from = from;
	this.to = to;
	this.size = size;
	this.verb = verb;
	this.status = status;

	this.direction = 'to';
	this.element = this.createElement();
}
request.prototype.createElement = function(){
	this.from_position = this.from.element.offset();
	this.from_position.left += this.from.element.width();

	this.to_position = this.to.element.offset();

	var element = $('<div></div>')
		.addClass('request')
		.attr('verb', this.verb)
		.attr('size', this.size)
		.attr('status', this.status)
		.css('top', this.from_position.top)
		.css('left', this.from_position.left);

	var self = this;

	element.animate({
		top: this.to_position.top,
		left: this.to_position.left },
	1500,
	function(){
		self.direction = 'from';

		var size_as_dimensions = (Math.log(self.size + 1) / 2) + 10;

		element.animate({
			width: size_as_dimensions,
			height: size_as_dimensions
		},
		{
			duration: 100,
			queue: false
		});

		self.to.blink();
	});

	element.animate({
		top: this.from_position.top,
		left: this.from_position.left
	},
	request_speed,
	this.remove.bind(this));

	element.appendTo($('#lists'));

	return element;
};
request.prototype.remove = function(){
	this.to.removeRequest(this);
	this.from.blink();
	this.from.removeRequest(this);
	this.element.remove();
};

var request_speed = 2000;
var timeline = null;
var timeline_ctx = null;
//var timeline_update_interval = 500;
var timeline_update_interval = 50000;
var request_over_wait = 2000;
var servers_panel = null;

var log_entries = [];

var servers;
var clients;

var timeline = {
	left: 10 * 1000,
	right: 0,
	max: 0,
	new: function(){

	},
	entries: []
};

function timeline_entry(data){
	var entry = $('<div></div>')
		.addClass('timeline-point')
		.attr('verb', data.verb)
		.css('right', ((Date.now() - data.time) / 250) + 'px')
		.appendTo(timeline);
}

$(function(){
	var socket = io.connect('http://' + window.location.host);
	socket.on('new', function(data){
		if(data){
			var new_server = servers.create(data.path);
			var new_client = clients.create(data.from);

			var new_request = new request(
				new_client,
				new_server,
				data.size,
				data.verb,
				data.status);
			log_entries.push(data);
			timeline_entry(data);
		}
	});
	socket.on('past', function(data){
		log_entries = data;
	});

	servers = new resource_list($('#servers'));
	clients = new resource_list($('#clients'));

	timeline = document.getElementById('timeline');
});
