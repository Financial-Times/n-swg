const { expect } = require('chai');
const sinon = require('sinon');

const { JSDOM } = require('../mocks/document');
const SwgClient = require('../mocks/swg-client');
const SwgController = require('../../../src/client/swg-controller');
const SwgSubscribeButtons = require('../../../src/client/subscribe-button/index');
const utils = require('../../../src/client/utils');

describe('Swg Controller: class', function () {
	let swgClient;
	let sandbox;

	beforeEach(() => {
		const jsdom = new JSDOM();
		sandbox = sinon.sandbox.create();
		global.CustomEvent = jsdom.window.CustomEvent;
		global.document = jsdom.window.document;
		global.window = jsdom.window;
		swgClient = new SwgClient();
	});

	afterEach(() => {
		delete global.CustomEvent;
		delete global.document;
		delete global.window;
		sandbox.restore();
	});

	it('exports a class', function () {
		expect(SwgController).to.be.a('Function');
		expect(SwgController).to.deep.equal(SwgController);
	});

	describe('.constructor()', function () {

		it('has default properties', function () {
			const subject = new SwgController(swgClient);
			expect(subject.manualInitDomain).to.be.undefined;
			expect(subject.alreadyInitialised).to.be.false;
			expect(subject.handlers.onFlowCanceled).to.be.a('Function');
			expect(subject.handlers.onFlowStarted).to.be.a('Function');
			expect(subject.handlers.onSubscribeResponse).to.be.a('Function');
			expect(subject.handlers.onEntitlementsResponse).to.be.a('Function');
			expect(subject.swgClient).to.deep.equal(swgClient);
			expect(subject.overlay).to.be.an.instanceOf(utils.Overlay);
			expect(subject.M_SWG_SUB_SUCCESS_ENDPOINT).to.equal('https://api.ft.com/commerce/v1/swg/subscriptions');
			expect(subject.M_SWG_ENTITLED_SUCCESS_ENDPOINT).to.equal('https://swg-fulfilment-svc-eu-prod.memb.ft.com/swg/v1/subscriptions/entitlementsCheck');
			expect(subject.POST_SUBSCRIBE_URL).to.equal('https://www.ft.com/profile?splash=swg_checkout');
		});

		it('accepts custom options', function () {
			const OPTIONS = {
				manualInitDomain: 'ft.com',
				handlers: {
					setOnFlowCanceled: () => 'canceled stub',
					setOnFlowStarted: () => 'started stub',
					onSubscribeResponse: () => 'stub',
					onSomeOtherThing: () => 'stub again'
				},
				M_SWG_SUB_SUCCESS_ENDPOINT: '/success',
				subscribeFromButton: true
			};
			const subject = new SwgController(swgClient, OPTIONS);
			expect(subject.manualInitDomain).to.equal(OPTIONS.manualInitDomain);
			expect(subject.handlers.setOnFlowCanceled).to.equal(OPTIONS.handlers.setOnFlowCanceled);
			expect(subject.handlers.setOnFlowStarted).to.equal(OPTIONS.handlers.setOnFlowStarted);
			expect(subject.handlers.onSubscribeResponse).to.equal(OPTIONS.handlers.onSubscribeResponse);
			expect(subject.handlers.setOnEntitlementsResponse).to.equal(OPTIONS.handlers.setOnEntitlementsResponse);
			expect(subject.handlers.onSomeOtherThing).to.equal(OPTIONS.handlers.onSomeOtherThing);
			expect(subject.swgClient).to.deep.equal(swgClient);
			expect(subject.M_SWG_SUB_SUCCESS_ENDPOINT).to.equal(OPTIONS.M_SWG_SUB_SUCCESS_ENDPOINT);
			expect(subject.subscribeButtons).to.be.an.instanceOf(SwgSubscribeButtons);
		});

		it('binds event handlers', function () {
			sandbox.stub(swgClient, 'setOnSubscribeResponse');
			sandbox.stub(swgClient, 'setOnEntitlementsResponse');

			const subject = new SwgController(swgClient);
			expect(swgClient.setOnSubscribeResponse.calledOnce).to.be.true;
			expect(swgClient.setOnEntitlementsResponse.calledOnce).to.be.true;
			expect(subject.swgClient).to.deep.equal(swgClient);
	});

	});

	describe('.init()', function () {

		beforeEach(() => {
			sandbox.stub(swgClient, 'init');
			sandbox.stub(swgClient, 'setOnSubscribeResponse');
		});

		it('does not setup swgClient if .alreadyInitialised', function () {
			const subject = new SwgController(swgClient);
			subject.alreadyInitialised = true;
			subject.init();
			expect(swgClient.init.notCalled).to.be.true;
		});

		it('will setup swgClient if not alreadyInitialised', function () {
			const subject = new SwgController(swgClient);
			subject.init();
			expect(subject.alreadyInitialised).to.be.true;
		});

		it('will swgClient.init() if manualInitDomain', function () {
			const DOMAIN = 'ft.com';
			const subject = new SwgController(swgClient, { manualInitDomain: DOMAIN });
			subject.init();
			expect(swgClient.init.calledOnce).to.be.true;
			expect(swgClient.init.getCall(0).args[0]).to.equal(DOMAIN);
			expect(subject.alreadyInitialised).to.be.true;
		});

		it('will check entitlements by default', function () {
			const subject = new SwgController(swgClient);
			sandbox.stub(subject, 'checkEntitlements').resolves();
			subject.init();
			expect(subject.checkEntitlements.calledOnce).to.be.true;
		});

		it('will not check entitlements if passed option', function () {
			const subject = new SwgController(swgClient);
			sandbox.stub(subject, 'checkEntitlements').resolves();
			subject.init({ disableEntitlementsCheck: true });
			expect(subject.checkEntitlements.calledOnce).to.be.false;
		});

		context('and on checkEntitlements response', function () {

			it('if not granted access and .subscribeButtons will init subscribe buttons', function () {
				const buttonInitStub = sandbox.stub();
				const mockButtonConstructor = () => ({ init: buttonInitStub });
				const subject = new SwgController(swgClient, { subscribeFromButton: true }, mockButtonConstructor);
				const checkEntitlementsPromise = Promise.resolve({ granted: false });

				sandbox.stub(subject, 'checkEntitlements').resolves(checkEntitlementsPromise);

				subject.init();
				return checkEntitlementsPromise.then(() => {
					expect(buttonInitStub.calledOnce).to.be.true;
				});
			});

			it('if granted access will showOverlay, resolve user and call handlers.onResolvedEntitlements(!promptLogin)', function () {
				const subject = new SwgController(swgClient);
				const checkEntitlementsPromise = Promise.resolve({ granted: true });
				const resolveUserPromise = Promise.resolve();

				sandbox.stub(subject, 'checkEntitlements').returns(checkEntitlementsPromise);
				sandbox.stub(subject, 'resolveUser').returns(resolveUserPromise);
				sandbox.stub(subject.handlers, 'onResolvedEntitlements');

				subject.init();
				return checkEntitlementsPromise.then(() => {
					resolveUserPromise.then(() => {
						expect(subject.handlers.onResolvedEntitlements.calledWith(sinon.match({ promptLogin: false }))).to.be.true;
					});
				});
			});

			it('if granted access but resolve user errors, signal error and call defaultOnwardEntitledJourney(promptLogin)', function () {
				const subject = new SwgController(swgClient);
				const checkEntitlementsPromise = Promise.resolve({ granted: true });
				const resolveUserPromise = Promise.reject(new Error('what!'));

				sandbox.stub(subject, 'checkEntitlements').returns(checkEntitlementsPromise);
				sandbox.stub(subject, 'resolveUser').returns(resolveUserPromise);
				sandbox.stub(utils.events, 'signalError');
				sandbox.stub(subject.handlers, 'onResolvedEntitlements');

				subject.init();
				return checkEntitlementsPromise.then(() => {
					resolveUserPromise
					.catch(() => {
						/* slight hack to force the following block to be
						executed after the actual promise rejection and handling */
						return;
					})
					.then(() => {
						expect(utils.events.signalError.calledOnce).to.be.true;
						expect(subject.handlers.onResolvedEntitlements.calledWith(sinon.match({ promptLogin: true }))).to.be.true;
					});
				});
			});

		});

	});

	describe('.onSubscribeResponse() handler', function () {
		let subject;

		beforeEach(() => {
			subject = new SwgController(swgClient, { subscribeFromButton: true });
			sandbox.stub(utils.events, 'signal');
			sandbox.stub(utils.events, 'track');
			sandbox.stub(utils.browser, 'redirectTo');
		});

		it('on subPromise success: disable buttons, signal return, track success, resolve user -> handlers.onResolvedSubscribe()', function () {
			const mockResponseComplete = Promise.resolve();
			const MOCK_RESULT = { mock: 'swg-result', complete: () => mockResponseComplete };
			const subPromise = Promise.resolve(MOCK_RESULT);
			const resolveUserPromise = Promise.resolve();

			sandbox.stub(subject, 'resolveUser').returns(resolveUserPromise);
			sandbox.stub(subject.subscribeButtons, 'disableButtons');
			sinon.spy(subject.handlers, 'onResolvedSubscribe');

			subject.onSubscribeResponse(subPromise);
			return subPromise.then(() => {
				expect(subject.subscribeButtons.disableButtons.calledOnce).to.be.true;
				expect(utils.events.signal.calledWith('onSubscribeReturn', MOCK_RESULT)).to.be.true;
				expect(utils.events.track.calledOnce).to.be.true;
				expect(utils.events.track.calledWith(sinon.match({ action: 'success' }))).to.be.true;

				return resolveUserPromise.then(() => {
					expect(subject.resolveUser.calledWith(subject.NEW_USER, MOCK_RESULT)).to.be.true;
					mockResponseComplete.then(() => {
						expect(utils.events.track.calledTwice).to.be.true;
						expect(subject.handlers.onResolvedSubscribe.calledOnce).to.be.true;
						expect(utils.events.track.calledWith(sinon.match({ action: 'confirmation' }))).to.be.true;
					});
				});
			});
		});

		it('on subPromise error: signal error, track event', function () {
			const MOCK_ERROR = new Error('mock error');
			MOCK_ERROR.activityResult = {
				code: '1234',
				data: 'error data'
			};
			const subPromise = Promise.reject(MOCK_ERROR);

			subject.onSubscribeResponse(subPromise);
			return subPromise
				.then(() => {
					/* slight hack to force the following catch block to be
					registered after the genuine catch block in the
					onSubscribeResponse > subPromise */
					return;
				})
				.catch(() => {
					expect(utils.events.signal.calledWith('onError', { error: MOCK_ERROR, info: {} }), 'signalError called').to.be.true;
					expect(utils.events.track.calledOnce, 'trackEvent calledOnce').to.be.true;
					expect(utils.events.track.calledWith(sinon.match({
						action: 'exit',
						errCode: MOCK_ERROR.activityResult.code,
						errData: MOCK_ERROR.activityResult.data
					})), 'track exit called').to.be.true;
				});
		});

	});

	describe('.resolveUser()', function () {
		let subject;
		let fetchStub;
		const MOCK_M_SWG_SUB_SUCCESS_ENDPOINT = 'https://www.ft.com/success';
		const MOCK_M_SWG_ENTITLED_SUCCESS_ENDPOINT = 'https://www.ft.com/entitlements';

		beforeEach(() => {
			fetchStub = sandbox.stub(utils.smartFetch, 'fetch');
			subject = new SwgController(swgClient, {
				M_SWG_SUB_SUCCESS_ENDPOINT: MOCK_M_SWG_SUB_SUCCESS_ENDPOINT,
				M_SWG_ENTITLED_SUCCESS_ENDPOINT: MOCK_M_SWG_ENTITLED_SUCCESS_ENDPOINT
			});
		});

		it('is a function', function () {
			expect(subject.resolveUser).to.be.a('Function');
		});

		it('returns a promise', function () {
			fetchStub.resolves({ json: {}});
			expect(subject.resolveUser()).to.be.a('Promise');
		});

		it('correctly formats default (ENTITLEMENTS) request from passed options', function () {
			const MOCK_SWG_RESPONSE = { swgToken: '123' };
			const expectedBody = JSON.stringify({ createSession: true, swg: MOCK_SWG_RESPONSE });
			fetchStub.resolves({ json: {}});
			subject.resolveUser(subject.ENTITLED_USER, MOCK_SWG_RESPONSE);
			expect(fetchStub.calledWith(MOCK_M_SWG_ENTITLED_SUCCESS_ENDPOINT, {
				method: 'POST',
				body: expectedBody,
				credentials: 'include',
				headers: {
					'content-type': 'application/json'
				}
			})).to.be.true;
		});

		it('scenario=ENTITLED_USER correctly formats (ENTITLED USER) and handles request from passed options', function () {
			const MOCK_SWG_RESPONSE = { swgToken: '123' };
			const expectedBody = JSON.stringify({ createSession: false, swg: MOCK_SWG_RESPONSE });
			const MOCK_RESULT = { userInfo: { newlyCreated: false } };
			fetchStub.resolves({ json: MOCK_RESULT });

			return subject.resolveUser(subject.ENTITLED_USER, MOCK_SWG_RESPONSE, false).then(result => {
				expect(result).to.deep.equal({
					loginRequired: true,
					consentRequired: false,
					raw: MOCK_RESULT
				});
				expect(fetchStub.calledWith(MOCK_M_SWG_ENTITLED_SUCCESS_ENDPOINT, {
					method: 'POST',
					body: expectedBody,
					credentials: 'include',
					headers: {
						'content-type': 'application/json'
					}
				})).to.be.true;
			});
		});

		it('scenario=NEW_USER correctly formats (NEW USER) and handles request from passed options', function () {
			const MOCK_SWG_RESPONSE = { swgToken: '123' };
			const expectedBody = JSON.stringify(MOCK_SWG_RESPONSE);
			const MOCK_RESULT = { userInfo: { newlyCreated: true } };
			fetchStub.resolves({ json: MOCK_RESULT });

			return subject.resolveUser(subject.NEW_USER, MOCK_SWG_RESPONSE).then(result => {
				expect(result).to.deep.equal({
					loginRequired: false,
					consentRequired: true,
					raw: MOCK_RESULT
				});
				expect(fetchStub.calledWith(MOCK_M_SWG_SUB_SUCCESS_ENDPOINT, {
					method: 'POST',
					body: expectedBody,
					credentials: 'include',
					headers: {
						'content-type': 'application/json'
					}
				})).to.be.true;
			});
		});

		it('extracts and resolves with json on fetch response', function () {
			const MOCK_RESULT = { end: 'result' };
			fetchStub.resolves({ json: MOCK_RESULT });
			return subject.resolveUser().then(result => {
				expect(result).to.deep.equal({ consentRequired: undefined, loginRequired: false, raw: MOCK_RESULT });
			});
		});

		it('correctly formats result json and consentRequired boolean', function () {
			const MOCK_RESULT = { userInfo: { newlyCreated: true } };
			fetchStub.resolves({ json: MOCK_RESULT });
			return subject.resolveUser().then(result => {
				expect(result).to.deep.equal({ loginRequired: false, consentRequired: true, raw: MOCK_RESULT });
			});
		});

		it('correctly formats result json and loginRequired boolean', function () {
			const MOCK_RESULT = { userInfo: { newlyCreated: true } };
			fetchStub.resolves({ json: MOCK_RESULT });
			return subject.resolveUser(null, {}, false).then(result => {
				expect(result).to.deep.equal({ loginRequired: true, consentRequired: true, raw: MOCK_RESULT });
			});
		});

		it('rejects with error on fetch error', function () {
			const MOCK_ERROR = new Error('Bad response!');
			fetchStub.throws(MOCK_ERROR);
			return subject.resolveUser().catch(err => {
				expect(err).to.deep.equal(MOCK_ERROR);
			});
		});

	});

	describe('.checkEntitlements()', function () {
		let subject;

		beforeEach(() => {
			subject = new SwgController(swgClient);
		});

		afterEach(() => {
			subject = null;
		});

		it('is a function', function () {
			expect(subject.resolveUser).to.be.a('Function');
		});

		it('returns a promise', function () {
			expect(subject.checkEntitlements()).to.be.a('Promise');
		});

		it('resolves with formatted \"entitlementsResponse\" event and calls swgClient.getEntitlements()', function (done) {
			const MOCK_JSON_FUNC_RESULT = { other: 'data' };
			const MOCK_RESULT = { enablesThis: () => true, enablesAny: () => true, other: 'data', json: () => MOCK_JSON_FUNC_RESULT };
			sandbox.stub(swgClient, 'getEntitlements');

			subject.checkEntitlements().then(res => {
				expect(res.granted).to.be.true;
				expect(res.hasEntitlements).to.be.true;
				expect(res.json).to.deep.equal(MOCK_JSON_FUNC_RESULT);
				expect(res.entitlements).to.equal(MOCK_RESULT);
				expect(swgClient.getEntitlements.calledOnce).to.true;
				done();
			})
			.catch(done);

			utils.events.signal('entitlementsResponse', MOCK_RESULT);
		});

		it('resolves with formatted \"entitlementsResponse\" where access is not granted', function () {
			const MOCK_RESULT = { enablesThis: () => false, enablesAny: () => false, other: 'data' };
			sandbox.stub(swgClient, 'getEntitlements');

			subject.checkEntitlements().then(res => {
				expect(res.granted).to.be.false;
				expect(res.hasEntitlements).to.be.false;
				expect(res.entitlements).to.equal(MOCK_RESULT);
				expect(swgClient.getEntitlements.calledOnce).to.true;
			});

			utils.events.signal('entitlementsResponse', MOCK_RESULT);
		});

	});

	describe('.onFlowCanceled()', function () {
		let subject;

		beforeEach(() => {
			subject = new SwgController(swgClient);
		});

		afterEach(() => {
			subject = null;
		});

		it('signal and track appropriately on flowCanceled', function () {
			sandbox.stub(utils.events, 'signal');
			sandbox.stub(subject, 'track');

			subject.onFlowCanceled('someFlow', { sku: 'foo' });
			expect(subject.track.calledWith({ action: 'flowCanceled.someFlow', context: { flowName: 'someFlow', skus: ['foo'] } })).to.be.true;
		});

	});

	describe('.onFlowStarted()', function () {
		let subject;

		beforeEach(() => {
			subject = new SwgController(swgClient);
		});

		afterEach(() => {
			subject = null;
		});

		it('signal and track appropriately on flowStarted', function () {
			sandbox.stub(utils.events, 'signal');
			sandbox.stub(subject, 'track');

			subject.onFlowStarted('someFlow', { sku: 'foo' });
			expect(subject.track.calledWith({ action: 'flowStarted.someFlow', context: { flowName: 'someFlow', skus: ['foo'] }, journeyStart: true })).to.be.true;
		});

	});

	describe('.onEntitlementsResponse()', function () {
		let subject;

		beforeEach(() => {
			subject = new SwgController(swgClient);
		});

		it('signal \"entitlementsResponse\" event on entitlementsPromise', function () {
			sandbox.stub(utils.events, 'signal');
			const MOCK_RESULT = { entitlments: 'object', ack: () => true };
			const mockEntitlementsPromise = Promise.resolve(MOCK_RESULT);

			subject.onEntitlementsResponse(mockEntitlementsPromise);
			return mockEntitlementsPromise.then(() => {
				expect(utils.events.signal.calledWith('entitlementsResponse', MOCK_RESULT)).to.be.true;
			});
		});

		it('suppress Google message with .ack()', function () {
			const MOCK_RESULT = { entitlments: 'object', ack: sandbox.stub() };
			const mockEntitlementsPromise = Promise.resolve(MOCK_RESULT);

			subject.onEntitlementsResponse(mockEntitlementsPromise);
			return mockEntitlementsPromise.then(() => {
				expect(MOCK_RESULT.ack.calledOnce).to.be.true;
			});
		});

		it('signal \"Error\" event on entitlementsPromise', function () {
			sandbox.stub(utils.events, 'signalError');
			const MOCK_ERROR = new Error('mock');
			const mockEntitlementsPromise = Promise.reject(MOCK_ERROR);

			subject.onEntitlementsResponse(mockEntitlementsPromise);
			return mockEntitlementsPromise.then(() => true).catch(() => {
					expect(utils.events.signalError.calledWith(MOCK_ERROR)).to.be.true;
				});
		});

	});

	describe('.track()', function () {
		let subject;
		let trackEventStub;

		beforeEach(() => {
			subject = new SwgController(swgClient);
			trackEventStub = sandbox.stub(utils.events, 'track');
		});

		afterEach(() => {
			subject = null;
		});

		it('can be invoked via a \"track\" signalled event', function () {
			sandbox.stub(subject, 'track');
			subject.init();
			utils.events.signal('track', { action: 'foo'} );
			expect(subject.track.calledOnce).to.be.true;
		});

		it('decorate basic events', function () {
			const RESULT = {
				category: 'SwG',
				formType: 'signup:swg',
				production: true,
				paymentMethod: 'SWG',
				system: { source: 'n-swg' },
				action: 'foo'
			};
			subject.init();
			subject.track({ action: 'foo' });
			expect(trackEventStub.calledWith(RESULT)).to.be.true;
		});

		it('decorate with offer data if journeyStart=true and update activeTrackingData', function () {
			const context = { skus: ['ft.com_abcd38.efg89_p1m_premium.trial_31.05.18'] };
			const RESULT = {
				category: 'SwG',
				formType: 'signup:swg',
				production: true,
				paymentMethod: 'SWG',
				system: { source: 'n-swg' },
				offerId: 'abcd38-efg89',
				skuId: 'ft.com_abcd38.efg89_p1m_premium.trial_31.05.18',
				productName: 'premium trial',
				term: 'p1m',
				productType: 'Digital',
				isTrial: true,
				isPremium: true,
				skus: [ 'ft.com_abcd38.efg89_p1m_premium.trial_31.05.18' ],
				action: 'foo'
			};
			subject.init();
			subject.track({ action: 'foo', context, journeyStart: true });
			expect(trackEventStub.calledWith(RESULT)).to.be.true;
			expect(RESULT).to.contain(subject.activeTrackingData);
		});

		it('do not decorate with offer data if journeyStart=false', function () {
			const context = { skus: ['ft.com_abcd38.efg89_p1m_premium.trial_31.05.18'] };
			const RESULT = {
				category: 'SwG',
				formType: 'signup:swg',
				production: true,
				paymentMethod: 'SWG',
				system: { source: 'n-swg' },
				action: 'foo',
				skus: context.skus
			};
			subject.init();
			subject.track({ action: 'foo', context, journeyStart: false });
			expect(trackEventStub.calledWith(RESULT)).to.be.true;
			expect(subject.activeTrackingData).to.be.undefined;
		});

		it('do not decorate with offer data if journeyStart=true but mutiple skus', function () {
			const context = { skus: ['ft.com_abcd38.efg89_p1m_premium.trial_31.05.18', 'ft.com_abcd38.efg89_p1m_standard.trial_31.05.18'] };
			const RESULT = {
				category: 'SwG',
				formType: 'signup:swg',
				production: true,
				paymentMethod: 'SWG',
				system: { source: 'n-swg' },
				action: 'foo',
				skus: context.skus
			};
			subject.init();
			subject.track({ action: 'foo', context, journeyStart: true });
			expect(trackEventStub.calledWith(RESULT)).to.be.true;
			expect(subject.activeTrackingData).to.be.an('object');
			expect(subject.activeTrackingData).to.be.empty;
		});

		it('decorates with activeTrackingData', function () {
			const mockActiveData = { foo: 'bar' };
			subject.init();
			subject.activeTrackingData = mockActiveData;
			subject.track({ action: 'foo' });
			const RESULT = {
				action: 'foo',
				foo: 'bar'
			};
			expect(trackEventStub.calledWith(sinon.match(RESULT))).to.be.true;
		});

		context('activeTrackingData state', function () {

			it('starts undefined', function () {
				expect(subject.activeTrackingData).to.be.undefined;
				subject.init();
				expect(subject.activeTrackingData).to.be.undefined;
			});

			it('updates to offerdata if journeyStart', function () {
				subject.init();
				const context = { skus: ['ft.com_abcd38.efg89_p1m_premium.trial_31.05.18'] };
				subject.track({ action: 'foo', context, journeyStart: true });
				expect(subject.activeTrackingData).to.contain({ skuId: context.skus[0] });
			});

			it('maintains state for subsequent events', function () {
				subject.init();
				const context = { skus: ['ft.com_abcd38.efg89_p1m_premium.trial_31.05.18'] };			subject.track({ action: 'foo', context, journeyStart: true });
				expect(subject.activeTrackingData).to.contain({ skuId: context.skus[0] });
				subject.track({ action: 'foo' });
				expect(subject.activeTrackingData).to.contain({ skuId: context.skus[0] });
				expect(trackEventStub.calledWith(sinon.match({ skuId: context.skus[0] }))).to.be.true;
			});

			it('updates offerdata if a new journeyStart event', function () {
				subject.init();
				const context1 = { skus: ['ft.com_abcd38.efg89_p1m_premium.trial_31.05.18'] };
				const context2 = { skus: ['ft.com_abcd38.efg89_p1m_premium.trial_31.05.18', 'ft.com_abcd38.efg89_p1m_standard.trial_31.05.18'] };			subject.track({ action: 'foo', context: context1, journeyStart: true });
				expect(subject.activeTrackingData).to.contain({ skuId: context1.skus[0] });
				subject.track({ action: 'foo', context: context2, journeyStart: true });
				expect(subject.activeTrackingData).to.be.empty;
			});

		});

	});

	describe('.errorEventHandler()', function () {
		let subject;
		let dispatchEventStub;
		let mockData;

		beforeEach(() => {
			mockData = {
				base: { basic: 'data' },
				active: { active: 'data' }
			};
			subject = new SwgController(swgClient);
			subject.init();
			subject.baseTrackingData = mockData.base;
			subject.activeTrackingData = mockData.active;
			dispatchEventStub = sandbox.stub(global.document.body, 'dispatchEvent');
		});

		afterEach(() => {
			subject = null;
			mockData = null;
		});

		it('dispatches both \"oErrors.log\" and \"oTracking.event\" events to the body', function () {
			const EVENT = {
				error: new Error('bad'),
				info: { some: 'additional data' }
			};
			subject.errorEventHandler(EVENT);
			const result = getEvents(dispatchEventStub);
			expect(result['oTracking.event'].type).to.equal('oTracking.event');
			expect(result['oErrors.log'].type).to.equal('oErrors.log');
		});

		it('decorates event.info in \"oErrors.log\" event', function () {
			const EVENT = {
				error: new Error('bad'),
				info: { some: 'additional data' }
			};
			subject.errorEventHandler(EVENT);
			const result = getEvents(dispatchEventStub)['oErrors.log'];
			expect(result.type).to.equal('oErrors.log');
			expect(result.detail.info).to.contain(mockData.base);
			expect(result.detail.info).to.contain(mockData.active);
			expect(result.detail.info).to.contain(EVENT.info);
			expect(result.detail.error).to.equal(EVENT.error);
		});

		it('decorates and flattens event data and adds action: error in \"oTracking.event\" event', function () {
			const EVENT = {
				error: new Error('bad'),
				info: { some: 'additional data' }
			};
			subject.errorEventHandler(EVENT);
			const result = getEvents(dispatchEventStub)['oTracking.event'];
			expect(result.type).to.equal('oTracking.event');
			expect(result.detail).to.contain(mockData.base);
			expect(result.detail).to.contain(mockData.active);
			expect(result.detail).to.contain(EVENT.info);
			expect(result.detail.error).to.equal(EVENT.error);
			expect(result.detail.action).to.equal('error');
		});

		function getEvents (stub) {
			const deconstruct = (ev) => ({ type: ev.type, detail: ev.detail });
			return {
				'oErrors.log': deconstruct(stub.getCall(0).args[0]),
				'oTracking.event': deconstruct(stub.getCall(1).args[0])
			};
		}

	});

	context('Onward journeys', function () {
		let subject;
		let overlayStub;
		let redirectStub;
		let windowLocation;

		function setHref (href) {
			windowLocation.href = href;
			windowLocation.search = href.split('?')[1];
		}

		beforeEach(() => {
			windowLocation = { search: '', href: '' };
			subject = new SwgController(swgClient);
			subject.init();
			redirectStub = sandbox.stub(utils.browser, 'redirectTo');
			overlayStub = sandbox.stub(subject.overlay, 'show');
			sandbox.stub(utils.browser, 'getWindowLocation').returns(windowLocation);
		});

		afterEach(() => {
			windowLocation = null;
		});

		describe('.defaultOnwardEntitledJourney()', function () {

			context('promptLogin=true', function () {
				it('show overlay will have link that defaults to login page', function () {
					subject.defaultOnwardEntitledJourney({ promptLogin: true });
					expect(overlayStub.calledWith(sinon.match('https://www.ft.com/login?socialEnabled=true'))).to.be.true;
					expect(overlayStub.calledWith(sinon.match('ENTITLED_LOGIN_REQUIRED'))).to.be.true;
				});

				it('show overlay will have login link with requested content url as location', function () {
				setHref('https://www.ft.com/barrier/trial?ft-content-uuid=12345&foo=bar');
					subject.defaultOnwardEntitledJourney({ promptLogin: true });
					expect(overlayStub.calledWith(sinon.match('https://www.ft.com/login?socialEnabled=true&location=https%3A%2F%2Fwww.ft.com%2Fcontent%2F12345'))).to.be.true;
					expect(overlayStub.calledWith(sinon.match('ENTITLED_LOGIN_REQUIRED'))).to.be.true;
				});
			});

			context('promptLogin=false', function () {
				it('show overlay with link to requested content if ft-content-uuid present', function () {
					setHref('https://www.ft.com/barrier/trial?ft-content-uuid=12345&foo=bar');
					subject.defaultOnwardEntitledJourney({ promptLogin: false });
					expect(overlayStub.calledWith(sinon.match('https://www.ft.com/content/12345'))).to.be.true;
					expect(overlayStub.calledWith(sinon.match('ENTITLED_LOGIN_SUCCESS'))).to.be.true;
				});

				it('show overlay with link to content if on a content page', function () {
					setHref('https://www.ft.com/content/12345?foo=bar');
					subject.defaultOnwardEntitledJourney({ promptLogin: false });
					expect(overlayStub.calledWith(sinon.match('https://www.ft.com/content/12345'))).to.be.true;
					expect(overlayStub.calledWith(sinon.match('ENTITLED_LOGIN_SUCCESS'))).to.be.true;
				});

				it('show overlay with link to homepage if not on a content page', function () {
					setHref('https://www.ft.com/products');
					subject.defaultOnwardEntitledJourney({ promptLogin: false });
					expect(overlayStub.calledWith(sinon.match('https://www.ft.com'))).to.be.true;
					expect(overlayStub.calledWith(sinon.match('ENTITLED_LOGIN_SUCCESS'))).to.be.true;
				});

				describe('consentRequired=true', function () {

					it('show overlay with link to consent page (\/profile)', function () {
						subject.defaultOnwardEntitledJourney({ promptLogin: false, consentRequired: true });
						expect(overlayStub.calledWith(sinon.match(subject.POST_SUBSCRIBE_URL))).to.be.true;
						expect(overlayStub.calledWith(sinon.match('ENTITLED_LOGIN_SUCCESS'))).to.be.true;
					});

					it('show overlay with link to consent page (\/profile) with ft-content-uuid of requested content', function () {
						setHref('https://www.ft.com/content/12345?foo=bar');
						subject.defaultOnwardEntitledJourney({ promptLogin: false, consentRequired: true });
						expect(overlayStub.calledWith(sinon.match(subject.POST_SUBSCRIBE_URL + '&ft-content-uuid=12345'))).to.be.true;
						expect(overlayStub.calledWith(sinon.match('ENTITLED_LOGIN_SUCCESS'))).to.be.true;
					});

				});
			});

		});


		describe('.defaultOnwardSubscribedJourney()', function () {

			describe('consentRequired=true (default)', function () {

				it('will redirect to profile page', function () {
					subject.defaultOnwardSubscribedJourney();
					expect(redirectStub.calledWith(subject.POST_SUBSCRIBE_URL));
				});

				it('will redirect to profile page with ft-content-uuid if query param present', function () {
					setHref('https://www.ft.com/barrier/trial?ft-content-uuid=12345&foo=bar');
					subject.defaultOnwardSubscribedJourney();
					expect(redirectStub.calledWith(subject.POST_SUBSCRIBE_URL + '&ft-content-uuid=12345')).to.be.true;
				});

				it('will redirect to profile page with ft-content-uuid if on a content page', function () {
					setHref('https://www.ft.com/content/12345?foo=bar');
					subject.defaultOnwardSubscribedJourney();
					expect(redirectStub.calledWith(subject.POST_SUBSCRIBE_URL + '&ft-content-uuid=12345')).to.be.true;
				});

			});

			describe('consentRequired=false', function () {

				it('will redirect to homepage', function () {
					subject.defaultOnwardSubscribedJourney({ consentRequired: false });
					expect(redirectStub.calledWith('https://www.ft.com')).to.be.true;
				});

				it('will redirect to content if  ft-content-uuid query param present', function () {
					setHref('https://www.ft.com/barrier/trial?ft-content-uuid=12345&foo=bar');
					subject.defaultOnwardSubscribedJourney({ consentRequired: false });
					expect(redirectStub.calledWith('https://www.ft.com/content/12345')).to.be.true;
				});

				it('will redirect content if on a content page', function () {
					setHref('https://www.ft.com/content/12345?foo=bar');
					subject.defaultOnwardSubscribedJourney({ consentRequired: false });
					expect(redirectStub.calledWith('https://www.ft.com/content/12345')).to.be.true;
				});

			});

		});

	});

});
