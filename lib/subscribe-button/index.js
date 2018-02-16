import { Overlay } from '../utils';

class SubscribeButtons {

	constructor (swgClient, { selector='[data-n-swg-button]' }={}) {
		this.buttons = Array.from(document.querySelectorAll(selector));
		this.swgClient = swgClient;
		this.overlay = new Overlay();
		this.disableButtons();
	}

	init (onSwgReturn) {
		this.buttons.forEach((btn) => {
			btn.addEventListener('click', this.handleClick.bind(this));
		});
		this.enableButtons();
		onSwgReturn(() => {
			this.onReturn();
		});
	}

	handleClick (event) {
		event.preventDefault();

		this.overlay.show(); // maybe this isn't needed as google already overlay on return

		try {
			const TEST_SKU = 'basic_daily_1'; // or 'premium_daily_1'
			const sku = TEST_SKU || event.target.getAttribute('data-n-swg-button-sku');
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
