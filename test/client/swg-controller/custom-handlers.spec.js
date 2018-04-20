const { expect } = require('chai');
const sinon = require('sinon');

const { JSDOM } = require('../mocks/document');
const SwgClient = require('../mocks/swg-client');
const SwgController = require('../../../src/client/swg-controller');
const utils = require('../../../src/client/utils');

describe('Swg Controller: custom handlers', function () {
	let swgClient;
	let subject;
	let customHandlers;
	let sandbox;

	beforeEach(() => {
		const jsdom = new JSDOM();
		sandbox = sinon.sandbox.create();
		global.CustomEvent = jsdom.window.CustomEvent;
		global.document = jsdom.window.document;
		global.window = jsdom.window;
		swgClient = new SwgClient();
		customHandlers = {
			onResolvedEntitlements: sandbox.stub(),
			onResolvedSubscribe: sandbox.stub()
		};
		subject = new SwgController(swgClient, { handlers: customHandlers });
		sandbox.stub(utils.events, 'signal');
		sandbox.stub(utils.events, 'track');
	});

	afterEach(() => {
		delete global.CustomEvent;
		delete global.document;
		delete global.window;
		sandbox.restore();
	});

	it('after successful subscribe, call options.handlers.onResolvedSubscribe()', function () {
		const mockResponseComplete = Promise.resolve();
		const MOCK_RESULT = { mock: 'swg-result', complete: () => mockResponseComplete };
		const subPromise = Promise.resolve(MOCK_RESULT);
		const resolveUserPromise = Promise.resolve();

		sandbox.stub(subject, 'resolveUser').returns(resolveUserPromise);
		subject.onSubscribeResponse(subPromise);

		subject.init();
		return subPromise.then(() => {
			expect(utils.events.signal.calledWith('onSubscribeReturn', MOCK_RESULT)).to.be.true;
			expect(utils.events.track.calledOnce).to.be.true;
			expect(utils.events.track.calledWith(sinon.match({ action: 'success' }))).to.be.true;
			return resolveUserPromise.then(() => {
				expect(subject.resolveUser.calledWith(subject.NEW_USER, MOCK_RESULT)).to.be.true;
				return mockResponseComplete.then(() => {
					expect(utils.events.track.calledTwice).to.be.true;
					expect(customHandlers.onResolvedSubscribe.calledOnce).to.be.true;
				});
			});
		});
	});

	it('after resolving a users entitlements at init(), call options.handlers.onResolvedEntitlments()', function () {
		const checkEntitlementsPromise = Promise.resolve({ granted: true });
		const resolveUserPromise = Promise.resolve();

		sandbox.stub(subject, 'checkEntitlements').resolves(checkEntitlementsPromise);
		sandbox.stub(subject, 'resolveUser').returns(resolveUserPromise);

		subject.init();
		return checkEntitlementsPromise.then(() => {
			return resolveUserPromise.then(() => {
				expect(customHandlers.onResolvedEntitlements.calledOnce).to.be.true;
			});
		});
	});

});
