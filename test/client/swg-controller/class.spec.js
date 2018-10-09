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
		const jsdom = new JSDOM('', {
			url: 'http://www.ft.com'
		});

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
			expect(subject.M_SWG_ENTITLED_SUCCESS_ENDPOINT).to.equal('https://api.ft.com/commerce/v1/swg/subscriptions/entitlementsCheck');
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

		it('will add handler for onInitialEntitlementsEvent event', function () {
			const subject = new SwgController(swgClient);
			sandbox.stub(utils.events, 'listen');
			subject.init();
			expect(utils.events.listen.calledWith('onInitialEntitlementsEvent')).to.be.true;
		});

		it('will not action entitlements if passed disableEntitlementsCheck option', async function () {
			const mockEntitlementResponse = Promise.resolve({ granted: true, json: {} });
			const subject = new SwgController(swgClient);
			sandbox.stub(subject, 'resolveUser').resolves();

			const initResult = subject.init({ disableEntitlementsCheck: true });
			utils.events.signal('onInitialEntitlementsEvent', mockEntitlementResponse);
			await initResult;
			expect(subject.resolveUser.calledOnce).to.be.false;
		});

		context('and on checkEntitlements response', function () {

			it('if not granted access and .subscribeButtons will init subscribe buttons', async function () {
				const promiseStubCheck = sandbox.stub();
				const buttonInitStub = sandbox.stub();
				const mockButtonConstructor = () => ({ init: buttonInitStub });
				const subject = new SwgController(swgClient, { subscribeFromButton: true }, mockButtonConstructor);
				const checkEntitlementsPromise = Promise.resolve().then(() => {
					promiseStubCheck();
					return { granted: false };
				});

				const initResult = subject.init();
				utils.events.signal('onInitialEntitlementsEvent', checkEntitlementsPromise);

				await initResult;
				expect(buttonInitStub.calledOnce).to.be.true;
				expect(promiseStubCheck.calledOnce).to.be.true;
			});

			it('if granted access will call handlers.onResolvedEntitlements(result)', async function () {
				const SWG_ENTITLEMENTS_RESULT = { granted: true, json: {} };
				const subject = new SwgController(swgClient);
				const checkEntitlementsPromise = Promise.resolve(SWG_ENTITLEMENTS_RESULT);
				sandbox.stub(subject.handlers, 'onResolvedEntitlements');

				const initResult = subject.init();
				utils.events.signal('onInitialEntitlementsEvent', checkEntitlementsPromise);

				await initResult;
				expect(subject.handlers.onResolvedEntitlements.calledWith(SWG_ENTITLEMENTS_RESULT)).to.be.true;
			});

			it('if user hasEntitlements but is not granted access, show message overlay', async function () {
				const subject = new SwgController(swgClient);
				const checkEntitlementsPromise = Promise.resolve({ granted: false, json: {}, hasEntitlements: true });

				sandbox.stub(subject.overlay, 'show');

				const initResult = subject.init();
				utils.events.signal('onInitialEntitlementsEvent', checkEntitlementsPromise);

				await initResult.catch(); // attatch catch to wait on block to execute
				expect(subject.overlay.show.calledWith(sinon.match('You are trying to access Premium content'))).to.be.true;
			});

		});

	});

	describe('.onSubscribeResponse() handler', function () {
		let subject;

		beforeEach(() => {
			subject = new SwgController(swgClient, { subscribeFromButton: true });
			sandbox.stub(utils.events, 'signal');
			sandbox.stub(utils.browser, 'redirectTo'); // silence error
			sandbox.stub(subject, 'track');
		});

		it('on subPromise success: drop onward journey cookie, disable buttons, signal return, track success, resolve user -> handlers.onResolvedSubscribe()', async function () {
			const mockResponseComplete = Promise.resolve();
			const MOCK_RESULT = { mock: 'swg-result', complete: () => mockResponseComplete };
			const subPromise = Promise.resolve(MOCK_RESULT);
			const resolveUserPromise = Promise.resolve();

			sandbox.stub(subject, 'resolveUser').returns(resolveUserPromise);
			sandbox.stub(subject.subscribeButtons, 'disableButtons');
			sandbox.spy(subject.handlers, 'onResolvedSubscribe');

			await subject.onSubscribeResponse(subPromise);
			expect(global.document.cookie).to.include('FTSwgNewSubscriber');
			expect(subject.subscribeButtons.disableButtons.calledOnce).to.be.true;
			expect(utils.events.signal.calledWith('onSubscribeReturn', MOCK_RESULT)).to.be.true;
			expect(subject.track.getCall(0).calledWith(sinon.match({ action: 'success' }))).to.be.true;
			expect(subject.resolveUser.calledWith(subject.NEW_USER, MOCK_RESULT)).to.be.true;
			expect(subject.track.calledTwice).to.be.true;
			expect(subject.handlers.onResolvedSubscribe.calledOnce).to.be.true;
			expect(subject.track.getCall(1).calledWith(sinon.match({ action: 'google-confirmed' }))).to.be.true;
		});

		it('on subPromise success, but resolveUser error disable buttons, signal return, track success, signal error, track event', async function () {
			const MOCK_ERROR = new Error('500 res');
			const mockResponseComplete = Promise.resolve();
			const MOCK_RESULT = { mock: 'swg-result', complete: () => mockResponseComplete };
			const subPromise = Promise.resolve(MOCK_RESULT);
			const resolveUserPromise = Promise.reject(MOCK_ERROR);

			sandbox.stub(subject, 'resolveUser').returns(resolveUserPromise);
			sandbox.stub(subject.subscribeButtons, 'disableButtons');
			sandbox.spy(subject.handlers, 'onResolvedSubscribe');

			await subject.onSubscribeResponse(subPromise);
			expect(subject.subscribeButtons.disableButtons.calledOnce).to.be.true;
			expect(utils.events.signal.getCall(0).calledWith('onSubscribeReturn', MOCK_RESULT)).to.be.true;
			expect(subject.track.getCall(0).calledWith(sinon.match({ action: 'success' }))).to.be.true;
			expect(subject.resolveUser.calledWith(subject.NEW_USER, MOCK_RESULT)).to.be.true;
			expect(utils.events.signal.getCall(1).calledWith('onError', { error: MOCK_ERROR, info: {} })).to.be.true;
			expect(subject.track.getCall(1).calledWith(sinon.match({
				action: 'failure',
				context: { stage: 'user-resolution' }
			}))).to.be.true;
			expect(subject.track.getCall(2).calledWith(sinon.match({ action: 'exit' }))).to.be.true;
		});

		it('on subPromise error: signal error, track event', async function () {
			const MOCK_ERROR = new Error('mock error');
			MOCK_ERROR.activityResult = {
				code: '1234',
				data: 'error data'
			};
			const subPromise = Promise.reject(MOCK_ERROR);

			await subject.onSubscribeResponse(subPromise);
			expect(utils.events.signal.calledWith('onError', { error: MOCK_ERROR, info: {} })).to.be.true;
			expect(subject.track.calledOnce).to.be.true;
			expect(subject.track.calledWith(sinon.match({
				action: 'exit',
				context: {
						errCode: MOCK_ERROR.activityResult.code,
						errData: MOCK_ERROR.activityResult.data
				}
			}))).to.be.true;
		});

	});

	describe('.onLoginRequest()', function () {
		it('calls browser.redirectTo with a correct url', function () {
			const subject = new SwgController(swgClient);
			const redirectStub = sandbox.stub(utils.browser, 'redirectTo');
			subject.init();
			subject.onLoginRequest();
			expect(redirectStub.calledWith('https://www.ft.com/login?socialEnabled=true')).to.be.true;
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

		it('correctly formats default (ENTITLEMENTS) request from passed options', async function () {
			const MOCK_SWG_RESPONSE = { swgToken: '123' };
			const expectedBody = JSON.stringify({ createSession: true, swg: MOCK_SWG_RESPONSE });
			fetchStub.resolves({ json: {}});
			await subject.resolveUser(subject.ENTITLED_USER, MOCK_SWG_RESPONSE);

			expect(fetchStub.calledWith(MOCK_M_SWG_ENTITLED_SUCCESS_ENDPOINT, {
				method: 'POST',
				body: expectedBody,
				credentials: 'include',
				headers: {
					'content-type': 'application/json'
				}
			})).to.be.true;
		});

		it('scenario=ENTITLED_USER correctly formats (ENTITLED USER) and handles request from passed options', async function () {
			const MOCK_SWG_RESPONSE = { swgToken: '123' };
			const expectedBody = JSON.stringify({ createSession: false, swg: MOCK_SWG_RESPONSE });
			const MOCK_RESULT = { userInfo: { newlyCreated: false } };
			fetchStub.resolves({ json: MOCK_RESULT });

			const result = await subject.resolveUser(subject.ENTITLED_USER, MOCK_SWG_RESPONSE, false);
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

		it('scenario=NEW_USER correctly formats (NEW USER) and handles request from passed options', async function () {
			const MOCK_SWG_RESPONSE = { swgToken: '123' };
			const expectedBody = JSON.stringify(MOCK_SWG_RESPONSE);
			const MOCK_RESULT = { userInfo: { newlyCreated: true } };
			fetchStub.resolves({ json: MOCK_RESULT });

			const result = await subject.resolveUser(subject.NEW_USER, MOCK_SWG_RESPONSE);
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

		it('scenario=EXISTING_USER correctly formats (EXISTING USER) and handles request from passed options', async function () {
			const MOCK_SWG_RESPONSE = { swgToken: '123' };
			const MOCK_RESULT = { userInfo: { newlyCreated: false } };
			fetchStub.resolves({ json: MOCK_RESULT });
			subject.setNewSwgSubscriberCookie();

			const result = await subject.resolveUser(subject.NEW_USER, MOCK_SWG_RESPONSE);
			expect(result).to.deep.equal({
				loginRequired: false,
				consentRequired: true,
				raw: MOCK_RESULT
			});
		});

		it('extracts and resolves with json on fetch response', async function () {
			const MOCK_RESULT = { end: 'result' };
			fetchStub.resolves({ json: MOCK_RESULT });
			const result = await subject.resolveUser();
			expect(result).to.deep.equal({ consentRequired: false, loginRequired: false, raw: MOCK_RESULT });
		});

		it('correctly formats result json and consentRequired boolean', async function () {
			const MOCK_RESULT = { userInfo: { newlyCreated: true } };
			fetchStub.resolves({ json: MOCK_RESULT });
			const result = await subject.resolveUser();
			expect(result).to.deep.equal({ loginRequired: false, consentRequired: true, raw: MOCK_RESULT });
		});

		it('correctly formats result json and loginRequired boolean', async function () {
			const MOCK_RESULT = { userInfo: { newlyCreated: true } };
			fetchStub.resolves({ json: MOCK_RESULT });
			const result = await subject.resolveUser(null, {}, false);
			expect(result).to.deep.equal({ loginRequired: true, consentRequired: true, raw: MOCK_RESULT });
		});

		it('retries on fetch error', async function () {
			const MOCK_ERROR = new Error('Bad Response');
			const MOCK_RESULT = { userInfo: { newlyCreated: true } };

			fetchStub
				.onFirstCall().rejects(MOCK_ERROR)
				.onSecondCall().resolves({ json: MOCK_RESULT });

			await subject.resolveUser();

			expect(fetchStub.getCalls().length).to.deep.equal(2);
		});

		it('only retries as many times as defined by MAX_RETRIES', function () {
			const MOCK_ERROR = new Error('Bad response!');
			fetchStub.rejects(MOCK_ERROR);
			subject.MAX_RETRIES = 5;
			return subject.resolveUser().catch(() => {
				// -1 because the first call isn't a *retry*
				expect(fetchStub.getCalls().length - 1).to.deep.equal(5);
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

		it('resolves with formatted \"entitlementsResponse\" event', async function () {
			const MOCK_JSON_FUNC_RESULT = { other: 'data' };
			const MOCK_RESULT = { enablesThis: () => true, enablesAny: () => true, other: 'data', json: () => MOCK_JSON_FUNC_RESULT, ack: () => true };
			sandbox.stub(swgClient, 'getEntitlements').resolves(MOCK_RESULT);

			const res = await subject.checkEntitlements();
			expect(res.granted).to.be.true;
			expect(res.hasEntitlements).to.be.true;
			expect(res.json).to.deep.equal(MOCK_JSON_FUNC_RESULT);
			expect(res.entitlements).to.equal(MOCK_RESULT);
		});

		it('resolves with formatted \"entitlementsResponse\" where access is not granted', async function () {
			const MOCK_RESULT = { enablesThis: () => false, enablesAny: () => false, other: 'data', ack: () => true };
			sandbox.stub(swgClient, 'getEntitlements').resolves(MOCK_RESULT);

			const res = await subject.checkEntitlements();
			expect(res.granted).to.be.false;
			expect(res.hasEntitlements).to.be.false;
			expect(res.entitlements).to.equal(MOCK_RESULT);
			expect(swgClient.getEntitlements.calledOnce).to.true;
		});

	});

	describe('.onFlowStarted()', function () {
		let subject;

		beforeEach(() => {
			subject = new SwgController(swgClient);
			sandbox.stub(utils.events, 'signal');
			sandbox.stub(subject, 'track');
		});

		afterEach(() => {
			subject = null;
		});

		it('signal and track appropriately on flowStarted', function () {
			subject.onFlowStarted({ flow: 'someFlow', data: { sku: 'foo' } });
			expect(subject.track.calledWith({ action: 'flowStarted', context: { flowName: 'someFlow', skus: ['foo'] }, journeyStart: true })).to.be.true;
		});

		it('signal and track appropriately on flowStarted when flowName === subscribe', function () {
			subject.onFlowStarted({ flow:'subscribe', data: { sku: 'foo' }});
			expect(subject.track.calledWith({ action: 'landing', context: { flowName: 'subscribe', skus: ['foo'] }, journeyStart: true })).to.be.true;
		});

	});

	describe('.onFlowCanceled()', function () {
		let subject;

		beforeEach(() => {
			subject = new SwgController(swgClient);
			sandbox.stub(utils.events, 'signal');
			sandbox.stub(subject, 'track');
		});

		afterEach(() => {
			subject = null;
		});

		it('signal and track appropriately on flowCanceled', function () {
			subject.onFlowCanceled({ flow: 'someFlow', data: { sku: 'foo' }});
			expect(subject.track.calledWith({ action: 'flowCanceled', context: { flowName: 'someFlow', skus: ['foo'] } })).to.be.true;
		});

		it('signal and track appropriately on flowCanceled when flowName === subscribe', function () {
			subject.onFlowCanceled({ flow: 'subscribe', data: { sku: 'foo' }});
			expect(subject.track.calledWith({ action: 'exit', context: { flowName: 'subscribe', skus: ['foo'] } })).to.be.true;
		});

	});

	describe('.onEntitlementsResponse()', function () {
		let subject;

		beforeEach(() => {
			subject = new SwgController(swgClient);
		});

		it('signal \"onInitialEntitlementsEvent\" event on entitlementsPromise with formatted data', async function () {
			sandbox.stub(utils.events, 'signal');
			const MOCK_RAW_RESULT = { entitlments: 'object', ack: () => true };
			const mockEntitlementsPromise = Promise.resolve(MOCK_RAW_RESULT);
			const FORMATTED_RESULT = { granted: undefined, hasEntitlements: undefined, json: undefined, entitlements: MOCK_RAW_RESULT };

			await subject.onEntitlementsResponse(mockEntitlementsPromise);
			expect(utils.events.signal.calledWith('onInitialEntitlementsEvent', FORMATTED_RESULT)).to.be.true;
		});

		it('suppress Google message with .ack()', async function () {
			const MOCK_RESULT = { entitlments: 'object', ack: sandbox.stub() };
			const mockEntitlementsPromise = Promise.resolve(MOCK_RESULT);

			await subject.onEntitlementsResponse(mockEntitlementsPromise);
			expect(MOCK_RESULT.ack.calledOnce).to.be.true;
		});

		it('signal \"Error\" event on entitlementsPromise', async function () {
			sandbox.stub(utils.events, 'signalError');
			const MOCK_ERROR = new Error('mock');
			const mockEntitlementsPromise = Promise.reject(MOCK_ERROR);

			await subject.onEntitlementsResponse(mockEntitlementsPromise);
			expect(utils.events.signalError.calledWith(MOCK_ERROR)).to.be.true;
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
				formType: 'swg.signup',
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
				formType: 'swg.signup',
				production: true,
				paymentMethod: 'SWG',
				system: { source: 'n-swg' },
				offerId: 'abcd38-efg89',
				skuId: 'ft.com_abcd38.efg89_p1m_premium.trial_31.05.18',
				productName: 'premium trial',
				term: 'trial',
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
				formType: 'swg.signup',
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
				formType: 'swg.signup',
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
			sandbox.stub(utils.browser, 'getWindowLocation').returns(windowLocation);
		});

		afterEach(() => {
			windowLocation = null;
		});

		describe('.defaultOnwardEntitledJourney()', function () {

			it('should check if the entitled user has an account or not', () => {
				sandbox.spy(subject, 'hasAccount');

				subject.defaultOnwardEntitledJourney({
					subscriptionToken: 'test'
				});

				expect(subject.hasAccount.calledWith('test')).to.be.true;
			});

			it('should log the user in of they have an account', async () => {
				sandbox.stub(swgClient, 'waitForSubscriptionLookup').returns(Promise.resolve(true));
				sandbox.spy(swgClient, 'showLoginNotification');

				await subject.defaultOnwardEntitledJourney({
					subscriptionToken: 'test'
				});

				expect(swgClient.showLoginNotification.calledOnce).to.be.true;
			});

			it('should create the user if they don\'t have an account', async () => {
				sandbox.stub(swgClient, 'waitForSubscriptionLookup').returns(Promise.resolve(false));
				sandbox.spy(swgClient, 'completeDeferredAccountCreation');
				sandbox.spy(subject, 'resolveUser');

				await subject.defaultOnwardEntitledJourney({
					subscriptionToken: 'test'
				});

				expect(swgClient.completeDeferredAccountCreation.calledOnce).to.be.true;
				expect(subject.resolveUser.calledOnce).to.be.true;
			});

			it('should signal an error if one happens', async () => {
				sinon.spy(utils.events, 'signalError');
				sandbox.stub(swgClient, 'waitForSubscriptionLookup').returns(Promise.reject(false));

				await subject.defaultOnwardEntitledJourney({
					subscriptionToken: 'test'
				});

				expect(utils.events.signalError.calledOnce).to.be.true;
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
