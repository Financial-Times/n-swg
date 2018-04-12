const { expect } = require('chai');
const sinon = require('sinon');

const { JSDOM } = require('../mocks/document');
const SwgClient = require('../mocks/swg-client');
const SwgController = require('../../../src/client/swg-controller');

describe('Swg Controller: custom handlers', function () {
	let swgClient;
	let subject;
	let customHandlers;

	beforeEach(() => {
		const jsdom = new JSDOM();
		global.CustomEvent = jsdom.window.CustomEvent;
		global.document = jsdom.window.document;
		global.window = jsdom.window;
		swgClient = new SwgClient();
		customHandlers = {
			onResolvedEntitlements: sinon.stub(),
			onResolvedSubscribe: sinon.stub()
		};
		subject = new SwgController(swgClient, { handlers: customHandlers });
		sinon.stub(SwgController, 'signal');
		sinon.stub(SwgController, 'trackEvent');
	});

	afterEach(() => {
		delete global.CustomEvent;
		delete global.document;
		delete global.window;
		SwgController.signal.restore();
			SwgController.trackEvent.restore();
	});

	it('after successful subscribe, call options.handlers.onResolvedSubscribe()', function (done) {
		const mockResponseComplete = Promise.resolve();
		const MOCK_RESULT = { mock: 'swg-result', complete: () => mockResponseComplete };
		const subPromise = Promise.resolve(MOCK_RESULT);
		const resolveUserPromise = Promise.resolve();

		sinon.stub(subject, 'resolveUser').returns(resolveUserPromise);
		subject.onSubscribeResponse(subPromise);

		subject.init();
		subPromise.then(() => {
			expect(SwgController.signal.calledWith('onSubscribeReturn', MOCK_RESULT)).to.be.true;
			expect(SwgController.trackEvent.calledOnce).to.be.true;
			expect(SwgController.trackEvent.calledWith(sinon.match({ action: 'success' }))).to.be.true;
			resolveUserPromise.then(() => {
				expect(subject.resolveUser.calledWith(subject.NEW_USER, MOCK_RESULT)).to.be.true;
				mockResponseComplete.then(() => {
					expect(SwgController.trackEvent.calledTwice).to.be.true;
					expect(customHandlers.onResolvedSubscribe.calledOnce).to.be.true;
					subject.resolveUser.restore();
					done();
				});
			});
		})
		.catch(done);
	});

	it('after resolving a users entitlements at init(), call options.handlers.onResolvedEntitlments()', function (done) {
		const checkEntitlementsPromise = Promise.resolve({ granted: true });
		const resolveUserPromise = Promise.resolve();
		sinon.stub(subject, 'checkEntitlements').resolves(checkEntitlementsPromise);
		sinon.stub(subject, 'resolveUser').returns(resolveUserPromise);

		subject.init();
		checkEntitlementsPromise.then(() => {
			resolveUserPromise.then(() => {
				expect(customHandlers.onResolvedEntitlements.calledOnce).to.be.true;
				subject.resolveUser.restore();
				subject.checkEntitlements.restore();
				done();
			})
			.catch(done);
		})
		.catch(done);
	});

});
