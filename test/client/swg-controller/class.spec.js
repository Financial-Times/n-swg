const { expect } = require('chai');
const sinon = require('sinon');

const { JSDOM } = require('../mocks/document');
const SwgClient = require('../mocks/swg-client');
const SwgController = require('../../../src/client/swg-controller');
const SwgSubscribeButtons = require('../../../src/client/subscribe-button/index');
const { Overlay } = require('../../../src/client/utils');

describe('Swg Controller: class', function () {
	let swgClient;

	beforeEach(() => {
		const jsdom = new JSDOM();
		global.CustomEvent = jsdom.window.CustomEvent;
		global.document = jsdom.window.document;
		global.window = jsdom.window;
		swgClient = new SwgClient();
	});

	afterEach(() => {
		delete global.CustomEvent;
		delete global.document;
		delete global.window;
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
			expect(subject.overlay).to.be.an.instanceOf(Overlay);
			expect(subject.M_SWG_SUB_SUCCESS_ENDPOINT).to.equal('https://swg-fulfilment-svc-eu-prod.memb.ft.com/swg/v1/subscriptions');
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
			sinon.stub(swgClient, 'setOnSubscribeResponse');
			sinon.stub(swgClient, 'setOnEntitlementsResponse');

			const subject = new SwgController(swgClient);
			expect(swgClient.setOnSubscribeResponse.calledOnce).to.be.true;
			expect(swgClient.setOnEntitlementsResponse.calledOnce).to.be.true;
			expect(subject.swgClient).to.deep.equal(swgClient);

			swgClient.setOnSubscribeResponse.restore();
			swgClient.setOnEntitlementsResponse.restore();
	});

	});

	describe('.init()', function () {

		beforeEach(() => {
			sinon.stub(swgClient, 'init');
			sinon.stub(swgClient, 'setOnSubscribeResponse');
		});

		afterEach(() => {
			swgClient.init.restore();
			swgClient.setOnSubscribeResponse.restore();
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
			sinon.stub(subject, 'checkEntitlements').resolves();
			subject.init();
			expect(subject.checkEntitlements.calledOnce).to.be.true;
			subject.checkEntitlements.restore();
		});

		it('will not check entitlements if passed option', function () {
			const subject = new SwgController(swgClient);
			sinon.stub(subject, 'checkEntitlements').resolves();
			subject.init({ checkEntitlements: false });
			expect(subject.checkEntitlements.calledOnce).to.be.false;
			subject.checkEntitlements.restore();
		});

		context('and on checkEntitlements response', function () {

			it('if not granted access and .subscribeButtons will init subscribe buttons', function (done) {
				const buttonInitStub = sinon.stub();
				const mockButtonConstructor = () => ({ init: buttonInitStub });
				const subject = new SwgController(swgClient, { subscribeFromButton: true }, mockButtonConstructor);
				const checkEntitlementsPromise = Promise.resolve({ granted: false });
				sinon.stub(subject, 'checkEntitlements').resolves(checkEntitlementsPromise);
				subject.init();
				checkEntitlementsPromise.then(() => {
					expect(buttonInitStub.calledOnce).to.be.true;
					subject.checkEntitlements.restore();
					done();
				})
				.catch(done);
			});

			it('if granted access will showOverlay, resolve user and call handlers.onResolvedEntitlements(!promptLogin)', function (done) {
				const subject = new SwgController(swgClient);
				const checkEntitlementsPromise = Promise.resolve({ granted: true });
				const resolveUserPromise = Promise.resolve();
				sinon.stub(subject, 'checkEntitlements').returns(checkEntitlementsPromise);
				sinon.stub(subject, 'resolveUser').returns(resolveUserPromise);
				sinon.stub(subject.handlers, 'onResolvedEntitlements');


				subject.init();
				checkEntitlementsPromise.then(() => {
					resolveUserPromise.then(() => {
						expect(subject.handlers.onResolvedEntitlements.calledWith(sinon.match({ promptLogin: false }))).to.be.true;
						subject.resolveUser.restore();
						subject.checkEntitlements.restore();
						subject.handlers.onResolvedEntitlements.restore();
						done();
					})
					.catch(done);
				})
				.catch(done);
			});

			it('if granted access but resolve user errors, signal error and call onwardEntitledJourney(promptLogin)', function (done) {
				const subject = new SwgController(swgClient);
				const checkEntitlementsPromise = Promise.resolve({ granted: true });
				const resolveUserPromise = Promise.reject(new Error('what!'));
				sinon.stub(subject, 'checkEntitlements').returns(checkEntitlementsPromise);
				sinon.stub(subject, 'resolveUser').returns(resolveUserPromise);
				sinon.stub(SwgController, 'signalError');
				sinon.stub(subject.handlers, 'onResolvedEntitlements');

				subject.init();
				checkEntitlementsPromise.then(() => {
					resolveUserPromise
					.catch(() => {
						/* slight hack to force the following block to be
						executed after the actual promise rejection and handling */
						return;
					})
					.then(() => {
						expect(SwgController.signalError.calledOnce).to.be.true;
						expect(subject.handlers.onResolvedEntitlements.calledWith(sinon.match({ promptLogin: true }))).to.be.true;
						subject.resolveUser.restore();
						subject.checkEntitlements.restore();
						SwgController.signalError.restore();
						subject.handlers.onResolvedEntitlements.restore();
						done();
					})
					.catch(done);
				})
				.catch(done);
			});

		});

	});

	describe('events and listeners', function () {

		it('.signal() \"onError\" event calls all registered error listeners', function (done) {
			const MOCK_ERROR = new Error('mock error');
			SwgController.listen('onError', (error) => {
				expect(error).to.equal(MOCK_ERROR);
				done();
			});
			SwgController.signal('onError', MOCK_ERROR);
		});

		it('.signal() \"onReturn\" event calls all registered return listeners', function (done) {
			const MOCK_RESULT = { example: 'object' };
			SwgController.listen('onReturn', (error) => {
				expect(error).to.equal(MOCK_RESULT);
				done();
			});
			SwgController.signal('onReturn', MOCK_RESULT);
		});

	});

	describe('.onSubscribeResponse() handler', function () {
		let subject;
		let redirectStub;

		beforeEach(() => {
			subject = new SwgController(swgClient, { subscribeFromButton: true });
			sinon.stub(SwgController, 'signal');
			sinon.stub(SwgController, 'trackEvent');
			redirectStub = sinon.stub(SwgController, 'redirectTo');
		});

		afterEach(() => {
			SwgController.signal.restore();
			SwgController.trackEvent.restore();
			redirectStub.restore();
			subject = null;
		});

		it('on subPromise success: disable buttons, signal return, track success, resolve user -> handlers.onResolvedSubscribe()', function (done) {
			const mockResponseComplete = Promise.resolve();
			const MOCK_RESULT = { mock: 'swg-result', complete: () => mockResponseComplete };
			const subPromise = Promise.resolve(MOCK_RESULT);
			const resolveUserPromise = Promise.resolve();

			sinon.stub(subject, 'resolveUser').returns(resolveUserPromise);
			sinon.stub(subject.subscribeButtons, 'disableButtons');
			sinon.spy(subject.handlers, 'onResolvedSubscribe');
			subject.onSubscribeResponse(subPromise);

			subPromise.then(() => {
				expect(subject.subscribeButtons.disableButtons.calledOnce).to.be.true;
				expect(SwgController.signal.calledWith('onSubscribeReturn', MOCK_RESULT)).to.be.true;
				expect(SwgController.trackEvent.calledOnce).to.be.true;
				expect(SwgController.trackEvent.calledWith(sinon.match({ action: 'success' }))).to.be.true;
				resolveUserPromise.then(() => {
					expect(subject.resolveUser.calledWith(subject.NEW_USER, MOCK_RESULT)).to.be.true;
					mockResponseComplete.then(() => {
						expect(SwgController.trackEvent.calledTwice).to.be.true;
						expect(subject.handlers.onResolvedSubscribe.calledOnce).to.be.true;
						expect(SwgController.trackEvent.calledWith(sinon.match({ action: 'confirmation' }))).to.be.true;
						subject.resolveUser.restore();
						subject.subscribeButtons.disableButtons.restore();
						subject.handlers.onResolvedSubscribe.restore();
						done();
					});
				});
			})
			.catch(done);
		});

		it('on subPromise error: signal error, track event', function (done) {
			const MOCK_ERROR = new Error('mock error');
			MOCK_ERROR.activityResult = {
				code: '1234',
				data: 'error data'
			};
			const subPromise = Promise.reject(MOCK_ERROR);

			subject.onSubscribeResponse(subPromise);

			subPromise
			.then(() => {
				/* slight hack to force the following catch block to be
				registered after the genuine catch block in the
				onSubscribeResponse > subPromise */
				return;
			})
			.catch(() => {
				expect(SwgController.signal.calledWith('onError', { error: MOCK_ERROR, info: {} }), 'signalError called').to.be.true;
				expect(SwgController.trackEvent.calledOnce, 'trackEvent calledOnce').to.be.true;
				expect(SwgController.trackEvent.calledWith(sinon.match({
					action: 'exit',
					errCode: MOCK_ERROR.activityResult.code,
					errData: MOCK_ERROR.activityResult.data
				})), 'track exit called').to.be.true;
				done();
			})
			.catch(done);
		});

	});

	describe('.resolveUser()', function () {
		let subject;
		const MOCK_M_SWG_SUB_SUCCESS_ENDPOINT = 'https://www.ft.com/success';
		const MOCK_M_SWG_ENTITLED_SUCCESS_ENDPOINT = 'https://www.ft.com/entitlements';

		beforeEach(() => {
			subject = new SwgController(swgClient, {
				M_SWG_SUB_SUCCESS_ENDPOINT: MOCK_M_SWG_SUB_SUCCESS_ENDPOINT,
				M_SWG_ENTITLED_SUCCESS_ENDPOINT: MOCK_M_SWG_ENTITLED_SUCCESS_ENDPOINT
			});
		});

		afterEach(() => {
			subject = null;
		});

		it('is a function', function () {
			expect(subject.resolveUser).to.be.a('Function');
		});

		it('returns a promise', function () {
			sinon.stub(SwgController, 'fetch').resolves({ json: {}});
			expect(subject.resolveUser()).to.be.a('Promise');
			SwgController.fetch.restore();
		});

		it('correctly formats default (ENTITLEMENTS) request from passed options', function () {
			const MOCK_SWG_RESPONSE = { swgToken: '123' };
			const expectedBody = JSON.stringify(MOCK_SWG_RESPONSE);
			sinon.stub(SwgController, 'fetch').resolves({ json: {}});
			subject.resolveUser(subject.ENTITLED_USER, MOCK_SWG_RESPONSE);
			expect(SwgController.fetch.calledWith(MOCK_M_SWG_ENTITLED_SUCCESS_ENDPOINT, {
				method: 'POST',
				body: expectedBody,
				credentials: 'include',
				headers: {
					'content-type': 'application/json'
				}
			})).to.be.true;
			SwgController.fetch.restore();
		});

		it('scenario=ENTITLED_USER if no M_SWG_ENTITLED_SUCCESS_ENDPOINT reject with an error', function () {
			subject.M_SWG_ENTITLED_SUCCESS_ENDPOINT = null;
			const resultPromise = subject.resolveUser(subject.ENTITLED_USER, {});
			resultPromise.catch(err => {
				expect(err.message).to.contain('M_SWG_ENTITLED_SUCCESS_ENDPOINT not set');
				SwgController.fetch.restore();
			});
		});

		it('scenario=NEW_USER correctly formats (NEW USER) request from passed options', function () {
			const MOCK_SWG_RESPONSE = { swgToken: '123' };
			const expectedBody = JSON.stringify(MOCK_SWG_RESPONSE);
			sinon.stub(SwgController, 'fetch').resolves({ json: {}});
			subject.resolveUser(subject.NEW_USER, MOCK_SWG_RESPONSE);
			expect(SwgController.fetch.calledWith(MOCK_M_SWG_SUB_SUCCESS_ENDPOINT, {
				method: 'POST',
				body: expectedBody,
				credentials: 'include',
				headers: {
					'content-type': 'application/json'
				}
			})).to.be.true;
			SwgController.fetch.restore();
		});

		it('extracts and resolves with json on fetch response', function (done) {
			const MOCK_RESULT = { end: 'result' };
			sinon.stub(SwgController, 'fetch').resolves({ json: MOCK_RESULT });
			subject.resolveUser().then(result => {
				expect(result).to.deep.equal(MOCK_RESULT);
				done();
			});
			SwgController.fetch.restore();
		});

		it('extracts and resolves with json on fetch error', function (done) {
			const MOCK_ERROR = new Error('Bad response!');
			sinon.stub(SwgController, 'fetch').throws(MOCK_ERROR);
			subject.resolveUser().catch(err => {
				expect(err).to.deep.equal(MOCK_ERROR);
				done();
			});
			SwgController.fetch.restore();
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
			const MOCK_RESULT = { enablesThis: () => true, other: 'data' };
			sinon.stub(swgClient, 'getEntitlements');

			subject.checkEntitlements().then(res => {
				expect(res.granted).to.be.true;
				expect(res.entitlements).to.equal(MOCK_RESULT);
				expect(swgClient.getEntitlements.calledOnce).to.true;
				swgClient.getEntitlements.restore();
				done();
			})
			.catch(done);

			SwgController.signal('entitlementsResponse', MOCK_RESULT);
		});

		it('resolves with formatted \"entitlementsResponse\" where access is not granted', function (done) {
			const MOCK_RESULT = { enablesThis: () => false, other: 'data' };
			sinon.stub(swgClient, 'getEntitlements');

			subject.checkEntitlements().then(res => {
				expect(res.granted).to.be.false;
				expect(res.entitlements).to.equal(MOCK_RESULT);
				expect(swgClient.getEntitlements.calledOnce).to.true;
				swgClient.getEntitlements.restore();
				done();
			})
			.catch(done);

			SwgController.signal('entitlementsResponse', MOCK_RESULT);
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
			sinon.stub(SwgController, 'signal');
			sinon.stub(subject, 'track');

			subject.onFlowCanceled('someFlow');
			expect(SwgController.signal.calledWith('flowCanceled.someFlow')).to.be.true;
			expect(subject.track.calledWith({ action: 'flowCanceled', context: { flowName: 'someFlow' } })).to.be.true;
			SwgController.signal.restore();
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
			sinon.stub(SwgController, 'signal');
			sinon.stub(subject, 'track');

			subject.onFlowStarted('someFlow');
			expect(SwgController.signal.calledWith('flowStarted.someFlow')).to.be.true;
			expect(subject.track.calledWith({ action: 'flowStarted', context: { flowName: 'someFlow' } })).to.be.true;
			SwgController.signal.restore();
		});

	});

	describe('.onEntitlementsResponse()', function () {
		let subject;

		beforeEach(() => {
			subject = new SwgController(swgClient);
		});

		afterEach(() => {
			subject = null;
		});

		it('signal \"entitlementsResponse\" event on entitlementsPromise', function () {
			sinon.stub(SwgController, 'signal');
			const MOCK_RESULT = { entitlments: 'object', ack: () => true };
			const mockEntitlementsPromise = Promise.resolve(MOCK_RESULT);

			subject.onEntitlementsResponse(mockEntitlementsPromise);
			return mockEntitlementsPromise.then(() => {
				expect(SwgController.signal.calledWith('entitlementsResponse', MOCK_RESULT)).to.be.true;
				SwgController.signal.restore();
			});
		});

		it('suppress Google message with .ack()', function () {
			const MOCK_RESULT = { entitlments: 'object', ack: sinon.stub() };
			const mockEntitlementsPromise = Promise.resolve(MOCK_RESULT);

			subject.onEntitlementsResponse(mockEntitlementsPromise);
			return mockEntitlementsPromise.then(() => {
				expect(MOCK_RESULT.ack.calledOnce).to.be.true;
			});
		});

		it('signal \"Error\" event on entitlementsPromise', function () {
			sinon.stub(SwgController, 'signalError');
			const MOCK_ERROR = new Error('mock');
			const mockEntitlementsPromise = Promise.reject(MOCK_ERROR);

			subject.onEntitlementsResponse(mockEntitlementsPromise);
			return mockEntitlementsPromise.then(() => true).catch(() => {
					expect(SwgController.signalError.calledWith(MOCK_ERROR)).to.be.true;
					SwgController.signalError.restore();
				});
		});

	});

	describe('.track()', function () {
		let subject;
		let trackEventStub;

		beforeEach(() => {
			subject = new SwgController(swgClient);
			trackEventStub = sinon.stub(SwgController, 'trackEvent');
		});

		afterEach(() => {
			trackEventStub.restore();
			subject = null;
		});

		it('can be invoked via a \"track\" signalled event', function () {
			sinon.stub(subject, 'track');
			subject.init();
			SwgController.signal('track', { action: 'foo'} );
			expect(subject.track.calledOnce).to.be.true;
			subject.track.restore();;
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
			dispatchEventStub = sinon.stub(global.document.body, 'dispatchEvent');
		});

		afterEach(() => {
			dispatchEventStub.restore();
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
			redirectStub = sinon.stub(SwgController, 'redirectTo');
			overlayStub = sinon.stub(subject.overlay, 'show');
			sinon.stub(SwgController, 'getWindowLocation').returns(windowLocation);
		});

		afterEach(() => {
			subject = null;
			overlayStub.restore();
			redirectStub.restore();
			windowLocation = null;
			SwgController.getWindowLocation.restore();
		});

		describe('.onwardEntitledJourney()', function () {

			context('promptLogin=true', function () {
				it('show overlay will have link that defaults to login page', function () {
					subject.onwardEntitledJourney({ promptLogin: true });
					expect(overlayStub.calledWith(sinon.match('https://www.ft.com/login?socialEnabled=true'))).to.be.true;
					expect(overlayStub.calledWith(sinon.match('ENTITLED_LOGIN_REQUIRED'))).to.be.true;
			});

				it('show overlay will have login link with requested content url as location', function () {
				setHref('https://www.ft.com/barrier/trial?ft-content-uuid=12345&foo=bar');
					subject.onwardEntitledJourney({ promptLogin: true });
					expect(overlayStub.calledWith(sinon.match('https://www.ft.com/login?socialEnabled=true&location=https%3A%2F%2Fwww.ft.com%2Fcontent%2F12345'))).to.be.true;
					expect(overlayStub.calledWith(sinon.match('ENTITLED_LOGIN_REQUIRED'))).to.be.true;
				});
			});

			context('promptLogin=false', function () {
				it('show overlay with link to requested content if ft-content-uuid present', function () {
					setHref('https://www.ft.com/barrier/trial?ft-content-uuid=12345&foo=bar');
					subject.onwardEntitledJourney({ promptLogin: false });
					expect(overlayStub.calledWith(sinon.match('https://www.ft.com/content/12345'))).to.be.true;
					expect(overlayStub.calledWith(sinon.match('ENTITLED_LOGIN_SUCCESS'))).to.be.true;
			});

				it('show overlay with link to requested content if on a content page promptLogin', function () {
				setHref('https://www.ft.com/content/12345?foo=bar');
					subject.onwardEntitledJourney({ promptLogin: false });
					expect(overlayStub.calledWith(sinon.match('https://www.ft.com/content/12345'))).to.be.true;
					expect(overlayStub.calledWith(sinon.match('ENTITLED_LOGIN_SUCCESS'))).to.be.true;
				});
			});

		});


		describe('.onwardSubscribedJourney()', function () {

			it('will redirect to profile page', function () {
				subject.onwardSubscribedJourney();
				expect(redirectStub.calledWith(subject.POST_SUBSCRIBE_URL));
			});

			it('will redirect to profile page with ft-content-uuid if query param present', function () {
				setHref('https://www.ft.com/barrier/trial?ft-content-uuid=12345&foo=bar');
				subject.onwardSubscribedJourney();
				expect(redirectStub.calledWith(subject.POST_SUBSCRIBE_URL + '&ft-content-uuid=12345')).to.be.true;
			});

			it('will redirect to profile page with ft-content-uuid if on a content page', function () {
				setHref('https://www.ft.com/content/12345?foo=bar');
				subject.onwardSubscribedJourney();
				expect(redirectStub.calledWith(subject.POST_SUBSCRIBE_URL + '&ft-content-uuid=12345')).to.be.true;
			});

		});

	});

});
