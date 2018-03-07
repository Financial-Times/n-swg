class Overlay {

	constructor () {
		this.el = document.createElement('div');
		this.el.classList.add('o-overlay-shadow');
	}

	show () {
		document.body.appendChild(this.el);
	}

	hide () {
		document.body.removeChild(this.el);
	}

};

module.exports = Overlay;
