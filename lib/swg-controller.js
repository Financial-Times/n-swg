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
		this.onErrorListeners = [];
		this.swgClient = swgClient;
	}

	static load ({ manual=false, swgPromise=swgReady}={}) {
		return new Promise((resolve, reject) => {
			try {
				importClient({ manual });
			} catch (e) {
				reject(e);
			}
			swgPromise.then(resolve);
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
			const swgEventsListeners = {
				onReturn: this.addReturnListener.bind(this),
				onError: this.addErrorListener.bind(this)
			};
			this.subscribeButtons.init(swgEventsListeners);
		}
	}

	onSubscribeResponse (subPromise) {
		subPromise.then((response) => {
			this.signalReturn(response);
			return response;
		}).catch((err) => {
			this.signalError(err);
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

	signalReturn (res) {
		if (this.onReturnListeners) {
			this.onReturnListeners.forEach(listener => listener.call(null, res));
		}
	}

	signalError (err) {
		if (this.onErrorListeners) {
			this.onErrorListeners.forEach(listener => listener.call(null, err));
		}
	}

	addReturnListener (callback) {
		this.onReturnListeners.push(callback);
	}

	addErrorListener (callback) {
		this.onErrorListeners.push(callback);
	}

}

module.exports = SwgController;
