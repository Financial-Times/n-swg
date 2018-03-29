class SubscribeButtons {

	constructor (swgClient, { selector='[data-n-swg-button]', SwgController }={}) {
		this.buttons = Array.from(document.querySelectorAll(selector));
		this.swgClient = swgClient;
		this.signal = SwgController.signal;
		this.listen = SwgController.listen;
		this.disableButtons();
	}

	init () {
		this.buttons.forEach((btn) => {
			btn.addEventListener('click', this.handleClick.bind(this));
		});
		this.listen('onReturn', this.onReturn.bind(this));
		this.enableButtons();
	}

	handleClick (event) {
		event.preventDefault();

		try {
			const skus = event.target.getAttribute('data-n-swg-button-skus').split(',');

			this.signal('track', { action: 'landing', context: { skus }, journeyStart: true });

			if (skus.length > 1) {
				this.swgClient.showOffers({ skus });
			} else if (skus.length === 1) {
				this.swgClient.subscribe(skus[0]);
			} else {
				throw new Error('n-swg: No SKUs passed to button component.');
			}
		} catch (error) {
			this.signal('onError', { error });
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

}

module.exports = SubscribeButtons;
