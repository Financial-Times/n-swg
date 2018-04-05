import { swgReady, importClient, Overlay } from './utils';
import SubscribeButtons from './subscribe-button';
import _get from 'lodash.get';

class SwgController {

	constructor (swgClient, options={}, subscribeButtonConstructor=SubscribeButtons, overlay) {
		/* options */
		this.manualInitDomain = options.manualInitDomain;
		this.M_SWG_SUB_SUCCESS_ENDPOINT = options.M_SWG_SUB_SUCCESS_ENDPOINT || (options.sandbox ? 'https://swg-fulfilment-svc-eu-test.memb.ft.com/subscriptions' : 'https://swg-fulfilment-svc-eu-prod.memb.ft.com/subscriptions');
		this.POST_SUBSCRIBE_URL = 'https://www.ft.com/profile?splash=swg_checkout';

		this.alreadyInitialised = false;
		this.swgClient = swgClient;

		/* bind handlers */
		this.handlers = Object.assign({
			onEntitlementsResponse: this.onEntitlementsResponse,
			onFlowCanceled: this.onFlowCanceled,
			onFlowStarted: this.onFlowStarted,
			onSubscribeResponse: this.onSubscribeResponse
		}, options.handlers);
		this.swgClient.setOnEntitlementsResponse(this.handlers.onEntitlementsResponse.bind(this));
		this.swgClient.setOnFlowCanceled(this.handlers.onFlowCanceled.bind(this));
		this.swgClient.setOnFlowStarted(this.handlers.onFlowStarted.bind(this));
		this.swgClient.setOnSubscribeResponse(this.handlers.onSubscribeResponse.bind(this));

		if (options.subscribeFromButton) {
			/* setup buttons */
			this.subscribeButtons = new subscribeButtonConstructor(swgClient, { SwgController });
		};

		this.overlay = overlay || new Overlay();
		this.baseTrackingData = SwgController.generateTrackingData(options);
		this.activeTrackingData;
	}

	init () {
		if (this.alreadyInitialised) return;

		if (this.manualInitDomain) {
			this.swgClient.init(this.manualInitDomain);
		}

		this.alreadyInitialised = true;

		// bind own handlers
		SwgController.listen('track', this.track.bind(this));
		SwgController.listen('onError', this.errorEventHandler.bind(this));

		/* check user entitlements */
		this.checkEntitlements().then((res={}) => {
			if (res.granted) {
				this.resolveUser(res.entitlements)
					.then(() => this.onwardEntitledJourney({ success: true }))
					.catch(err => {
						SwgController.signalError(err);
						this.onwardEntitledJourney({ success: false });
					});
			} else if (this.subscribeButtons) {
				this.subscribeButtons.init();
			}
		});
	}

	checkEntitlements () {
		const formatResponse = (resolve) => (entitlements={}) => {
			const granted = entitlements && entitlements.enablesThis();
			resolve({ granted, entitlements });
		};
		return new Promise((resolve) => {
			SwgController.listen('entitlementsResponse', formatResponse(resolve));
			this.swgClient.getEntitlements();
		});
	}

	onSubscribeResponse (subPromise) {
		subPromise.then((response) => {
			/* disable any buttons */
			if (this.subscribeButtons) this.subscribeButtons.disableButtons();
			/* signal a return event to any listeners */
			SwgController.signal('onSubscribeReturn', response);
			/* track success event */
			this.track({ action: 'success', context: {} });
			/* resolve user */
			this.resolveUser(response).then((res) => {
				response.complete().then(() => {
					this.track({ action: 'confirmation', context: {
						// subscriptionId: response.subscriptionId
					}});
					this.onwardSubscribedJourney(res);
				});
			});
		}).catch((err) => {
			/* signal error event to any listeners */
			SwgController.signalError(err);
			this.track({ action: 'exit', context: {
				errCode: _get(err, 'activityResult.code'),
				errData: _get(err, 'activityResult.data'),
			}});
		});
	}

	onFlowStarted (flowName) {
		SwgController.signal(`flowStarted.${flowName}`);
		this.track({ action: 'flowStarted', context: { flowName } });
	}

