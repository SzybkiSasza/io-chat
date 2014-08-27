// Requires
var express = require('express'), http = require('http'), path = require('path'), sio = require('socket.io'), repl = require("repl");


// Object instances
var app = express(), httpServer = http.Server(app), io = sio(httpServer);

// List of users with socket id's
var users = [];

// Routes
app.use(express.static(path.join(__dirname, '/client')));
app.use("/node_modules", express.static(path.join(__dirname, '/node_modules')));

app.get('/', function(req, res) {
	res.sendFile('client/index.html');
});

httpServer.listen(3000, function() {
	logMsg('Server running on *:3000');
});

// Chat logic - using  socket
io.on('connection', function(socket) {
	logMsg('New socket connected: ' + socket.id + '');

	socket.on('login', function(username) {
		logIn(socket, username);
	});

	socket.on('logoff', function(username) {
		logOff(username);
	});

	socket.on('disconnect', function() {
		logMsg('Socket: ' + socket.id + ' disconnected');
	});
});

/**
 * Logs the user in
 * @param {Object} socket Socket to bind to user
 * @param {Object} username Username to log in
 */
function logIn(socket, username) {

	logMsg("Something is trying to log on... " + socket.id);

	// Check if user is already logged on
	var found = false;
	users.forEach(function(data) {
		if (data.username == username)
			found = true;
	});

	if (found) {
		socket.emit('loginResponse', {
			username : username,
			status : 'User already logged on!!!'
		});
	} else {
		logMsg('Logging in successfully: ' + username);
		users.push({
			username : username,
			socket_id : socket.id
		});
		socket.emit('loginResponse', {
			username : username,
			status : 'OK'
		});
	}
}

/**
 * Logs the user off
 * @param {Object} username Username to log off
 */
function logOff(username) {

	// Index to delete
	var indexToDelete = -1;

	// Find index of user to delete
	users.forEach(function(data, index) {
		if (data.username == username)
			indexToDelete = index;
	});

	// Remove user at specified index
	if (indexToDelete != -1) {
		users.splice(indexToDelete, 1);
		logMsg('User: ' + username + ' successfully removed!');
	} else {
		logMsg('User to delete not found!!!');
	}
}

/**
 * Logs current message with date and wraps proper characters around based on priority
 * @param {Object} msg Message text
 * @param {Object} priority Priority (range 0-2)
 */
function logMsg(msg, priority) {
	
	var date = new Date();
	priority = typeof priority !== 'undefined' ? priority : 0;

	switch(priority) {
	case 2:
		msg = '*** '+msg+' ***';
		break;
	case 1:
		msg = '== '+msg+' ==';
		break;
	}
	console.log('[' + date.toLocaleTimeString() + '] ' + msg);
}
