const Log = require('./log');
const Server = require('./server');

const args = require('minimist')(process.argv.slice(2)); 

const cacheLength = 100;
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
