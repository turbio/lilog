const fs = require('fs');
const tail = require('tail').Tail;

const pathToParsers = './log_parser/';

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

module.exports = Log;
