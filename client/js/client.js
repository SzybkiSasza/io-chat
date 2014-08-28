/* Global variables section */
var socket;
var username;

/**
 * Inits the app
 */
function init() {
	// Init the socket
	initSocket();

	// Manage user login
	manageUserLogin();
}

/**
 * Inits the socket
 */
function initSocket() {
	// Initialize socket
	socket = io.connect(document.domain, {
		'sync disconnect on unload' : false
	});

	// Action on login response
	socket.on('loginResponse', function(data) {
		logIn(data);
	});
	
	// Getting users list on change
	socket.on('usersList',function(data) {
		handleUserList(data);
	});
	
	// Getting messages
	socket.on('message',function(data) {
		handleMessage(data);
	});

	// Action on closing/refreshing window
	window.onbeforeunload = function() {
		logOff(username);
	};
}

/**
 * Manages user login - checking cookies etc.
 */
function manageUserLogin() {

	// Check if user exists in cookies
	username = getCookie('username');

	if (username == "") {
		var greybox = document.getElementById('greybox');
		greybox.classList.add("visible");
	} else {
		socket.emit('login', username);
	}
}

/**
 * Sets new user based on logon prompt
 */
function setNewUser(data) {

	// Get username field
	username = data.querySelector("#username").value;

	// Emit username to server
	if (username != "") {
		socket.emit('login', username);
	}
}

/**
 * Logs new user to the chat based on response from server
 * @param {String} data Data with info if user was positively logged in
 */
function logIn(data) {
	// Logon status field
	var logonResponse = document.getElementById('logonResponse');

	// Login prompt and greybox
	var greybox = document.getElementById('greybox');

	// Data fields
	var username = data.username;
	var status = data.status;

	if (status == 'OK') {
		// Login OK - set cookie and clear login status
		logonResponse.innerHTML = "";
		setCookie("username", username, 7);

		// Hide login prompt
		greybox.classList.remove("visible");

		// Show information about login in header
		var loggedStatus = document.getElementById('loggedStatus');
		loggedStatus.innerHTML = 'Logged in as: ' + username + ' , <a id="logoff" href="#">Log off</a>';

		// Add logging out possibility
		var logoffLink = document.getElementById('logoff');
		logoffLink.onclick = function(ev) {
			logOff(username, true);
		};
	} else {
		// Show login prompt
		logonResponse.innerHTML = status;
		greybox.classList.add("visible");
	}
}

/**
 * Logs the user off
 */
function logOff(username, withCookies) {

	// Check if cookies should be removed
	withCookies = typeof withCookies !== 'undefined' ? withCookies : false;

	if (withCookies)
		deleteCookie('username');

	// Emit logoff info to server
	socket.emit('logoff', username);

	// Show greybox again
	var greybox = document.getElementById('greybox');
	greybox.classList.add("visible");
}

/**
 * Handles users list generation
 */
function handleUserList(data) {
	
	var reason = data.reason;
	var usersList = data.usersList;
	
	console.log(reason);
	
	// Firstly - sort list alphabetically
	usersList = usersList.sort();
	
	// Secondly - display users list in a proper div
	var usersDiv = document.getElementById('usernames');
	
	var usersHTML = '<ul id="users">';
	usersList.forEach(function(data) {
		usersHTML += '<li> '+data+' </li>';
	});
	usersHTML += '</ul>';
	
	usersDiv.innerHTML = usersHTML;
	
	// Show change inside status window
	showStatusChange(reason);
}

/**
 * Shows status change with fadein and fadeout
 * @param {String} reason Reason (message) to be displayed
 */
function showStatusChange(reason) {
	
	// Get status div
	var statusBar = document.getElementById('statusBar');
	
	// Get messages list
	var messagesDiv = document.getElementById('messages');
	var messagesUl = messagesDiv.querySelector('ul');
	
	// Add new status message to the list
	messagesUl.innerHTML += '<li id="status">'+reason+'</li>';
	
	// Scroll messages div to the bottom
	messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
/**
 * @param {Element} form Form with data to send
 */
function sendMessage(form) {
	// Get message field and its value
	var messageField = form.querySelector("#message");
	var message = messageField.value;
	
	// Prepare "to" field
	var to = "";
	
	// Check if it contains "priv" tag
	if(message.indexOf('/priv')>-1) {
		// Get tag and user
	}
	
	// Emit message
	if(message != "")
		socket.emit('message',{from: username, to:to, message:message});
	
	// Return focus to message field and clear it
	messageField.value = "";
	messageField.focus();
}

function handleMessage(data) {
	
	// Show message in the message field
	var messagesDiv = document.getElementById('messages');
	var messagesUl = messagesDiv.querySelector('ul');
	
	// Date is created in this place - for now...
	var date = new Date();
	
	// Add new chat message to the list
	messagesUl.innerHTML += '<li><span>[' + date.toLocaleTimeString() + '] '+data.username+':</span> '+data.message+'</li>';
	
	// Scroll messages div to the bottom
	messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

/**
 * Sets new cookie
 * @param {String} cname Name of the cookie to set
 * @param {String} cvalue Value of the cookie
 * @param {Number} exdays Number of days to expire
 */
function setCookie(cname, cvalue, exdays) {
	var d = new Date();
	d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
	var expires = "expires=" + d.toUTCString();
	document.cookie = cname + "=" + cvalue + "; " + expires;
}

/**
 * Gets cookie by name
 * @param {String} cname Name of the cookie
 */
function getCookie(cname) {
	var name = cname + "=";
	var ca = document.cookie.split(';');
	for (var i = 0; i < ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) == ' ')
		c = c.substring(1);
		if (c.indexOf(name) != -1)
			return c.substring(name.length, c.length);
	}
	return "";
}

/**
 * Deletes cookie
 * @param {Object} cname Name of cookie to delete
 */
function deleteCookie(cname) {
	var d = new Date();
	var expires = "expires=" + d.toUTCString();
	document.cookie = cname + "=; " + expires;
}
