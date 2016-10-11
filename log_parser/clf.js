module.exports.name = 'clf';

module.exports.parse = (logLine) => {
	const parseLineRegex = /([\d\.:a-zA-z]+) ([^ ]+) ([^ ]+?) \[([^\]]+)\] "([^ ]+) ([^ ]+) ([^ ]+)" (\d{3}) (\d+)/g;

	const parseDateRegex = /^(\d+)\/(\w+)\/(\d+):(\d{2}:\d{2}:\d{2}) (.+)$/g;
	const dateFormat = '$1 $2 $3 $4 GMT$5';

	const parts = parseLineRegex.exec(logLine);

	if (!parts) {
		return null;
	}

	return {
		from: parts[1],
		time: Date.parse(parts[4].replace(parseDateRegex, dateFormat)) / 1000,
		path: parts[6],
		status: parts[8],
		size: parts[9],
		verb: parts[5],
		proto: parts[7],
	};
};
