const express = require('express');
const fs = require('fs');
const tail = require('tail').Tail;

const app = express();

const server = require('http').Server(app);
const io = require('socket.io')(server);

const args = require('minimist')(process.argv.slice(2));

const pathToParsers = './log_parser/';
const supportedParsers = [];

require('fs').readdirSync(pathToParsers).forEach((file) => {
	supportedParsers.push(require(pathToParsers + file));
});

let logparser = null;
let file = null;

const log = [];

const logpath = (args._[0] || args.path);

const startServer = () => {
	const serverPort = (args.port || args.p || 3000);

	server.listen(serverPort);

	app.use(express.static('public'));

	file.on('line', (data) => {
		const newEntry = logparser.parse(data);

		log.push(newEntry);
		io.emit('new', newEntry);
	});

	io.on('connection', (socket) => {
		//when a client connects, send the 100 most recent requests in order to
		//populate the timeline
		socket.emit('past', log.slice(-100));
	});

	console.log(`server up on port${serverPort}`);
};

const printHelp = (err) => {
	if (err) {
		console.log(err);
	}
	console.log('usage: [OPTIONS] <logfile> ');
	console.log('--formats\tlist all supported log formats');
	console.log('--format -f\tlog format (default: clf)');
	console.log('--port -p\thttp port (default: 3000)');

	if (err) {
		throw new Error(err);
	}
};

if (args.formats) {
	supportedParsers.forEach((parser) => {
		console.log(parser.name);
	});
} else if (args.help || args.h) {
	printHelp();
} else {
	if (!logpath) {
		printHelp('must supply a log file path');
	}

	logparser = supportedParsers.find((parser) =>
		parser.name === (args.format || args.f || 'clf'));

	if (!logparser) {
		printHelp(`no parser for format "${args.format || args.f || 'clf'}"`);
	}
	console.log(`using log format ${logparser.name}`);

	console.log('reading and parsing log file...');
	fs.readFile(logpath, 'utf-8', (err, data) => {
		if (err) {
			console.log(err);
			throw new Error(err);
		}

		data.split('\n').forEach((line) => {
			const newRequest = logparser.parse(line);

			if (newRequest) {
				log.push(newRequest);
			}
		});

		console.log('done');

		file = new tail(logpath);
		startServer();
	});
}
