import { Overlay } from '../utils';

class SubscribeButtons {

	constructor (swgClient, { selector='[data-n-swg-button]', SwgController, overlay }={}) {
		this.buttons = Array.from(document.querySelectorAll(selector));
		this.swgClient = swgClient;
		this.overlay = overlay || new Overlay();
		this.trackEvent = SwgController.trackEvent;
		this.onSwgReturn = SwgController.onReturn;
		this.onSwgError = SwgController.onError;
		this.disableButtons();
	}

	init () {
		this.buttons.forEach((btn) => {
			btn.addEventListener('click', this.handleClick.bind(this));
		});
		if (this.onSwgReturn) this.onSwgReturn(this.onReturn.bind(this));
		if (this.onSwgError) this.onSwgError(this.onReturn.bind(this));

		this.enableButtons();
	}

	handleClick (event) {
		event.preventDefault();

		this.overlay.show();

		try {
			const sku = event.target.getAttribute('data-n-swg-button-sku');
			const skus = event.target.getAttribute('data-n-swg-button-skus');

			this.trackEvent('landing', {});

			if (skus) {
				this.swgClient.showOffers({ skus: skus.split(',') });
			} else if (sku) {
				this.swgClient.subscribe(sku);
			}
		} catch (error) {
			this.overlay.hide();
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
		this.overlay.hide();
	}

}

module.exports = SubscribeButtons;
