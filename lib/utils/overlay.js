let el;

class Overlay {

	constructor () {
		if (!el) {
			el = document.createElement('div');
			el.classList.add('o-overlay-shadow');
		}
	}

	show () {
		document.body.appendChild(el);
	}

	hide () {
		document.body.removeChild(el);
	}

};

module.exports = Overlay;
