class Overlay {

	constructor () {
		this.el = document.createElement('div');
		this.el.classList.add('o-overlay-shadow');
	}

	show (content) {
		this.el.innerHTML = ''; //clear node

		if (content) {
			this.el.innerHTML = `<div class="o-overlay-inner">${content}</div>`;
		}

		document.body.appendChild(this.el);
	}

	hide () {
		document.body.removeChild(this.el);
	}

};

module.exports = Overlay;
