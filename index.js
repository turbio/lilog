const express = require('express');
const fs = require('fs');
const tail = require('tail').Tail;
const socket = require('socket.io');
const http = require('http');

const args = require('minimist')(process.argv.slice(2));

const pathToParsers = './log_parser/';
const supportedParsers = [];

const defaultPort = 3000;

const logpath = (args._[0] || args.path);

const printHelp = (err) => {
	if (err) {
		console.log(err);
	}
	console.log('usage: [OPTIONS] <logfile> ');
	console.log('--formats -l\tlist all supported log formats');
	console.log('--format -f\tlog format (default: clf)');
	console.log('--port -p\thttp port (default: 3000)');

	if (err) {
		throw new Error(err);
	}
};

class Log {
	constructor() {
		this.entries = [];
		this.selectedParser = null;
		this.availableParsers = [];
	}

	inputFile(path) {
	}

	loadParsers() {
		return new Promise((resolve, reject) => {
			fs.readdir(pathToParsers, (err, dirs) => {
				if (err) {
					reject(err);

					return;
				}

				dirs.forEach((file) =>
					this.availableParsers.push(require(pathToParsers + file)));

				resolve();
			});
		});
	}

	listParsers() {
		return this.availableParsers;
	}

	setParser(name) {
		this.selectedParser = this.availableParsers
			.find((parser) => parser.name === name);

		if (!this.selectedParser) {
			throw new Error(`parser with name "${name} does not exist"`);
		}
	}
}

class Server {
	constructor(port = defaultPort) {
		const app = express();

		app.use(express.static('public'));

		this.server = http.Server(app);
		this.socket = socket(this.server);
		this.port = port;
	}

	startServer() {
		this.socket.on('connection', (client) => {
			Promise.resolve()
			.then(() => this.joinCallback && this.joinCallback())
			.then((name, data) => name && client.emit(name, data));
		});

		this.server.listen(this.port);
		console.log(`server up on port ${this.port}`);
	}

	onJoin(callback) {
		this.joinCallback = callback;
	}

	newEntry(entry) {
		this.socket.emit('new', entry);
	}
}

const log = new Log();
const server = new Server();
//const serverPort = (args.port || args.p || 3000);

//socket.emit('cached', log.slice(-100));
//const newEntry = logparser.parse(data);
//file.on('line', (data) => {
//});


if (args.formats || args.l) {
	log.loadParsers()
	.then(() => {
		console.log(log.listParsers().map((parser) => parser.name).join('\n'));
	});
} else if (args.help || args.h) {
	printHelp();
} else {
	if (!logpath) {
		printHelp('you must supply a log file path');
	}

	log.loadParsers().then(() => {
		log.setParser(args.format || args.f || 'clf');

		console.log(`using log format ${log.parser.name}`);

		console.log('reading and parsing log file...');
	});

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
		server.start();
	});
}
