
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
	socket = io.connect('localhost', {'sync disconnect on unload': false });
	
	// Action on login response
	socket.on('loginResponse', function(data) {logIn(data);});
	
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
	username = data.querySelector("#username").value;
	
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
	var logonResponse = document.getElementById('logonResponse');
	
	// Login prompt and greybox
	var greybox = document.getElementById('greybox');
	
	// Data fields
	var username = data.username;
	var status = data.status;
	
	if(status=='OK') {
		// Login OK - set cookie and clear login status
		logonResponse.innerHTML = "";
		setCookie("username",username,7);
	
		// Hide login prompt
		greybox.classList.remove("visible");
		
		// Show information about login in header
		var loggedStatus = document.getElementById('loggedStatus');
		loggedStatus.innerHTML = 'Logged in as: '+username+' , <a id="logoff" href="#noaction">Log off</a>';
		
		// Add logging out possibility
		var logoffLink = document.getElementById('logoff');
		logoffLink.onclick = function(ev) {logOff(username,true);};
	} else {
		// Show login prompt
		logonResponse.innerHTML = "Something went wrong during logon: <br/>"+status;
		greybox.classList.add("visible");
	}
}

/**
 * Logs the user off
 */
function logOff(username,withCookies) {
	
	// Check if cookies should be removed
	withCookies = typeof withCookies !== 'undefined' ? withCookies : false;
	
	if(withCookies)
		deleteCookie('username');
		
	// Emit logoff info to server
	socket.emit('logoff',username);
	
	// Show greybox again
	var greybox = document.getElementById('greybox');
	greybox.classList.add("visible");
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

/**
 * Deletes cookie
 * @param {Object} cname Name of cookie to delete
 */
function deleteCookie(cname) {
	var d = new Date();
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=; " + expires;
}
