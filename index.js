var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var fs = require('fs');
var tail = require('tail').Tail;

var args = require('minimist')(process.argv.slice(2));

var parser_path = './log_parser/';
var supported_parsers = [];

require("fs").readdirSync(parser_path).forEach(function(file){
	supported_parsers.push(require(parser_path + file));
});

var logparser = null;
var file = null;

var log = [];

var logpath = (args._[0] || args.path);

if(!logpath){
	help('must supply a log file path');
}

if(args.formats){
	supported_parsers.forEach(function(p){
		console.log(p.name);
	});
}else if(args.help || args.h){
	help();
}else{
	logparser = supported_parsers.find(function(p){
		return p.name == (args.format || args.f || 'clf');
	});
	if(!logparser){
		help('no parser for format "' + (args.format || args.f || 'clf') + '"');
	}
	console.log('using log format ' + logparser.name);

	console.log('reading and parsing log file...');
	fs.readFile(logpath, 'utf-8', function(err, data){
		if(err){
			console.log(err);
			process.exit(-2);
		}

		data.split('\n').forEach(function(line){
			var new_request = logparser.parse(line);
			if(new_request){
				log.push(new_request);
			}
		});

		console.log('done');

		file = new tail(logpath);
		startServer();
	});
}

function startServer(){
	var server_port = (args.port || args.p || 3000)
	server.listen(server_port);

	app.use(express.static('public'));

	file.on('line', function(data){
		var new_entry = logparser.parse(data);
		log.push(new_entry);
		io.emit('new', new_entry);
	});

	io.on('connection', function(socket){
		//when a client connects, send the 100 most recent requests in order to
		//populate the timeline
		socket.emit('past', log.slice(-100));
	});

	console.log('server up on port ' + server_port);
}

function help(err){
	if(err){
		console.log(err);
	}
	console.log('usage: [OPTIONS] <logfile> ');
	console.log('--formats\tlist all supported log formats');
	console.log('--format -f\tlog format (default: clf)');
	console.log('--port -p\thttp port (default: 3000)');
	if(err){
		process.exit(-1);
	}
}
