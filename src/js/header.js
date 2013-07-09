var YouTubeDataRequest = require('./youtube-data-request.js');

function Header (dom) {
	var self = this;
	self.view = dom;

	dom.querySelector('.yt').addEventListener('click', function () {
		if (!self.user.username) return;
		var req = new YouTubeDataRequest({
			type: 'newvideos'
			, username: self.user.username
			, maxResults: 30
		});

		self.grid.loadContent(req, 'New videos');
	}, false);
}

module.exports = Header;