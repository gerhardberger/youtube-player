var $ = require('huk-browserify');
var Elapsed = require('elapsed');
var Video = require('./video.js');

function Player (dom) {
	var self = this;
	self.view = dom;
	self.data = {};
	self.state = 'INACTIVE';
	

	dom.querySelector('.close').addEventListener('click', function () {
		self.close();
	}, false);

	self.view.addEventListener('webkitTransitionEnd', function (event) {
		if (!(event.propertyName === 'opacity' && event.srcElement === self.view)) return;
		if (self.state === 'ACTIVE') return;
		self.view.style.display = 'none';
	}, false);
}

Player.prototype.start = function (video) {
	if (!video instanceof Video) return;

	var self = this;
	self.data = video.data;
	self.state = 'ACTIVE';
	
	var container = document.querySelector('body > .container');
	container.classList.add('blurred');
	
	self.view.style.display = 'block';
	setTimeout(function () { self.view.style.opacity = '1'; }, 1);

	self.startPlaying();
};

Player.prototype.startPlaying = function() {
	var self = this;
	var infos = self.view.querySelector('.infos');
	infos.innerHTML = '';
	$()
		.div({ 'class': 'title' }, self.data.title.$t)
		.div({ 'class': 'views' }, Number(self.data.yt$statistics.viewCount).toLocaleString())
		.div({ 'class': 'date', title: (new Date(self.data.media$group.yt$uploaded.$t)).toLocaleString() },
			(new Elapsed(new Date(self.data.media$group.yt$uploaded.$t))).optimal + ' ago')
		.img({ src: 'https://i.ytimg.com/i/' + self.data.author[0].yt$userId.$t + '/1.jpg' })
		.div({ 'class': 'uploader' }, self.data.author[0].name.$t)
	.appendTo(infos);

	self.control = new YT.Player('player', {
		videoId: self.data.media$group.yt$videoid.$t
		, playerVars: {
			frameborder: 0
			, allowfullscreen: 1
			, version: 3
			, rel: 0
			, theme: 'light'
			, color: 'white'
			, autohide: 1
			, autoplay: 1
			, showinfo: 0
			, wmode: 'opaque'
		}
		, events: {
			onReady: function () {
				self.control.setPlaybackQuality('hd720');
			}
			, onStateChange: function () {
				if (self.control.getPlayerState() === YT.PlayerState.ENDED && self.playlist) {
					console.log(self.playlist, self.playlistItemNumber);
					var nextItemNumber = self.playlistItemNumber + 1 === self.playlist.list.videos.length ? 0 : self.playlistItemNumber + 1;
					self.playlistItemNumber = nextItemNumber;

					var parent = self.view.querySelector('iframe').parentNode;
					parent.removeChild(self.view.querySelector('iframe'));
					parent.appendChild($.div({ 'id': 'player' }));

					self.data = self.playlist.list.videos[nextItemNumber].data;
					self.startPlaying();
				}
			}
		}
	});

	var height = self.view.offsetHeight - self.view.querySelector('.infos').offsetHeight;
	var container = self.view.querySelector('.video-container-outer');
	var playerHeight = container.offsetHeight;
	if (height === 0) return;
	if (height > playerHeight) {
		container.style.width = 'auto';
	}
	else {
		var newWidth = 16 / 9 * height;
		container.style.width = newWidth + 'px';
	}
};

Player.prototype.close = function () {
	var self = this;
	self.state = 'INACTIVE';
	
	var container = document.querySelector('body > .container');
	container.classList.remove('blurred');
	
	self.view.style.opacity = '0';
	var parent = self.view.querySelector('iframe').parentNode;
	parent.removeChild(self.view.querySelector('iframe'));
	parent.appendChild($.div({ 'id': 'player' }));
};

module.exports = Player;