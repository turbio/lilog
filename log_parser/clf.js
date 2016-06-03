module.exports.name = 'clf';

module.exports.parse = function(str){
	var parse_line = /([\d\.:a-zA-z]+) ([^ ]+) ([^ ]+?) \[([^\]]+)\] "([^ ]+) ([^ ]+) ([^ ]+)" (\d{3}) (\d+)/g

	var parse_date = /^(\d+)\/(\w+)\/(\d+):(\d{2}:\d{2}:\d{2}) (.+)$/g;
	var format_date = '$1 $2 $3 $4 GMT$5';

	var parts = parse_line.exec(str);
	if(parts != null){
		return {
			from: parts[1],
			time: Date.parse(parts[4].replace(parse_date, format_date)) / 1000,
			path: parts[6],
			status: parts[8],
			size: parts[9],
			verb: parts[5],
			proto: parts[7],
		};
	}else{
		console.log("error parsing log entry '" + str + "'");
	}
};
