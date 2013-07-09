var Player = require('./player.js');
var Playlist = require('./playlist.js');
var Grid = require('./grid.js');
var User = require('./user.js');
var Spinner = require('./spinner.js');
var YouTubeDataRequest = require('./youtube-data-request.js');
var Header = require('./header.js');



window.onload = function () {



var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var header = new Header(document.querySelector('.container > header'));
var player = new Player(document.querySelector('.player'));
var playlist = new Playlist(document.querySelector('.playlist'));
var grid = new Grid(document.querySelector('.container > section'));

header.spinner = new Spinner(document.querySelector('.container > header .spinner'));
header.grid = grid;

grid.playlist = playlist;
grid.player = player;
grid.spinner = header.spinner;

playlist.grid = grid;

var homeUser = new User(header, grid);
header.user = homeUser;

/*document.querySelector('.yt').addEventListener('click', function () {
	if (!homeUser.username) return;
	var req = new YouTubeDataRequest({
		type: 'newvideos'
		, username: homeUser.username
		, maxResults: 30
	});

	grid.loadContent(req, 'New videos');
}, false);*/


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

window.addEventListener('resize', function () {
	var height = player.view.offsetHeight - player.view.querySelector('.infos').offsetHeight;
	var container = player.view.querySelector('.video-container-outer');
	var playerHeight = container.offsetHeight;
	if (height === 0) return;
	if (height > playerHeight) {
		container.style.width = 'auto';
	}
	else {
		var newWidth = 16 / 9 * height;
		container.style.width = newWidth + 'px';
	}

});





};