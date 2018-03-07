import { Overlay } from '../utils';

class SubscribeButtons {

	constructor (swgClient, { selector='[data-n-swg-button]', trackEvent, overlay }={}) {
		this.buttons = Array.from(document.querySelectorAll(selector));
		this.swgClient = swgClient;
		this.overlay = overlay || new Overlay();
		this.trackEvent = trackEvent;
		this.disableButtons();
	}

	init (swgEventListeners) {
		this.buttons.forEach((btn) => {
			btn.addEventListener('click', this.handleClick.bind(this));
		});
		this.enableButtons();
		if (swgEventListeners) {
			swgEventListeners.onReturn((res) => {
				this.onReturn(res);
			});
			swgEventListeners.onError((err) => {
				this.onReturn(err);
			});
		}
	}

	handleClick (event) {
		event.preventDefault();

		this.overlay.show(); // maybe this isn't needed as google already overlay on return

		try {
			const sku = event.target.getAttribute('data-n-swg-button-sku');
			this.trackEvent('landing', {});
			this.swgClient.subscribe(sku);
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
			btn.removeAttribute('disabled');
		});
	}

	onReturn () {
		this.overlay.hide();
	}

}

module.exports = SubscribeButtons;
