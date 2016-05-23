
window.onload = function(){
	var socket = io.connect('http://' + window.location.host);
	socket.on('request', function(data){
		console.log(data);
	});
};
