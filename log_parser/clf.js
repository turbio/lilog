module.exports.name = 'clf';

module.exports.parse = function(str){
	var regex = /([\d\.:a-zA-z]+) (.+?) (.+?) \[(.+?)\] "(\w+) (.+?) (.+?)" (\d{3}) (\d+)/g

	var parts = regex.exec(str);
	if(parts != null){
		return {
			from: parts[1],
			time: parts[4],
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
