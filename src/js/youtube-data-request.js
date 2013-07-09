var request = require('browser-request');

function YouTubeDataRequest (options) {
	var self = this;
	self.done = false;
	if (options.type === 'newvideos') {
		if (!options.username) options.username = 'default';
		self.baseURL = 'https://gdata.youtube.com/feeds/api/users/' + options.username + '/newsubscriptionvideos?v=2.1&alt=json';
	}
	else if (options.type === 'search') {
		self.baseURL = 'https://gdata.youtube.com/feeds/api/videos?q=' + options.key + '&v=2.1&alt=json';
	}
	else if (options.type === 'uservideos') {
		self.baseURL = options.uri + '/uploads?&v=2.1&alt=json';	
	}

	self.startIndex = options.startIndex || 1;
	self.maxResults = options.maxResults || 25;
	self.orderBy = options.orderBy || 'published';
}

YouTubeDataRequest.prototype.fetch = function (callback) {
	var self = this;
	if (self.done) return;
	var url = self.baseURL + '&start-index=' + self.startIndex +
		'&max-results=' + self.maxResults + '&orderby=' + self.orderBy;
	
	request(url, function (err, res) {
		if (err) callback.call(self, err, res);
		else {
			self.startIndex += self.maxResults;
			var body = JSON.parse(res.body);
			if (body.feed.openSearch$itemsPerPage.$t + body.feed.openSearch$startIndex.$t >= body.feed.openSearch$totalResults.$t)
				self.done = true;
			callback.call(self, err, body);
		}
	});
};

module.exports = YouTubeDataRequest;