const { events } = require('../utils');

module.exports = class SubscribeButtons {

	constructor (swgClient, { selector='[data-n-swg-button]' }={}) {
		this.buttons = Array.from(document.querySelectorAll(selector));
		this.swgClient = swgClient;
		this.disableButtons();
	}

	init () {
		this.buttons.forEach((btn) => {
			btn.addEventListener('click', this.handleClick.bind(this));
		});
		events.listen('onReturn', this.onReturn.bind(this));
		this.enableButtons();
	}

	handleClick (event) {
		event.preventDefault();

		try {
			const skus = event.target.getAttribute('data-n-swg-button-skus').split(',');

			if (skus.length > 1) {
				this.swgClient.showOffers({ skus });
			} else if (skus.length === 1) {
				this.swgClient.subscribe(skus[0]);
			} else {
				throw new Error('n-swg: No SKUs passed to button component.');
			}
		} catch (error) {
			events.signal('onError', { error });
		}
	}

	disableButtons () {
		this.buttons.forEach(btn => {
			btn.disabled = true;
		});
	}

	enableButtons () {
		this.buttons.forEach(btn => {
			btn.disabled = false;
			btn.removeAttribute('disabled');
		});
	}

	onReturn () {
		this.disableButtons();
	}

};
