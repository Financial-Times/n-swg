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

		this.baseTrackingData = SwgController.generateTrackingData(options);
		this.activeTrackingData;
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
			// bind swg handlers
			this.swgClient.setOnSubscribeResponse(this.handlers.onSubscribeResponse.bind(this));

			// bind own handlers
			SwgController.listen('track', this.track.bind(this));

			this.alreadyInitialised = true;
		}

		if (this.subscribeButtons) {
			this.subscribeButtons.init();
		}
	}

	onSubscribeResponse (subPromise) {
		subPromise.then((response) => {
			this.signalReturn(response);
			this.track({ action: 'success', context: {} });
			this.resolveUser(response).then(() => {
				this.track({ action: 'confirmation', context: {
					// subscriptionId: response.subscriptionId
				}});
				// !TODO: redirect the now logged in user to relevant page
			});
		}).catch((err) => {
			this.signalError(err);
			this.track({ action: 'exit', context: {
				errCode: _get(err, 'activityResult.code'),
				errData: _get(err, 'activityResult.data'),
			}});
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

	track ({ action, context={}, journeyStart=false }={}) {
		const offerData = SwgController.generateOfferDataFromSku(context.skus);
		if (offerData && journeyStart) {
			// update the activeTrackingData state to include active offer
			this.activeTrackingData = offerData;
		}
		const decoratedEvent = Object.assign({}, this.baseTrackingData, this.activeTrackingData, context, { action });
		SwgController.trackEvent(decoratedEvent);
	}

	static trackEvent (detail, eventConstructor=CustomEvent) {
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

	static generateTrackingData (options={}) {
		return {
			category: 'SwG',
			formType: 'signup:swg',
			production: !options.sandbox,
			paymentMethod: 'SWG',
			system: { source: 'n-swg' }
		};
	}

	static generateOfferDataFromSku (skus=[]) {
		if (skus.length !== 1) return {};
		/**
		 * skus SHOULD follow the format
		 * ft.com_OFFER.ID_TERM_NAME.TRIAL_DATE
		 * note: currently ft.com_OFFERID_TERM
		 * ie:
		 * ft.com_abcd38.efg89_p1m_premium.trial_31.05.18
		 * ft.com_abcd38.efg89_p1y_standard_31.05.18
		 */
		const [ domain, offerId, term, name ] = skus[0].toLowerCase().split('_');
		const strContainsVal = (s, v) => s && s.indexOf(v) !== -1;
		if (strContainsVal(domain, 'ft.com')) {
			return {
				offerId: offerId && offerId.replace(/\./g, '-'),
				skuId: skus[0],
				productName: name && name.replace('.', ' '),
				term,
				productType: 'Digital',
				isTrial: strContainsVal(name, 'trial'),
				isPremium: strContainsVal(name, 'premium')
			};
		} else {
			return {};
		}
	}

	// static onReturn (listener) {
	// 	SwgController.listen('onReturn', listener);
	// }

	// static onError (listener) {
	// 	SwgController.listen('onError', listener);
	// }

}

module.exports = SwgController;
