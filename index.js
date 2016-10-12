const express = require('express');
const fs = require('fs');
const tail = require('tail').Tail;
const socket = require('socket.io');
const http = require('http');
const path = require('path');

const args = require('minimist')(process.argv.slice(2));

const pathToParsers = './log_parser/';

const cacheLength = 100;

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
		fs.readFile(path, 'utf-8', (err, wholeLog) => {
			if (err) {
				console.log(err);
				throw new Error(err);
			}

			wholeLog.split('\n').forEach((line) => this.newEntry(line));

			(new tail(path)).on('line', (line) => this.newEntry(line));
		});
	}

	onEntry(callback) {
		this.entryCallback = callback;
	}

	newEntry(line) {
		const parsed = this.selectedParser.parse(line);

		if (!parsed) {
			//there was a problem parsing the log line
			console.log('failed to parse line');

			return;
		}

		this.store(parsed);

		if (this.entryCallback) {
			this.entryCallback(parsed);
		}
	}

	store(entry) {
		this.entries.push(entry);
	}

	retrieve(count) {
		return this.entries.slice(-count);
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

		app.use(express.static(path.join(__dirname, 'public')));

		this.server = http.Server(app);
		this.socket = socket(this.server);
		this.port = port;
	}

	start() {
		this.socket.on('connection', (client) => {
			Promise.resolve()
			.then(() => this.joinCallback && this.joinCallback())
			.then((res) => {
				if (!res) {
					return;
				}

				Object.keys(res).forEach((key) => client.emit(key, res[key]));
			});
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

//socket.emit('cached', log.slice(-100));

const log = new Log();

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

	const server = new Server(args.port || args.p);

	log.loadParsers().then(() => {
		log.setParser(args.format || args.f || 'clf');

		console.log(`using log format ${log.selectedParser.name}`);
		console.log('reading and parsing log file...');

		log.onEntry((entry) => server.newEntry(entry));
		server.onJoin(() => ({ cached: log.retrieve(cacheLength) }));

		log.inputFile(logpath);
		server.start();

	});
}
