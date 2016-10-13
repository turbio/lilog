//a resource list is a panel containing a list of either servers/clients/etc
//which can have requests going between them
//the resource list manages creation and lifetime of all the items within it
class ResourceList {
	constructor(listElement) {
		this.list = [];
		this.listElement = listElement;
	}

	//the primary external interface to the resource list, all everything should be doing
	//is creating resources. Their deletion is handled by the resource list
	create(name) {
		let existing_item = this.find(name);
		if(existing_item){
			return existing_item;
		}

		let available_spaces = this.listElement.find(':empty');

		let available_space;
		if(available_spaces.length == 0){
			available_space = $('<li></li>')
				.on('animationend', function(){
					$(this).removeClass('blink');
				})
				.appendTo(this.listElement);
		}else{
			available_space = available_spaces.first();
		}

		let new_item = new ResourceItem(name, available_space, this);

		this.list.push(new_item);

		return new_item;
	}

	//used for resource items upon creation in order to determine if a resource
	//already exists
	find(name) {
		return this.list.find((resource) => name === resource.name);
	}

	//used by resource items when they are being deleted
	//either by themselves or the resource list
	remove(resourceItem) {
		this.list.splice(this.list.indexOf(resourceItem), 1);
		resourceItem.element.empty();

		while (this.listElement.children().last().is(':empty')) {
			this.listElement.children().last().remove();
		}
	}
}

//resource items appear visually as items in the resource panel
//all have a corresponding resource list which managers their creation
//each resource has a list of corresponding requests
class ResourceItem {
	constructor(name, element, parentList) {
		this.name = name;
		this.parentList = parentList;

		//the number of times this resource has been involved in a request
		this.count = 1;
		this.requests = [];
		this.element = this.createElement(element);
	}

	addRequest(request) {
		this.count++;
		this.requests.push(request);
	}

	removeRequest(request) {
		this.requests.splice(this.requests.indexOf(request), 1);

		if (this.requests.length == 0 ) {
			window.setTimeout(this.remove.bind(this), requestOverWait);
		}
	}

	createElement(element) {
		$('<div>' + this.name + '</div>')
			.appendTo(element);

		return element;
	}

	remove() {
		//a resource should not be removed while it has active requests
		if(this.requests.length == 0){
			this.parent_list.remove(this);
		}
	}

	blink() {
		this.element.removeClass('blink');
		this.element.addClass('blink');
	}
}

//represents a single request between two resources
//rendered visibly as a moving circle
class Request {
	constructor(from, to, size, verb, status) {
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

	createElement() {
		this.from_position = this.from.element.offset();
		this.from_position.top += $('#lists').scrollTop();
		this.from_position.left += this.from.element.width();

		this.to_position = this.to.element.offset();
		this.to_position.top += $('#lists').scrollTop();

		let element = $('<div></div>')
			.addClass('request')
			.attr('verb', this.verb)
			.attr('size', this.size)
			.attr('status', this.status)
			.css('top', this.from_position.top)
			.css('left', this.from_position.left);

		element.animate({
			top: this.to_position.top,
			left: this.to_position.left
		}, 1500, () => {
			this.direction = 'from';

			let size_as_dimensions = (Math.log(this.size + 1) / 2) + 10;

			element.animate(
				{
					width: size_as_dimensions,
					height: size_as_dimensions
				},
				{ duration: 100, queue: false });

			this.to.blink();
		});

		element.animate(
			{
				top: this.from_position.top,
				left: this.from_position.left
			},
			requestSpeed,
			this.remove.bind(this));

		element.appendTo($('#lists'));

		return element;
	}

	remove() {
		this.to.removeRequest(this);
		this.from.blink();
		this.from.removeRequest(this);
		this.element.remove();
	}
}

const timeline = {
	newRequest(time, verb) {
		if(!this.last_entry || this.last_entry.time != time){
			this.last_entry = this.newEntry(time);
		}

		let last = this.last_entry;

		if(!(verb in last.verbs)){
			last.verbs[verb] = 0;
		}

		last.count++;
		last.element.attr('count', last.count);
		last.verbs[verb]++;

		for(v in last.verbs){
			let verb_elem = last.element.children('[verb=' + v + ']');

			if(verb_elem.length == 0){
				verb_elem = $('<div></div>')
					.attr('verb', v)
					.appendTo(last.element);
			}

			verb_elem.css('height', ((last.verbs[v] / last.count) * 100) + '%');
		}

		last.element.css('height', this.getHeight(last.count));
	},
	newEntry(time){
		let elem = $('<div></div>');
		elem.css('left', this.getLeft(time));
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
	getLeft(time) {
		return (time - startTime) * (this.entry_width + this.entry_spacing);
	},
	getHeight(count) {
		if(count > this.max){
			this.max = count;
			let self = this;

			this.element.children().each(function(){
				let elem = $(this);
				elem.css('height', self.getHeight(elem.attr('count')));
			});
		}

		return ((count / this.max) * 100) + '%';
	},
	trackWidth() {
		this.element.width(
			((Math.floor(Date.now() / 1000) - startTime) + 2)
			* (this.entry_width + this.entry_spacing));
	},

	max: 1,

	entry_width: 4,
	entry_spacing: 2,

	last_entry: null
};

let requestSpeed = 2000;
const requestOverWait = 5000;
let startTime = Math.floor(Date.now() / 1000);

$(() => {
	const servers = new ResourceList($('#servers'));
	const clients = new ResourceList($('#clients'));

	const socket = io.connect('http://' + window.location.host);

	socket.on('new', (data) => {
		const newServer = servers.create(data.path);
		const newClient = clients.create(data.from);

		new Request(newClient, newServer, data.size, data.verb, data.status);

		timeline.newRequest(data.time, data.verb);
	});
	socket.on('past', () => { });

	timeline.element = $('#track');

	window.setInterval(timeline.trackWidth.bind(timeline), 1000);
});
