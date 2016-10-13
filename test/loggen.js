const fs = require('fs');

const build = (props) => (
	`${props.ip} - - [${props.date}] "${props.verb} ${props.path} HTTP/1.1" `
	+ `${props.status} ${props.size}`
);

const gen = () => {
	urlPath = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'];
	httpStatus = [200, 300, 301, 302, 400, 401, 403, 404, 500, 501, 502];
	httpVerb = ['HEAD', 'GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];

	const randChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

	return build({
		ip: Array(4)
			.fill()
			.map(() => Math.floor(Math.random() * 2))
			.join('.'),
		date: (new Date()).toString(),
		verb: randChoice(httpVerb),
		path: `/${randChoice(urlPath)}`,
		status: randChoice(httpStatus),
		size: Math.floor(Math.random() * 10000)
	});
};

const log = (file, cb) => {
	fs.appendFile(file, gen() + '\n', 'utf8', (err) => {
		if (err) {
			throw new Error(err);
		}
		cb();
	});
};

module.exports.build = build;
module.exports.gen = gen;
module.exports.log = log;
