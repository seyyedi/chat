var app = {
	init: function () {
		this.socket = io();

		this.socket.on('chat-message', function (msg) {
			app.newMessage(msg);
		});

		var user = localStorage['chat.user'];

		if (user) {
			this.login(user);
		}

		var tbMessage = $('.new-message > textarea');

		tbMessage.keyup(function (e) {
			if (e.ctrlKey && e.keyCode === 13) {
				var value = tbMessage.val();

				if (value.startsWith('/')) {
					var tokens = value.substr(1).split(' ');
					var cmd = tokens[0];

					if (cmd === 'login') {
						app.login(tokens[1]);
					}
					else {
						app.notify('warn', 'Unknown command', '<b>' + cmd + '</b> is not recognized as a valid command');
					}
				}
				else {
					app.sendMessage(tbMessage.val());
				}

				tbMessage.val('');
			}
		});

		tbMessage.focus();
	},
	login: function (user) {
		this.user = localStorage['chat.user'] = user;
		this.socket.emit('login', this.user);
	},
	sendMessage: function (text) {
		if (!this.user) {
			this.notify('warn', 'You must login first', 'Example: /login your-username')
			return;
		}

		var msg = {
			from: this.user,
			created: new Date().toISOString(),
			text: text
		};

		this.newMessage(msg);
		this.socket.emit('chat-message', msg);
	},
	newMessage: function (msg) {
		var el = $('<div class="message">');
		el.html('<b>' + msg.from + '</b> ' + msg.text);

		if (msg.from === this.user) {
			el.addClass('me');
		}

		$('.messages').append(el);
	},
	notify: function (type, title, text) {
		new PNotify({
			type: type,
			title: title,
			text: text
		});
	}
};

$(document).ready(function () {
	app.init();
});