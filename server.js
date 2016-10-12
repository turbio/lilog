const socket = require('socket.io');
const express = require('express');
const http = require('http');
const path = require('path');

const defaultPort = 3000;

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

module.exports = Server;
