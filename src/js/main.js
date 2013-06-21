var request = require('browser-request');
var $ = require('huk-browserify');
var _ = require('underscore');

var DEFAULT_URL = 'https://gdata.youtube.com/feeds/api/users/skagames/newsubscriptionvideos?v=2.1&alt=json&start-index=1&max-results=40&orderby=published'; //'https://gdata.youtube.com/feeds/api/standardfeeds/recently_featured?alt=json'



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
 
	self.view = $.div({ 'class': 'video'}, 
		$()
			.img({ src: 'http://i3.ytimg.com/vi/' + self.data.media$group.yt$videoid.$t + '/mqdefault.jpg' })
			.div({ 'class': 'title', title: self.data.title.$t }, self.data.title.$t.length > 40 ? self.data.title.$t.slice(0, 38) + '...' : self.data.title.$t)
			.div({ 'class': 'duration' }, self.data.media$group.yt$duration.seconds)
			.div({ 'class': 'views' }, self.data.yt$statistics.viewCount)
			.div({ 'class': 'date' }, (new Date(self.data.media$group.yt$uploaded.$t)).toLocaleDateString())
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


function Header (dom) {
	this.view = dom;
}

function Spinner (dom) {
	this.view = dom;
	this.state = 'HIDDEN';
}

Spinner.prototype.start = function () {
	this.view.classList.add('loading');
	this.view.parentNode.querySelector('.yt').classList.add('loading');
	this.state = 'ACTIVE';
};

Spinner.prototype.end = function () {
	this.view.parentNode.querySelector('.yt').classList.remove('loading');
	this.view.classList.remove('loading');
	this.state = 'HIDDEN';
};

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
		.div({ 'class': 'views' }, self.data.yt$statistics.viewCount)
		.div({ 'class': 'date' }, (new Date(self.data.media$group.yt$uploaded.$t)).toLocaleDateString())
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
					console.log(self.playlistItemNumber, nextItemNumber, self.playlist.list.videos.length)
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
		self.list.videos.splice(self.list.videos.indexOf(video));
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


window.onload = function () {



var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var header = new Header(document.querySelector('.container > header'));
var player = new Player(document.querySelector('.player'));
var playlist = new Playlist(document.querySelector('.playlist'));
var grid = new Grid(document.querySelector('.container > section'));
window.player = player;

header.spinner = new Spinner(document.querySelector('.container > header .spinner'));

grid.playlist = playlist;
grid.player = player;
grid.spinner = header.spinner;

playlist.grid = grid;

var homeUser = new User(header, grid);

document.querySelector('.yt').addEventListener('click', function () {
	if (!homeUser.username) return;
	var req = new YouTubeDataRequest({
		type: 'newvideos'
		, username: homeUser.username
		, maxResults: 30
	});

	grid.loadContent(req, 'New videos');
}, false);


window.addEventListener('scroll', function (event) {
	var body = document.querySelector('body');

	if (body.scrollHeight === body.scrollTop + body.clientHeight) grid.appendContent();

}, false);


header.view.querySelector('#searchSubmit').addEventListener('click', function (event) {
	var key = header.view.querySelector('#searchField').value;
	var req = new YouTubeDataRequest({
		type: 'search'
		, key: key
		, orderBy: 'relevance'
	});
	grid.loadContent(req, 'Search results for ' + key);
}, false);

};