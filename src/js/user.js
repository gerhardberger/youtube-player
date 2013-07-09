var YouTubeDataRequest = require('./youtube-data-request.js');

function User (header, grid) {
	var self = this;
	var storage = window.localStorage;

	var loginField = header.view.querySelector('#loginField');
	var loginSubmit = header.view.querySelector('#loginSubmit');
	var loginHandler = function () {
		var username = loginField.value;
		if (!username) return;
		self.username = username;
		loginSubmit.value = 'Sign out';
		storage.setItem('user', username);

		var req = new YouTubeDataRequest({
			type: 'newvideos'
			, username: username
			, maxResults: 30
		});

		grid.loadContent(req, 'New videos');
	};
	var logoutHandler = function () {
		self.username = '';
		loginField.value = '';
		loginSubmit.value = 'Sign in';
		storage.removeItem('user');
	};

	var user = storage.getItem('user');
	if (user) {
		self.username = user;
		loginSubmit.value = 'Sign out';
		loginField.value = user;
		var req = new YouTubeDataRequest({
			type: 'newvideos'
			, username: user
			, maxResults: 30
		});

		grid.loadContent(req, 'New videos');
		loginSubmit.removeEventListener('click', loginHandler, false);
		loginSubmit.addEventListener('click', logoutHandler, false);
	}
	else {
		loginSubmit.removeEventListener('click', logoutHandler, false);
		loginSubmit.addEventListener('click', loginHandler, false);
	}
}

module.exports = User;