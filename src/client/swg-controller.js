const { swgReady, importClient, Overlay, _get, events, smartFetch, browser } = require('./utils');
const SubscribeButtons = require('./subscribe-button');

module.exports = class SwgController {
	/**
	 * @param {object} swgClient - as provided by SwG client
	 * @param {object} options
	 * @param {class} subscribeButtonConstructor
	 * @param {*} overlay
	 */
	constructor (swgClient, options={}, subscribeButtonConstructor=SubscribeButtons, overlay) {
		/* options */
		this.swgClient = swgClient;
		this.manualInitDomain = options.manualInitDomain;
		this.MAX_RETRIES = 2;
		this.M_SWG_SUB_SUCCESS_ENDPOINT = options.M_SWG_SUB_SUCCESS_ENDPOINT || (options.sandbox ? 'https://api-t.ft.com/commerce/v1/swg/subscriptions' : 'https://api.ft.com/commerce/v1/swg/subscriptions');
		this.M_SWG_ENTITLED_SUCCESS_ENDPOINT = options.M_SWG_ENTITLED_SUCCESS_ENDPOINT || (options.sandbox ? 'https://api-t.ft.com/commerce/v1/swg/subscriptions/entitlementsCheck' : 'https://api.ft.com/commerce/v1/swg/subscriptions/entitlementsCheck');
		this.POST_SUBSCRIBE_URL = options.POST_SUBSCRIBE_URL || 'https://www.ft.com/profile?splash=swg_checkout';
		this.NEW_SWG_SUB_COOKIE = 'FTSwgNewSubscriber';
		this.handlers = Object.assign({
			onEntitlementsResponse: this.onEntitlementsResponse.bind(this),
			onFlowCanceled: this.onFlowCanceled.bind(this),
			onFlowStarted: this.onFlowStarted.bind(this),
			onSubscribeResponse: this.onSubscribeResponse.bind(this),
			onLoginRequest: this.onLoginRequest.bind(this),
			onResolvedEntitlements: options.customOnwardJourney ? () => { } : this.defaultOnwardEntitledJourney.bind(this),
			onResolvedSubscribe: this.defaultOnwardSubscribedJourney.bind(this)
		}, options.handlers);

		/* bind handlers */
		const mount = (name, handler) => this.swgClient[name] && handler && this.swgClient[name](handler);
		mount('setOnEntitlementsResponse', this.handlers.onEntitlementsResponse);
		mount('setOnSubscribeResponse', this.handlers.onSubscribeResponse);
		mount('setOnLoginRequest', this.handlers.onLoginRequest);
		mount('setOnFlowCanceled', this.handlers.onFlowCanceled);
		mount('setOnFlowStarted', this.handlers.onFlowStarted);
		mount('setOnNativeSubscribeRequest', this.handlers.onNativeSubscribeRequest);

		/* setup */
		this.alreadyInitialised = false;
		this.overlay = overlay || new Overlay();
		this.baseTrackingData = SwgController.generateTrackingData(options);
		if (options.subscribeFromButton) {
			/* setup buttons */
			this.subscribeButtons = new subscribeButtonConstructor(swgClient, { SwgController });
		};
		this.activeTrackingData;

		/* symbols */
		this.ENTITLED_USER = 'entitled_user';
		this.NEW_USER = 'new_user';
	}

	/**
	 * Init SwG client if required. Add listeners. Handle entitlements check.
	 * Enable any subscribe with google buttons.
	 * @param {boolean} disableEntitlementsCheck - ignore initial entitlements result
	 * @returns {promise}
	 */
	init ({ disableEntitlementsCheck=false }={}) {
		return new Promise(resolve => {
			if (this.alreadyInitialised) resolve();

			/* bind own handlers */
			events.listen('track', this.track.bind(this));
			events.listen('onError', this.errorEventHandler.bind(this));
			const initialEntitlementsCheck = new Promise(resolve => events.listen('onInitialEntitlementsEvent', resolve));

			if (this.manualInitDomain) {
				this.swgClient.init(this.manualInitDomain);
				/**
				 * this.swgClient.start() should start entitlements check in manual
				 * mode but does not appear to be working. so...
				 * manually kick off check
				 */
				this.swgClient.getEntitlements();
			}

			this.alreadyInitialised = true;

			/* handle entitlements check invoked by Google on init */
			if (disableEntitlementsCheck) {
				/* no entitlements check, enable buttons */
				if (this.subscribeButtons) this.subscribeButtons.init();
				resolve();
			} else {
				/* handle entitlements check invoked by Google on init */
				initialEntitlementsCheck.then((res={}) => {
					if (res.granted && res.json) {
						/**
						 * User must have access via SwG, yet they are on
						 * a barrier, so prompt them to login and create an
						 * FT.com session for their SwG account */
						this.handlers.onResolvedEntitlements(res);
						resolve();
					} else if (res.hasEntitlements) {
						/* User has entitlements but not to requested content
						 * so barrier is relevant. Show a dismissible message
						 * to inform them that they have a SwG account, but
						 * upgrading is not supported.
						 * Do not enable SwG buttons */
						if (!browser.isProductSelector()) {
							this.overlay.show('<h3>You are trying to access Premium content</h3><p>The option to upgrade from Standard Digital to Premium Digital via Google is not available.</p><p>If you would like to discuss your subscription options, please contact Customer Services on +800 0705 6477</p>');
						}
						/* TODO
						 * - check if user has an active FT.com session?
						 * - we cannot confirm even if they do that they are logged into their SwG account.
						 * - prompt login if they do not ?
						 * - FUTURE (?) enable "upgrade" SwG buttons
						 * */
						resolve();
					} else {
						/* no entitlements, enable buttons */
						if (this.subscribeButtons) this.subscribeButtons.init();
						resolve();
					}
				});
			}
		});
	}

	/**
	 * Manually check a users Google / SwG entitlments
	 * @returns {promise} - resolves with decorated SwG.getEntitlements response
	 */
	checkEntitlements () {
		return this.swgClient.getEntitlements().then(SwgController.handleEntitlementsCallback);
	}

	/**
	 * Upon SwG subscription response. Resolve the user and set onward journey.
	 * @param {promise} subPromise - as returned by SwG
	 */
	onSubscribeResponse (subPromise) {
		return subPromise.then((response) => {
			/* disable any buttons */
			if (this.subscribeButtons) this.subscribeButtons.disableButtons();
			/* signal a return event to any listeners */
			events.signal('onSubscribeReturn', response);
			/* track success event */
			this.track({ action: 'success', context: {} });
			/* Drop a functional cookie so we can show the user the onward journey page. */
			this.setNewSwgSubscriberCookie();
			/* resolve user */
			return this.resolveUser(this.NEW_USER, response).then(res => {
				/* when user clicks SwG "continue" cta */
				response.complete().then(() => {
					/* track confirmation event */
					this.track({ action: 'google-confirmed', context: {
						// TODO subscriptionId: response.subscriptionId
					}});
					/* trigger onward journey */
					this.handlers.onResolvedSubscribe(res);
				});
			})
			.catch(err => {
				/**
				 * TODO: UX
				 * Could not resolve the user on our end after multiple retries.
				 * The Google modal will timeout and still show the confirmation
				 * modaul so we should still ensure there is an onward journey
				 */
				response.complete().then(() => {
					/* track failure event */
					this.track({ action: 'failure', context: {
						stage: 'user-resolution'
						// TODO subscriptionId: response.subscriptionId
					}});
					/* trigger onward journey */
					this.onwardSubscriptionErrorJourney();
				});
				return Promise.reject(err); // re-throw for tracking
			});
		}).catch(err => {
			/* signal error event to any listeners */
			events.signalError(err);
			/* track exit event */
			this.track({ action: 'exit', context: {
				errCode: _get(err, 'activityResult.code'),
				errData: _get(err, 'activityResult.data')
			}});
		});
	}

	onFlowStarted ({ flow, data }={}) {
		let skus = data && data.sku && [ data.sku ];
		const trackingData = { action: 'flowStarted', context: { flowName: flow, skus }, journeyStart: true };

		// For the sake of simplicity for the data/analytics team, map this to something they already know and use.
		if (flow === 'subscribe') {
			trackingData.action = 'landing';
		}

		this.track(trackingData);
	}

	onFlowCanceled ({ flow, data }={}) {
		let skus = data && data.sku && [ data.sku ];
		const trackingData = { action: 'flowCanceled', context: { flowName: flow, skus } };

		// For the sake of simplicity for the data/analytics team, map this to something they already know and use.
		if (flow === 'subscribe') {
			trackingData.action = 'exit';
		}

		this.track(trackingData);
	}

	/**
	 * @param {promise} entitlementsPromise - as returned by SwG
	 * note: according to the docs this should be invoked every time there is an
	 * entitlements check, but this does not seem to be the case.
	 */
	onEntitlementsResponse (entitlementsPromise) {
		return entitlementsPromise
			.then(SwgController.handleEntitlementsCallback)
			.then(formattedEntitlements => {
				/* signal event to listeners */
				events.signal('onInitialEntitlementsEvent', formattedEntitlements);
			})
			.catch(events.signalError);
	}

	/**
	 * Redirect to the login page
	 */
	onLoginRequest () {
		browser.redirectTo(browser.generateLoginUrl());
	}

	/**
	 * Resolve a user state. Either by creating an FT account or auto login.
	 * @param {string} scenario - the resolution scenario. new user || existing
	 * @param {object} swgResponse - the SwG response object with user data
	 */
	resolveUser (scenario, swgResponse, createSession=true, retries=0) {
		const newPurchaseFlow = scenario === this.NEW_USER;
		/* cors POST to relevant membership endpoint with SwG payload */
		const endpoint = newPurchaseFlow
			? this.M_SWG_SUB_SUCCESS_ENDPOINT
			: this.M_SWG_ENTITLED_SUCCESS_ENDPOINT;

		/* generate relevant payload */
		const payload = newPurchaseFlow
			? JSON.stringify(swgResponse)
			: JSON.stringify({ createSession, swg: swgResponse });

		return new Promise((resolve, reject) => {
			smartFetch.fetch(endpoint, {
				method: 'POST',
				credentials: 'include',
				headers: { 'content-type': 'application/json' },
				body: payload
			})
			.then(({ json }) => {
				const newlyCreated = _get(json, 'userInfo.newlyCreated');
				const hasNewSubCookie = document.cookie.indexOf(this.NEW_SWG_SUB_COOKIE) !== -1;

				/**
				 * Both subscription and entitlement callback endpoints return
				 *  a 200 with set-cookie headers for the resolved user session
				 *  and json about the new session.
				 * If the user has just been created OR we can still see the
				 *  NEW_SWG_SUB_COOKIE, then we still need to show them the
				 *  consent page. The cookie gets deleted there.
				 * Unless createSession was false we can assume user now has
				 *  active session cookies
				 */
				resolve({
					consentRequired: newlyCreated || hasNewSubCookie,
					loginRequired: !newPurchaseFlow && createSession === false,
					raw: json
				});
			})
			.catch((error) => {
				if (retries === this.MAX_RETRIES) {
					reject(error);
				} else {
					retries++;

					this.track({ action: 'retry', context: {
						stage: 'user-resolution',
						retries
					}});

					this.resolveUser(scenario, swgResponse, createSession, retries).then(resolve).catch(reject);
				}
			});
		});
	}

	/**
	 * User is entitled to content. Prompt them to allow us to log them.
	 * If we need to gather user consent, then go via the POST_SUBSCRIBE_URL
	 * @param {object} result - the result of the Google entitlements check
	 */
	getEntitledOnwardJourneyProps (result = {}) {
		const uuid = browser.getContentUuidFromUrl();
		const consentHref = this.POST_SUBSCRIBE_URL + (uuid ? '&ft-content-uuid=' + uuid : '');
		const contentHref = uuid ? `https://www.ft.com/content/${uuid}` : 'https://www.ft.com';
		const loginCta = {
			copy: 'Go to the FT login page',
			href: browser.generateLoginUrl()
		};

		const onLoginCtaClick = (ev) => {
			this.overlay.showActivity();
			ev.preventDefault();
			this.resolveUser(this.ENTITLED_USER, result.json)
				.then(({ consentRequired = false, loginRequired = false } = {}) => {
					/* set onward journey */
					if (loginRequired) {
						this.overlay.hideActivity();
						this.overlay.show('<h3>Sorry</h3><p>We couldn’t log you in automatically</p>', loginCta);
					} else if (consentRequired) {
						browser.redirectTo(consentHref);
					} else {
						browser.redirectTo(contentHref);
					}
				})
				.catch(err => {
					this.overlay.hideActivity();
					/* signal error */
					events.signalError(err);
					this.overlay.show('<h3>Sorry</h3><p>We couldn’t log you in automatically</p>', loginCta);
				});
		};

		const logMeInCta = {
			copy: 'Login and continue',
			href: loginCta.href, // fallback href
			callback: onLoginCtaClick
		};

		return logMeInCta;
	}

	defaultOnwardEntitledJourney (result = {}) {
		const logMeInCta = this.getEntitledOnwardJourneyProps(result);
		this.overlay.show('<h3>You\'ve got a subscription on FT.com</h3><p>It looks like you are already subscribed to FT.com via Google</p>', logMeInCta);
	}

	/**
	 * Redirect the new user to a follow up page (defaults to consent form)
	 * @param {boolean} opts.consentRequired - user must complete profile
	 */
	defaultOnwardSubscribedJourney ({ consentRequired=true }={}) {
		const uuid = browser.getContentUuidFromUrl();
		const contentHref = uuid ? `https://www.ft.com/content/${uuid}` : 'https://www.ft.com';
		const consentForm = this.POST_SUBSCRIBE_URL + (uuid ? '&ft-content-uuid=' + uuid : '');
		browser.redirectTo(consentRequired ? consentForm : contentHref);
	}

	/**
	 * Buy flow error onward journey
	 */
	onwardSubscriptionErrorJourney () {
		this.overlay.show('<h3>Sorry</h3><p>Something went wrong while creating your account on FT.com</p><p>Please call the FT customer services team on<br />+800 0705 6477</p>');
	};

	/**
	 * Track interactions. Keeps the state of active "flow" i.e offer choice.
	 * Decorates events with relevant extra data for conversion metrics.
	 * @param {string} action - name of the event action
	 * @param {object} context - extra detail about the event
	 * @param {boolean} journeyStart - will update activeTrackingData
	 */
	track ({ action, context={}, journeyStart=false }={}) {
		const offerData = SwgController.generateOfferDataFromSkus(context.skus);
		if (offerData && journeyStart) {
			/* if starting a new "flow" update the activeTrackingData state */
			this.activeTrackingData = offerData;
		}
		const decoratedEvent = Object.assign({}, this.baseTrackingData, this.activeTrackingData, context, { action });
		events.track(decoratedEvent);
	}

	/**
	 * Caught error handler. Report to oErrors and custom conversion metric
	 * @param {object} detail - caught event detail
	 * @param {class} eventConstructor - for mocking
	 */
	errorEventHandler (detail={}, eventConstructor=CustomEvent) {
		const decoratedInfo = Object.assign({}, this.baseTrackingData, this.activeTrackingData, detail.info);
		/* dispatch oErrors event */
		const oErrorDetail = Object.assign({}, detail, { info: decoratedInfo });
		document.body.dispatchEvent(new eventConstructor('oErrors.log', { detail: oErrorDetail, bubbles: true }));
		/* dispatch custom error event */
		const customErrorEvent = Object.assign({}, decoratedInfo, { error: detail.error }, { action: 'error' });
		events.track(customErrorEvent);
	}

	/**
	 * Load the third party SwG client library
	 * @param {boolean} manual - load swg client lib in manual mode
	 * @param {promise} swgPromise - for mocking
	 * @param {function} loadClient - for mocking
	 * @param {boolean} sandbox - load sandbox swg client lib, defaults to prod
	 * @returns {promise}
	 */
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

	static handleEntitlementsCallback (entitlements) {
		/* suppress Google "Manage Subscription toast" */
		entitlements.ack();
		return {
			granted: entitlements && entitlements.enablesThis && entitlements.enablesThis(),
			hasEntitlements: entitlements && entitlements.enablesAny && entitlements.enablesAny(),
			json: entitlements && entitlements.json && entitlements.json(),
			entitlements
		};
	}

	/**
	 * Generate basic tracking data
	 * @param {object} options
	 * @returns {object}
	 */
	static generateTrackingData (options={}) {
		return {
			category: 'SwG',
			formType: 'swg.signup',
			production: !options.sandbox,
			paymentMethod: 'SWG',
			system: { source: 'n-swg' }
		};
	}

	/**
	 * Will extract and format an offer data object from a sku id.
	 * Will only format if 1 sku id is passed in array.
	 * @param {array} skus - contains sku ids
	 * @returns {object}
	 */
	static generateOfferDataFromSkus (skus=[]) {
		if (skus.length !== 1) return {};
		/**
		 * skus SHOULD follow the format
		 * ft.com_OFFER.ID_TERM_NAME.TRIAL_DATE
		 * note: currently ft.com_OFFERID_TERM
		 * ie:
		 * ft.com_abcd38.efg89_p1m_premium.trial_31.05.18
		 * ft.com_abcd38.efg89_p1y_standard_31.05.18
		 */
		const strContainsVal = (s, v) => s && s.indexOf(v) !== -1;

		const [ domain, offerId, termCode, name ] = skus[0].toLowerCase().split('_');
		const isTrial = strContainsVal(name, 'trial');
		let term = termCode;
		switch (true) {
			case isTrial:
				term = 'trial';
				break;
			case strContainsVal(termCode, '1m'):
				term = 'monthly';
				break;
			case strContainsVal(termCode, '1y'):
				term = 'annual';
				break;
		}
		if (domain && domain === 'ft.com') {
			return {
				offerId: offerId && offerId.replace(/\./g, '-'),
				skuId: skus[0],
				productName: name && name.replace('.', ' '),
				term,
				productType: 'Digital',
				isTrial,
				isPremium: strContainsVal(name, 'premium')
			};
		} else {
			/* default to sku id */
			return {
				skuId: skus[0]
			};
		}
	}

	setNewSwgSubscriberCookie () {
		document.cookie = `${this.NEW_SWG_SUB_COOKIE}=true;Domain=ft.com`;
	}

};
