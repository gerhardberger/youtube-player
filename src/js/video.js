var $ = require('huk-browserify');
var Elapsed = require('elapsed');
var YouTubeDataRequest = require('./youtube-data-request.js');

function Video (data, player, grid, playlist) {
	this.data = data;
	this.player = player;
	this.grid = grid;
	this.playlist = playlist;

	this.setupView(this.data);

	//this.loaded = function ()
}

Video.prototype.setupView = function (data) {
	var self = this;
	if (data !== self.data) self.data = data;
	if (!data) data = self.data;

	if (!self.data.yt$statistics) self.data.yt$statistics = { viewCount: '0' };

	var sec = self.data.media$group.yt$duration.seconds;
	var s = '';
	var hours = ~~(sec / 3600);
	if (hours > 0) {
		s += hours + ':';
		sec %= hours * 3600;
	}

	var minutes = ~~(sec / 60);
	if (minutes === 0) s += '00:';
	if (minutes > 0) {
		if (minutes < 10) s += '0' + minutes + ':';
		else s += minutes + ':';
		sec %= minutes * 60;
	}

	if (sec < 10) s += '0' + sec;
	else s += sec;

	var duration = s;


	self.view = $.div({ 'class': 'video'}, 
		$()
			.img({ src: 'http://i3.ytimg.com/vi/' + self.data.media$group.yt$videoid.$t + '/mqdefault.jpg' })
			.div({ 'class': 'title', title: self.data.title.$t }, self.data.title.$t.length > 40 ? self.data.title.$t.slice(0, 38) + '...' : self.data.title.$t)
			.div({ 'class': 'duration' }, duration)
			.div({ 'class': 'views' }, Number(self.data.yt$statistics.viewCount).toLocaleString())
			.div({ 'class': 'date', title: (new Date(self.data.media$group.yt$uploaded.$t)).toLocaleString() },
				(new Elapsed(new Date(self.data.media$group.yt$uploaded.$t))).optimal + ' ago')
			.div({ 'class': 'uploader' }, self.data.author[0].name.$t)
			.button({ 'class': 'plus' }, '+'));
	if (!self.player) return self.view;

	var handler = function () {
		self.player.start(self);
		self.player.playlist = undefined;
		self.player.playlistItemNumber = undefined;
	};

	self.view.querySelector('img').addEventListener('click', handler, false);
	self.view.querySelector('.title').addEventListener('click', handler, false);
	self.view.querySelector('.uploader').addEventListener('click', function () {
		var name = this.innerHTML;
		var req = new YouTubeDataRequest({
			type: 'uservideos'
			, uri: self.data.author[0].uri.$t
		});
		self.grid.loadContent(req, name);
	}, false);

	self.view.querySelector('.plus').addEventListener('click', function () {
		self.playlist.add(self);
	}, false);

	return self.view;
};

module.exports = Video;