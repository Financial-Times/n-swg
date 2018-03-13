import { swgReady, importClient } from './utils';
import SubscribeButtons from './subscribe-button';
import _get from 'lodash.get';

class SwgController {

	constructor (swgClient, options={}, subscribeButtonConstructor=SubscribeButtons) {
		this.manualInitDomain = options.manualInitDomain;
		this.alreadyInitialised = false;

		this.handlers = Object.assign({
			onSubscribeResponse: this.onSubscribeResponse
		}, options.handlers);
		this.listeners = [];
		this.swgClient = swgClient;

		this.M_SWG_SUB_SUCCESS_ENDPOINT = options.M_SWG_SUB_SUCCESS_ENDPOINT; // !TODO: safe default

		if (options.subscribeFromButton) {
			this.subscribeButtons = new subscribeButtonConstructor(swgClient, {
				trackEvent: SwgController.trackEvent
			});
		};
	}

	static load ({ manual=false, swgPromise=swgReady(), loadClient=importClient, sandbox=false }={}) {
		return new Promise((resolve, reject) => {
			try {
				loadClient(document)({ manual, sandbox });
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

	addListener (type, listener) {
		this.listeners.push({ type, listener });
	}

	callListeners (ofType, event) {
		const condition = ({ type }={}) => type === ofType;
		const call = ({ listener }) => listener && listener.call(null, event);
		if (this.listeners && ofType) {
			this.listeners.filter(condition).forEach(call);
		}
	}

	signalReturn (res) {
		this.callListeners('onReturn', res);
	}

	signalError (err) {
		this.callListeners('onError', err);
	}

	addReturnListener (listener) {
		this.addListener('onReturn', listener);
	}

	addErrorListener (listener) {
		this.addListener('onError', listener);
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

	static trackEvent (action, context={}, eventConstructor=CustomEvent) {
		const detail = Object.assign({}, context, {
			category: 'SwG',
			action,
			system: { source: 'n-swg' }
		});
		document.body.dispatchEvent(new eventConstructor('oTracking.event', { detail, bubbles: true }));
	}

}

module.exports = SwgController;
