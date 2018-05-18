module.exports = class Overlay {

	constructor () {
		this.el = document.createElement('div');
		this.el.classList.add('overlay__shadow');

		this.wrapper = document.createElement('div');
		this.wrapper.classList.add('overlay__wrapper');

		this.content = document.createElement('div');
		this.content.classList.add('overlay__content');

		this.inner = document.createElement('div');
		this.inner.classList.add('overlay__inner');

		this.close = document.createElement('a');
		this.close.classList.add('overlay__close');

		this.content.appendChild(this.close);
		this.content.appendChild(this.inner);
		this.wrapper.appendChild(this.content);
		this.el.appendChild(this.wrapper);

		this.visible = false;
		this.activity = false;

		this.bindEvents();
	}

	generateCta ({ copy, callback, href }={}) {
		const button = document.createElement('a');
		button.classList.add('overlay__button');
		button.innerHTML = copy || href || 'click me';
		if (callback) button.addEventListener('click', callback);
		if (href) button.href = href;
		return button;
	}

	bindEvents () {
		this.close.addEventListener('click', (e) => {
			e.preventDefault();
			if (!this.activity) this.hide();
		});

		document.body.addEventListener('keyup', (e) => {
			if (this.visible && e.keyCode === 27) { // 27 = Escape
				if (!this.activity) this.hide();
			}
		});
	}

	show (content, cta) {
		this.activity = false; // reset activity
		this.inner.innerHTML = ''; //clear node

		if (content) {
			this.inner.innerHTML = content;
		}

		if (cta) {
			const button = this.generateCta(cta);
			this.inner.appendChild(button);
		}

		document.body.appendChild(this.el);

		this.visible = true;
	}

	hide () {
		document.body.removeChild(this.el);

		this.visible = false;
	}

	showActivity () {
		this.activity = true;
		this.content.classList.add('overlay__content--loading');
	}

	hideActivity () {
		this.activity = false;
		this.content.classList.remove('overlay__content--loading');
	}

};
