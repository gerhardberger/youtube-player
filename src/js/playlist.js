var $ = require('huk-browserify');
var Video = require('./video.js');

function Playlist (dom) {
	this.view = dom;
	this.list = {
		videos: []
		, view: dom.querySelector('ul')
	};
}

Playlist.prototype.add = function(video) {
	if (!video instanceof Video) return;
	var self = this;

	var dom = $.li({ title: video.data.title.$t }, $()
		.a(document.querySelector('.player .close').innerHTML)
		.img({ src: 'http://i3.ytimg.com/vi/' + video.data.media$group.yt$videoid.$t + '/mqdefault.jpg' }));
	video.view = dom;
	self.list.videos.push(video);
	var itemNumber = self.list.videos.length - 1;

	dom.querySelector('a').addEventListener('click', function (event) {
		event.stopPropagation();
		self.list.videos.splice(self.list.videos.indexOf(video), 1);
		dom.style.webkitTransform = 'scale(0)';
		dom.style.mozTransform = 'scale(0)';
		dom.style.opacity = '0';
		var handler = function () { dom.parentNode.removeChild(dom); };
		dom.addEventListener('webkitTransitionEnd', handler, false);
		dom.addEventListener('mozTransitionEnd', handler, false);
	}, false);

	dom.addEventListener('click', function (event) {
		video.player.start(video);
		video.player.playlist = self;
		video.player.playlistItemNumber = itemNumber;
	}, false);

	self.list.view.appendChild(dom);
	setTimeout(function () { dom.style.webkitTransform = 'scale(1)'; }, 1);
};

module.exports = Playlist;