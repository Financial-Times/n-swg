import { swgReady, importClient } from './utils';
import SubscribeButtons from './subscribe-button';
import _get from 'lodash.get';

class SwgController {

	constructor (swgClient, options={}) {
		this.manualInitDomain = options.manualInitDomain;
		this.alreadyInitialised = false;
		this.handlers = Object.assign({
			onSubscribeResponse: this.onSubscribeResponse
		}, options.handlers);
		if (options.subscribeFromButton) {
			this.subscribeButtons = new SubscribeButtons(swgClient, {});
		};
		this.onReturnListeners = [];
		this.swgClient = swgClient;
	}

	static load ({ manual=false, swgPromise=swgReady}={}) {
		importClient({ manual });
		return new Promise((resolve, reject) => {
			swgReady.then(resolve).catch(reject);
		});
	}

	init () {
		if (!this.alreadyInitialised) {

			if (this.manualInitDomain) {
				this.swgClient.init(this.manualInitDomain);
			}
			// bind handlers
			this.swgClient.setOnSubscribeResponse(this.handlers.onSubscribeResponse.bind(this));

			this.alreadyInitialised = true;
		}

		if (this.subscribeButtons) {
			this.subscribeButtons.init(this.addReturnListener.bind(this));
		}
	}

	onSubscribeResponse (subPromise) {
		subPromise.then((response) => {
			this.signalReturn();
			console.log('onSubscribeResponse response', response);
			return response;
		}).catch((err) => {
			this.signalReturn();
			console.log('onSubscribeResponse error', err);
			return err;
			// document.body.dispatchEvent(new CustomEvent('oTracking.event', { detail: {
			// 	category: 'SwG',
			// 	action: 'subscription-error',
			// 	errCode: _get(err, 'activityResult.code'),
			// 	errData: _get(err, 'activityResult.data'),
			// 	system: { source: 'n-swg' }
			// }, bubbles: true }));
		});
	}

	signalReturn () {
		if (this.onReturnListeners) {
			this.onReturnListeners.forEach(listener => listener.call());
		}
	}

	addReturnListener (callback) {
		this.onReturnListeners.push(callback);
	}

}

module.exports = SwgController;