	onFlowCanceled (flowName) {
		SwgController.signal(`flowCanceled.${flowName}`);
		this.track({ action: 'flowCanceled', context: { flowName } });
	}

	onEntitlementsResponse (entitlementsPromise) {
		entitlementsPromise.then((entitlements) => {
			SwgController.signal('entitlementsResponse', entitlements);
		}).catch(SwgController.signalError);
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
			.then(({ json }) => resolve(json))
			.catch(reject);
		});
	}

	onwardEntitledJourney ({ success=false }={}) {
		// console.log('FT.COM ONWARD ENTITLED', JSON.stringify(o, null, 2));
		const uuid = SwgController.getContentUuidFromUrl();
		const directUrl = uuid ? `https://www.ft.com/content/${uuid}` : 'https://www.ft.com';
		const viaLoginUrl = `https://www.ft.com/login?location=${encodeURIComponent(directUrl)}`;

		if (success) {
			this.overlay.show(`<p>It looks like you already have an FT.com subscription with Google. You have been logged in.<br /><a href="${directUrl}">Go to content</a><br /><br /><small>code: ENTITLED_LOGIN_SUCCESS</small></p>`);
		} else {
			this.overlay.show(`<p>It looks like you already have an FT.com subscription with Google.<br /><a href="${viaLoginUrl}">Please login</a><br /><br /><small>code: ENTITLED_LOGIN_REQUIRED</small></p>`);
		}
	}

	onwardSubscribedJourney () {
		// console.log('FT.COM ONWARD SUBSCRIBED', JSON.stringify(o, null, 2));
		const uuid = SwgController.getContentUuidFromUrl();
		const url = this.POST_SUBSCRIBE_URL + (uuid ? '&ft-content-uuid=' + uuid : '');
		SwgController.redirectTo(url);
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

	errorEventHandler (detail={}, eventConstructor=CustomEvent) {
		const decoratedInfo = Object.assign({}, this.baseTrackingData, this.activeTrackingData, detail.info);
		/* dispatch oErrors event */
		const oErrorDetail = Object.assign({}, detail, { info: decoratedInfo });
		document.body.dispatchEvent(new eventConstructor('oErrors.log', { detail: oErrorDetail, bubbles: true }));
		/* dispatch custom error event */
		const customErrorEvent = Object.assign({}, decoratedInfo, { error: detail.error }, { action: 'error' });
		SwgController.trackEvent(customErrorEvent);
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

	static fetch (url, options, _fetch=self.fetch) {
		const safeJson = (res) => {
			return res.text().then(text => {
				let json;
				try {
					json = JSON.parse(text);
				}
				catch (e) {
					json = {};
				}
				return json;
			});
		};

		return new Promise((resolve, reject) => {
			const defaults = {
				credentials: 'include',
				method: 'GET'
			};

			_fetch(url, Object.assign({}, defaults, options))
				.then(res => {
					if (res.status === 200 || res.status === 201) {
						safeJson(res).then(json => {
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

	static trackEvent (detail, eventConstructor=CustomEvent) {
		document.body.dispatchEvent(new eventConstructor('oTracking.event', { detail, bubbles: true }));
	}

	static signal (action, context={}, eventConstructor=CustomEvent) {
		document.body.dispatchEvent(new eventConstructor(`nSwg.${action}`, { detail: context, bubbles: true }));
	}

	static signalError (error, info={}) {
		SwgController.signal('onError', { error, info });
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
		if (domain && domain === 'ft.com') {
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

	static getContentUuidFromUrl () {
		const ARTICLE_UUID_QS = /ft-content-uuid=([^&]+)/;
		const ARTICLE_UUID_PATH = /content\/([^&?\/]+)/;
		const location = SwgController.getWindowLocation() || {};
		const lookup = (regexp, str) => str && (str.match(regexp) || [])[1];
		return lookup(ARTICLE_UUID_QS, location.search) || lookup(ARTICLE_UUID_PATH, location.href);
	}

	static redirectTo (url) {
		window.location.href = url;
	}

	static getWindowLocation () {
		return window.location;
	}

}

module.exports = SwgController;
