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

module.exports = Spinner;