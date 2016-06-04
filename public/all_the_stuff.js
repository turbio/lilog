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
	this.from_position.top += $('#lists').scrollTop();
	this.from_position.left += this.from.element.width();

	this.to_position = this.to.element.offset();
	this.to_position.top += $('#lists').scrollTop();

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

var timeline = {
	new_request: function(time, verb){
		if(!this.last_entry || this.last_entry.time != time){
			this.last_entry = this.new_entry(time);
		}

		var last = this.last_entry;

		if(!(verb in last.verbs)){
			last.verbs[verb] = 0;
		}

		last.count++;
		last.element.attr('count', last.count);
		last.verbs[verb]++;

		for(v in last.verbs){
			var verb_elem = last.element.children('[verb=' + v + ']');

			if(verb_elem.length == 0){
				verb_elem = $('<div></div>')
					.attr('verb', v)
					.appendTo(last.element);
			}

			verb_elem.css('height', ((last.verbs[v] / last.count) * 100) + '%');
		}

		last.element.css('height', this.get_height(last.count));
	},
	new_entry: function(time){
		var elem = $('<div></div>');
		elem.css('left', this.get_left(time));
		elem.css('width', this.entry_width);
		elem.attr('count', 0);
		this.element.append(elem);

		return {
			verbs: {
				HEAD: 0,
				GET: 0,

				POST: 0,
				PUT: 0,
				DELETE: 0,

				TRACE: 0,
				CONNECT: 0,
				OPTIONS: 0
			},
			time: time,
			count: 0,
			element: elem
		};
	},
	get_left: function(time){
		return (time - startTime) * (this.entry_width + this.entry_spacing);
	},
	get_height: function(count){
		if(count > this.max){
			this.max = count;
			var self = this;

			this.element.children().each(function(){
				elem = $(this);
				elem.css('height', self.get_height(elem.attr('count')));
			});
		}

		return ((count / this.max) * 100) + '%';
	},
	track_width: function(){
		this.element.width(
			((Math.floor(Date.now() / 1000) - startTime) + 2)
			* (this.entry_width + this.entry_spacing));
	},

	max: 1,

	entry_width: 2,
	entry_spacing: 2,

	last_entry: null
};

var request_speed = 2000;
var timeline_ctx = null;
//var timeline_update_interval = 500;
var timeline_update_interval = 50000;
var request_over_wait = 5000;
var servers_panel = null;
var startTime = Math.floor(Date.now() / 1000);

var servers;
var clients;

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

			timeline.new_request(data.time, data.verb);
		}
	});
	socket.on('past', function(data){
	});

	servers = new resource_list($('#servers'));
	clients = new resource_list($('#clients'));
	timeline.element = $('#track');
	window.setInterval(timeline.track_width.bind(timeline), 1000);
});
