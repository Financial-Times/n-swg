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
		this.onReturnListeners = [];
		this.onErrorListeners = [];
		this.swgClient = swgClient;

		this.M_SWG_SUB_SUCCESS_ENDPOINT = options.M_SWG_SUB_SUCCESS_ENDPOINT; // !TODO: safe default

		if (options.subscribeFromButton) {
			this.subscribeButtons = new SubscribeButtons(swgClient, {
				trackEvent: SwgController.trackEvent
			});
		};
	}

	static load ({ manual=false, swgPromise=swgReady, sandbox=false}={}) {
		return new Promise((resolve, reject) => {
			try {
				importClient({ manual, sandbox });
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
			SwgController.trackEvent('success', {});
			this.resolveUser(response).then(() => {
				SwgController.trackEvent('confirmation', {});
				// !TODO: redirect the now logged in user to relevant page
			});
		}).catch((err) => {
			this.signalError(err);
			SwgController.trackEvent('exit', {
				errCode: _get(err, 'activityResult.code'),
				errData: _get(err, 'activityResult.data'),
			});
		});
	}

	resolveUser (swgResponse) {
		return new Promise((resolve, reject) => {
			SwgController.fetch(this.M_SWG_SUB_SUCCESS_ENDPOINT, {
				method: 'POST',
				body: this.combinedPayload(swgResponse),
				headers: {
					'content-type': 'application/json'
				}
			})
			.then(({ json }) => {
				resolve(json);
			})
			.catch(err => {
				reject(err);
			});
		});
	}

	combinedPayload (swgResponse) {
		return JSON.stringify({
			swg: swgResponse,
			source: {
				'country-code': 'GBR' // !TODO: set this dynamically incase swg does not return it
			}
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

	static fetch (url, options, _fetch=self.fetch) {
		return new Promise((resolve, reject) => {
			const defaults = {
				credentials: 'same-origin',
				method: 'GET'
			};

			_fetch(url, Object.assign({}, defaults, options))
				.then(res => {
					if (res.status === 200 || res.status === 201) {
						res.json().then(json => {
							resolve({
								json,
								headers: res.headers,
								status: res.status
							});
						});
					} else {
						res.text().then(txt => {
							reject(new Error(`Bad response STATUS=${res.status} TEXT="${txt}"`));
						});
					}
				})
				.catch(reject);
		});
	}

	static trackEvent (action, context={}) {
		const detail = Object.assign({}, context, {
			category: 'SwG',
			action,
			system: { source: 'n-swg' }
		});
		document.body.dispatchEvent(new CustomEvent('oTracking.event', { detail , bubbles: true }));
	}

}

module.exports = SwgController;
