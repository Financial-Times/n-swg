import { swgReady, importClient, Overlay } from './utils';
import SubscribeButtons from './subscribe-button';
import _get from 'lodash.get';

const ARTICLE_UUID_QS = /ft-content-uuid=([^&]+)/;

class SwgController {

	constructor (swgClient, options={}, subscribeButtonConstructor=SubscribeButtons, overlay) {
		/* options */
		this.manualInitDomain = options.manualInitDomain;
		this.M_SWG_SUB_SUCCESS_ENDPOINT = options.M_SWG_SUB_SUCCESS_ENDPOINT || 'https://swg-fulfilment-svc-eu-test.memb.ft.com/subscriptions';

		this.alreadyInitialised = false;
		this.swgClient = swgClient;

		/* bind handlers */
		this.handlers = Object.assign({
			onSubscribeResponse: this.onSubscribeResponse,
			onEntitlementsResponse: this.onEntitlementsResponse
		}, options.handlers);
		this.swgClient.setOnSubscribeResponse(this.handlers.onSubscribeResponse.bind(this));
		this.swgClient.setOnEntitlementsResponse(this.handlers.onEntitlementsResponse.bind(this));

		if (options.subscribeFromButton) {
			/* setup buttons */
			this.subscribeButtons = new subscribeButtonConstructor(swgClient, { SwgController });
		};

		this.overlay = overlay || new Overlay();
		this.ENTITLED_SUCCESS = 'ENTITLEMENTS_GRANT_SUCCESS';
	}

	init () {
		if (this.alreadyInitialised) return;

		if (this.manualInitDomain) {
			this.swgClient.init(this.manualInitDomain);
		}

		this.alreadyInitialised = true;

		/* check user entitlements */
		this.checkEntitlements().then((res={}) => {
			if (res.granted) {
				this.showOverlay(this.ENTITLED_SUCCESS);
				/* NOTE: below chain will be broken until membership endpoint ready */
				this.resolveUser(res.entitlements)
					.then(this.onwardEntitledJourney)
					.catch(this.signalError);
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
			SwgController.trackEvent('success', {});
			/* resolve user */
			this.resolveUser(response).then((res) => {
				response.complete().then(() => {
					this.onwardSubscribedJourney(res);
				});
			});
		}).catch((err) => {
			/* signal error event to any listeners */
			this.signalError(err);
			/* track exit event */
			SwgController.trackEvent('exit', {
				errCode: _get(err, 'activityResult.code'),
				errData: _get(err, 'activityResult.data')
			});
		});
	}

	onEntitlementsResponse (entitlementsPromise) {
		entitlementsPromise.then((entitlements) => {
			SwgController.signal('entitlementsResponse', entitlements);
		}).catch(this.signalError);
	}

	// Putting this in its own function to help with testing
	redirectTo (url) {
		window.location.href = url;
	}

	// Putting this in its own function to help with testing
	getQueryStringParams () {
		return window.location.search;
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

	onwardJourney () {
		const qs = this.getQueryStringParams();

		// If this is a page like a barrier, we want to redirect to the article the user was trying to access.
		if (ARTICLE_UUID_QS.test(qs)) {
			this.redirectTo(`https://www.ft.com/content/${qs.match(ARTICLE_UUID_QS)[1]}`);
		}
	}

	onwardEntitledJourney () {
		// console.log('FT.COM ONWARD ENTITLED', JSON.stringify(o, null, 2));
		this.onwardJourney();
	}

	onwardSubscribedJourney () {
		// console.log('FT.COM ONWARD SUBSCRIBED', JSON.stringify(o, null, 2));
		/* track confirmation event */
		SwgController.trackEvent('confirmation', {});
		this.onwardJourney();
	}

	signalError (err) {
		SwgController.signal('onError', err);
	}

	showOverlay (id) {
		/* NOTE: temporary usage for testing */
		if (id === this.ENTITLED_SUCCESS) {
			this.overlay.show(`<p>It looks like you already have an FT.com subscription with Google.<br /><a href="https://www.ft.com/login?location=${encodeURIComponent(window.location.href)}">Login</a><br /><br /><small>code: ${id}</small></p>`);
		}
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
		SwgController.listen('onSubscribeReturn', listener);
	}

	static onError (listener) {
		SwgController.listen('onError', listener);
	}

}

module.exports = SwgController;
