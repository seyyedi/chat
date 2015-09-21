var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var args = require('minimist')(process.argv.slice(2));
var path = require('path');

var options = {
	port: args.port || 3000
};

var server = {
	users: [],
	lastUserId: 0,
	broadcast: function (text) {
		var msg = {
			from: 'Server',
			text: text
		};

		server.messages.push(msg);
		io.emit('chat-message', msg);
	},
	messages: []
};

app.use(
	express.static('app')
);

app.getStaticFile = function (url, file) {
	app.get(url, function (req, res) {
		res.sendFile(
			path.resolve(file)
		);
	});
};

app.getStaticFile('/', 'app.html');
app.getStaticFile('/socket.io.js', 'node_modules/socket.io-client/socket.io.js');
app.getStaticFile('/jquery.js', 'node_modules/jquery/dist/jquery.js');

io.on('connection', function (socket) {
	var user = {
		id: server.lastUserId + 1,
		socket: socket,
		active: false
	};

	server.lastUserId = user.id;
	server.users.push(user);

	console.log('User #' + user.id + ' connected');

	socket.on('disconnect', function () {
		console.log('User #' + user.id + ' disconnected');
		server.users.splice(server.users.indexOf(user), 1);

		if (user.active) {
			server.broadcast(user.name + ' left');
		}
	});

	socket.on('login', function (name) {
		user.name = name;
		user.active = true;

		console.log('User #' + user.id + ' logged in as ' + user.name);
		socket.emit('logged-in');

		for (var i = 0; i < server.messages.length; i++) {
			socket.emit('chat-message', server.messages[i]);
		}

		server.broadcast(user.name + ' joined');
	});

	socket.on('chat-message', function (msg) {
		if (!user.active) {
			console.warn('Anonymous user wants to send a chat message');
			return;
		}

		if (user.name !== msg.from) {
			console.warn('Receiving message from ' + msg.from + ' in context of user ' + user.name);
			return;
		}

		server.messages.push(msg);
		socket.broadcast.emit('chat-message', msg);
	});
});

http.listen(options.port, function () {
	console.log('Chat server listening on *:' + options.port);
});