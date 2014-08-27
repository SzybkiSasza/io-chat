// Requires
var express = require('express'),
http = require('http'),
path = require('path'),
sio = require('socket.io'),
repl = require("repl");;

// Object instances
var app = express();
var httpServer = http.Server(app);
var io = sio(httpServer);

// List of users with socket id's
var users = [];

// Routes
app.use(express.static(path.join(__dirname,'/client')));
app.use("/node_modules", express.static(path.join(__dirname,'/node_modules')));


app.get('/', function(req, res){
  res.sendFile('client/index.html');
});

httpServer.listen(3000, function(){
  console.log('Server running on *:3000');
});

// Chat logic - using  socket
io.on('connection', function(socket){
  	console.log('User connected: '+socket.id);
  
	socket.on('login', function(username) {
		logIn(socket, username);
	});
	
	socket.on('disconnect', function(){
    	console.log('User disconnected');
  	});
});

function logIn(socket, username) {
	
	console.log("Something is trying to log on... " + socket.id);

	// Check if user is already logged on
	var found = false;
	users.forEach(function(data) {
		if(data.username==username)
			found = true;
	});
	
	if(found) {
		socket.emit('login',{username: username, status: 'User already logged on!!!'});
	} else {
		console.log('Logging in: ' + username);
		users.push({username: username, socket_id: socket.id});
		socket.emit('login',{username: username, status: 'OK'});
	}
}