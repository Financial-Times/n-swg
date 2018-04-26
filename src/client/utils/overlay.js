module.exports = class Overlay {

	constructor () {
		this.el = document.createElement('div');
		this.el.classList.add('overlay__shadow');

		this.content = document.createElement('div');
		this.content.classList.add('overlay__content');

		this.inner = document.createElement('div');
		this.inner.classList.add('overlay__inner');

		this.close = document.createElement('a');
		this.close.classList.add('overlay__close');

		this.content.appendChild(this.close);
		this.content.appendChild(this.inner);
		this.el.appendChild(this.content);

		this.visible = false;

		this.bindEvents();
	}

	bindEvents () {
		this.close.addEventListener('click', (e) => {
			e.preventDefault();

			this.hide();
		});

		document.body.addEventListener('keyup', (e) => {
			if (this.visible && e.keyCode === 27) { // 27 = Escape
				this.hide();
			}
		});
	}

	show (content) {
		this.inner.innerHTML = ''; //clear node

		if (content) {
			this.inner.innerHTML = content;
		}

		document.body.appendChild(this.el);

		this.visible = true;
	}

	hide () {
		document.body.removeChild(this.el);

		this.visible = false;
	}

};
