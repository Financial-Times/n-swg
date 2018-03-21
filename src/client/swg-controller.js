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
		this.swgClient = swgClient;

		this.M_SWG_SUB_SUCCESS_ENDPOINT = options.M_SWG_SUB_SUCCESS_ENDPOINT || 'https://swg-fulfilment-svc-eu-test.memb.ft.com/subscriptions';

		if (options.subscribeFromButton) {
			this.subscribeButtons = new subscribeButtonConstructor(swgClient, { SwgController });
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
			this.subscribeButtons.init();
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
				body: JSON.stringify(swgResponse),
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

	signalReturn (res) {
		SwgController.signal('onReturn', res);
	}

	signalError (err) {
		SwgController.signal('onError', err);
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

	static signal (action, context={}, eventConstructor=CustomEvent) {
		document.body.dispatchEvent(new eventConstructor(`nSwg.${action}`, { detail: context, bubbles: true }));
	}

	static listen (action, callback) {
		document.body.addEventListener(`nSwg.${action}`, (event={}) => {
			callback(event.detail);
		});
	}

	static onReturn (listener) {
		SwgController.listen('onReturn', listener);
	}

	static onError (listener) {
		SwgController.listen('onError', listener);
	}

}

module.exports = SwgController;
