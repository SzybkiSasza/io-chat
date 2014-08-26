
var socket;
var login;

/**
 * Inits the app
 */
function init() {
	// Initialize socket
	socket = io();
	
	// Check if user is already logged
	var username = getCookie('username');
	if(username=="")
		showLogonPrompt();
	else
		logIn(username);
}

/**
 * Displays logon prompt when user is not found
 */
function showLogonPrompt() {
	var greybox = document.getElementById('greybox');
	var logonWindow = document.getElementById('logScreen');
	
	greybox.classList.add("visible");
	
	var logonWindowHTML ='<h2>Please choose username:</h2>';
	logonWindowHTML += '<form id="loginForm" action="" onsubmit="setNewUser(this); return false;">';
	logonWindowHTML += '<input type="text" id="username" placeholder="Username..."/><input type="button" value="Log in" onclick="setNewUser(this.form)"/>';
	logonWindowHTML += '</form><div id="logonStatus"></div>';
	
	logonWindow.innerHTML = logonWindowHTML;
}

/**
 * Sets new user based on logon prompt
 */
function setNewUser(data) {
	
	// Get username field
	var username = data.querySelector("#username").value;
	
	console.log("Creating new user: ");
	console.log(username);
	
	// Prepare logon status field
	var logonStatus = document.getElementById('logonStatus');
	
	if(username!="") {
		var loginStatus = logIn(username);
		console.log(loginStatus);
		if(loginStatus=="") {
			
			// Login OK - set cookie and clear login status
			logonStatus.innerHTML = "";
			setCookie("username",username,7);
		
			// Hide login prompt
			var greybox = document.getElementById('greybox');
			greybox.classList.remove("visible");
		} else {
			logonStatus.innerHTML = "Something went wrong during logon: "+loginStatus+", try again later";
		}
	}
}

/**
 * Logs new user to the chat
 * @param {String} username Username to log in
 */
function logIn(username) {
	socket.emit('login', username, function(data) {
		console.log(data);
	});	
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
