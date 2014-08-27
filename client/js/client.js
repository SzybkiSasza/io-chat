
var socket;
var login;

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
	socket = io();
	socket.on('login', function(data) {logIn(data);});
}

/**
 * Manages user login - checking cookies etc.
 */
function manageUserLogin() {
	
	// Check if user exists in cookies
	var username = getCookie('username');
	
	if(username=="") {
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
	var username = data.querySelector("#username").value;
	
	// Emit username to server
	if(username!="") {
		socket.emit('login', username);
	}
}

/**
 * Logs new user to the chat based on response from server
 * @param {String} data Data with info if user was positively logged in
 */
function logIn(data) {
	// Logon status field
	var logonStatus = document.getElementById('logonStatus');
	
	// Login prompt and greybox
	var greybox = document.getElementById('greybox');
	
	// Data fields
	var username = data.username;
	var status = data.status;
	
	if(status=='OK') {
		// Login OK - set cookie and clear login status
		logonStatus.innerHTML = "";
		setCookie("username",username,7);
	
		// Hide login prompt
		greybox.classList.remove("visible");
	} else {
		// Show login prompt
		logonStatus.innerHTML = "Something went wrong during logon: <br/>"+status;
		greybox.classList.add("visible");
	}
}

/**
 * Sets new cookie
 * @param {String} cname Name of the cookie to set
 * @param {String} cvalue Value of the cookie
 * @param {Number} exdays Number of days to expire
 */
function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}

/**
 * Gets cookie by name
 * @param {String} cname Name of the cookie
 */
function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) != -1) return c.substring(name.length,c.length);
    }
    return "";
}
