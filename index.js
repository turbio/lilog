var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var args = require('minimist')(process.argv.slice(2));

var parser_path = './log_parser/';
var supported_parsers = [];

require("fs").readdirSync(parser_path).forEach(function(file){
	supported_parsers.push(require(parser_path + file));
});

var logparser = null;

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

	startServer();
}

function startServer(){
	server.listen(args.port || args.p || 3000);

	app.use(express.static('client'));

	io.on('connection', function (socket) {
		socket.emit('request', {
			test: 'test'
		});
	});
}



function help(err){
	if(err){
		console.log(err);
	}
	console.log('usage: [OPTIONS] [LOGFILE] ');
	console.log('--formats\tlist all supported log formats');
	console.log('--format -f\tlog format (default: clf)');
	console.log('--port -p\thttp port (default: 3000)');
}
