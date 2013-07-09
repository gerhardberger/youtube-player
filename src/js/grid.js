var Video = require('./video.js');

function Grid (dom) {
	this.view = dom;
	this.videos = [];
	this.state = 'INACTIVE';

	this.list = {};
	this.list.view = dom.querySelector('.list');

	this.header = {};
	this.header.caption = '';
	this.header.view = dom.querySelector('header');
}

Grid.prototype.addVideo = function (video) {
	if (!video instanceof Video || !video) return;

	this.videos.push(video);
	this.list.view.appendChild(video.view);
};

Grid.prototype.setCaption = function (str) {
	this.header.caption = str;
	this.header.view.innerHTML = str;
};

Grid.prototype.loadContent = function (req, title) {
	var self = this;
	if (self.state === 'ACTIVE') return;
	self.request = req;

	self.list.view.innerHTML = '';
	self.appendContent(title);
};

Grid.prototype.appendContent = function(title) {
	var self = this;
	if (self.state === 'ACTIVE' || self.request.done) return;
	self.state = 'ACTIVE';


	self.spinner.start();
	self.request.fetch(function (err, body) {
		var feed = body.feed;
		self.spinner.end();

		self.setCaption(title ? title : feed.title.$t);
		feed.entry.map(function (videoData) {
			var video = new Video(videoData, self.player, self, self.playlist);
			self.addVideo(video);
		});
		self.state = 'INACTIVE';
	});
};

module.exports = Grid;