// Requires
var express = require('express'), http = require('http'), path = require('path'), sio = require('socket.io'), repl = require("repl");

// Object instances
var app = express(), httpServer = http.Server(app), io = sio(httpServer);

// Maximum number of sockets per user
var MAX_USER_SOCKETS = 3;

// List of users with params
var users = [];

// Routes
app.use(express.static(path.join(__dirname, '/client')));
app.use("/node_modules", express.static(path.join(__dirname, '/node_modules')));
app.get('/', function(req, res) {
	res.sendFile('client/index.html');
});

// Listen on 8080
httpServer.listen(8080, "0.0.0.0", function() {
	logMsg('Server running on *:8080');
});

// Chat logic
io.on('connection', function(socket) {
	logMsg('New socket connected: ' + socket.id + '');

	socket.on('login', function(username) {
		logIn(socket, username.trim());
	});

	socket.on('logoff', function(username) {
		logOff(socket, username.trim());
	});

	socket.on('message', function(data) {
		processMessage(socket, data);
	});

	socket.on('disconnect', function(reason) {
		logMsg('Socket: ' + socket.id + ' disconnected, reason: ' + reason);
		removeSocket(socket);
	});
});

/**
 * Logs the user in
 * @param {Object} socket Socket to bind to user
 * @param {Object} username Username to log in
 */
function logIn(socket, username) {

	logMsg("Something is trying to log on... " + socket.id);

	// Search for user in users list
	var user = null;
	users.forEach(function(data, index) {
		if (data.username == username)
			user = data;
	});

	// Check if max number of open sockets is reached
	if (user != null) {
		if (user.socket_ids.length >= MAX_USER_SOCKETS) {
			logMsg('Reached max number of sockets for: ' + username);
			socket.emit('loginResponse', {
				username : username,
				status : 'Maximum number of sockets per user achieved - close some of the chat instances'
			});
		} else {
			logMsg('Logging in successfully - new socket for user: ' + username);
			user.socket_ids.push(socket.id);
			socket.emit('loginResponse', {
				username : username,
				status : 'OK'
			});
		}
	}
	// Add new user
	else {
		logMsg('Logging in successfully - new user: ' + username,1);
		users.push({
			username : username,
			socket_ids : [socket.id]
		});
		socket.emit('loginResponse', {
			username : username,
			status : 'OK'
		});
	}

	// Emit broadcast message with new user list
	emitUserList('New user logged in: ' + username);
}

/**
 * Logs the user off
 * @param {Object} username Username to log off
 */
function logOff(socket, username) {

	// Index to delete
	var indexToDelete = -1;

	// Find index of user to delete
	users.forEach(function(data, index) {
		if (data.username == username)
			indexToDelete = index;
	});

	// Remove user at specified index
	if (indexToDelete != -1) {
		if (users[indexToDelete].socket_ids.length > 1) {
			removeSocket(socket);
			logMsg('Socket for user: ' + username + ' successfully removed!');
		} else {
			users.splice(indexToDelete, 1);
			logMsg('User: ' + username + ' successfully removed!',1);
		}
	} else {
		logMsg('User to delete not found, doing nothing...');
	}

	// Emit new users list
	emitUserList("User logged off: " + username);
}

/**
 * Removes unused socket from the user
 * @param {Socket} socketToRemove Socket to be removed from the user
 */
function removeSocket(socketToRemove) {

	// User and socket to remove
	var userIndex = -1;
	var socketIndex = -1;

	// Find user that this socket belongs to and position of the socket in array
	users.forEach(function(user, index) {
		user.socket_ids.forEach(function(socketId, sindex) {
			if ( socketId == socketToRemove.id) {
				userIndex = index;
				socketIndex = sindex;
			};
		});
	});

	// Remove socket from the user
	if (userIndex != -1) {
		users[userIndex].socket_ids.splice(socketIndex, 1);
		logMsg('Socket: ' + socketToRemove.id + ' removed from user: ' + users[userIndex].username);
	}
}

/**
 * Emits user list to all clients
 * @param {String} message Message to show in status (reason to update list)
 */
function emitUserList(message) {

	// Build users list and emit it
	var usersList = [];
	users.forEach(function(data) {
		usersList.push(data.username);
	});
	io.emit('usersList', {
		reason : message,
		usersList : usersList
	});
}

/**
 * Processes message
 * @param {Socket} socketFrom Originating socket
 * @param {Object} data data with message to process
 */
function processMessage(socketFrom, data) {
	
	// Get socket id of the author
	var socketIdFrom = socketFrom.id;
		
	// Firstly - check if user exists in users list (if not - just ignore him)
	var userExists = false;
	users.forEach(function(user, index) {
		user.socket_ids.forEach(function(socketId, sindex) {
			if ( socketId == socketIdFrom) {
				userExists = true;
			};
		});
	});

	if(userExists) {
		
		// Get socket id of the user from "to" field
		var socketIdsTo = null;
		users.forEach(function(user) {
			if (user.username.trim() == data.to.trim()) {
				socketIdsTo = user.socket_ids;
			}
		});
	
		if (socketIdsTo != null) {
			
			// Send message to all active user sockets
			// It could be done on broadcast lists - probably better solution for future...
			socketIdsTo.forEach(function(socketId) {
				io.to(socketId).emit('message', {
					username : data.from,
					message : '/private/' + data.message
				});
			});
	
			// Send message to author
			io.to(socketIdFrom).emit('message', {
				username : data.from,
				message : '/private to: ' + data.to + '/' + data.message
			});
		} else
			// Send message to everyone
			io.emit('message', {
				username : data.from,
				message : data.message
			});
	} 
	// If user doesn't exist - show him logon prompt!
	else {
		logMsg('Suspicious login - user tries to write message without having username!',1);
		socketFrom.emit('loginResponse', {
			username : "",
			status : 'Ah-nah, no one chats without username!'
		});
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
		msg = '*** ' + msg + ' ***';
		break;
	case 1:
		msg = '== ' + msg + ' ==';
		break;
	}
	console.log('[' + date.toLocaleTimeString() + '] ' + msg);
}
