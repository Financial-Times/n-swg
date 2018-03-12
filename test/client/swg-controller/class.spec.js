const { expect } = require('chai');
const sinon = require('sinon');

const { JSDOM } = require('../mocks/document');
const SwgClient = require('../mocks/swg-client');
const SwgController = require('../../../src/client/swg-controller');
const SwgSubscribeButtons = require('../../../src/client/subscribe-button/index');

describe('Swg Controller: class', function () {
	let swgClient;

	beforeEach(() => {
		const jsdom = new JSDOM();
		global.CustomEvent = jsdom.window.CustomEvent;
		global.document = jsdom.window.document;
		swgClient = new SwgClient();
	});

	afterEach(() => {
		delete global.CustomEvent;
		delete global.document;
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
			expect(subject.handlers.onSubscribeResponse).to.be.a('Function');
			expect(subject.listeners).to.be.an('Array');
			expect(subject.swgClient).to.deep.equal(swgClient);
			expect(subject.M_SWG_SUB_SUCCESS_ENDPOINT).to.be.undefined;
		});

		it('accepts custom options', function () {
			const OPTIONS = {
				manualInitDomain: 'ft.com',
				handlers: {
					onSubscribeResponse: 'stub',
					onSomeOtherThing: 'stub again'
				},
				M_SWG_SUB_SUCCESS_ENDPOINT: '/success',
				subscribeFromButton: true
			};
			const subject = new SwgController(swgClient, OPTIONS);
			expect(subject.manualInitDomain).to.equal(OPTIONS.manualInitDomain);
			expect(subject.handlers.onSubscribeResponse).to.equal(OPTIONS.handlers.onSubscribeResponse);
			expect(subject.handlers.onSomeOtherThing).to.equal(OPTIONS.handlers.onSomeOtherThing);
			expect(subject.swgClient).to.deep.equal(swgClient);
			expect(subject.M_SWG_SUB_SUCCESS_ENDPOINT).to.equal(OPTIONS.M_SWG_SUB_SUCCESS_ENDPOINT);
			expect(subject.subscribeButtons).to.be.an.instanceOf(SwgSubscribeButtons);
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
			expect(swgClient.setOnSubscribeResponse.notCalled).to.be.true;
		});

		it('will setup swgClient if not alreadyInitialised', function () {
			const subject = new SwgController(swgClient);
			subject.init();
			expect(swgClient.setOnSubscribeResponse.calledOnce).to.be.true;
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

		it('will .init() subscribe buttons if .subscribeButtons', function () {
			const buttonInitStub = sinon.stub();
			const mockButtonConstructor = () => ({ init: buttonInitStub });
			const subject = new SwgController(swgClient, { subscribeFromButton: true }, mockButtonConstructor);
			subject.init();
			expect(buttonInitStub.calledOnce).to.be.true;
			expect(buttonInitStub.getCall(0).args[0]).to.have.all.keys('onReturn','onError');
		});

	});

	describe('events and listeners', function () {
		let subject;

		beforeEach(() => {
			subject = new SwgController(swgClient);
		});

		afterEach(() => {
			subject = null;
		});

		it('.addReturnListener() adds a return listener to the array', function () {
			expect(subject.listeners).to.be.empty;
			subject.addReturnListener(() => true);
			expect(subject.listeners).to.have.lengthOf(1);
		});

		it('.addErrorListener() adds a error listener to the array', function () {
			expect(subject.listeners).to.be.empty;
			subject.addErrorListener(() => true);
			expect(subject.listeners).to.have.lengthOf(1);
		});

		it('.signalError() calls all registered error listeners', function (done) {
			const MOCK_ERROR = new Error('mock error');
			subject.addErrorListener((error) => {
				expect(error).to.equal(MOCK_ERROR);
				done();
			});
			subject.signalError(MOCK_ERROR);
		});

		it('.signalReturn() calls all registered return listeners', function (done) {
			const MOCK_RETURN_VAL = { success: true };
			subject.addReturnListener((error) => {
				expect(error).to.equal(MOCK_RETURN_VAL);
				done();
			});
			subject.signalReturn(MOCK_RETURN_VAL);
		});

	});

	describe('.onSubscribeResponse() handler', function () {
		let subject;

		beforeEach(() => {
			subject = new SwgController(swgClient);
			sinon.stub(subject, 'signalReturn');
			sinon.stub(subject, 'signalError');
			sinon.stub(SwgController, 'trackEvent');
		});

		afterEach(() => {
			subject.signalReturn.restore();
			subject.signalError.restore();
			SwgController.trackEvent.restore();
			subject = null;
		});

		it('on subPromise success', function (done) {
			const MOCK_RESULT = { mock: 'swg-result' };
			const subPromise = Promise.resolve(MOCK_RESULT);
			const resolveUserPromise = Promise.resolve();

			sinon.stub(subject, 'resolveUser').returns(resolveUserPromise);
			subject.onSubscribeResponse(subPromise);

			subPromise.then(() => {
				expect(subject.signalReturn.calledWith(MOCK_RESULT)).to.be.true;
				expect(SwgController.trackEvent.calledOnce).to.be.true;
				expect(SwgController.trackEvent.calledWith('success')).to.be.true;
				resolveUserPromise.then(() => {
					expect(SwgController.trackEvent.calledTwice).to.be.true;
					expect(SwgController.trackEvent.calledWith('confirmation')).to.be.true;
					subject.resolveUser.restore();
					done();
				});
			})
			.catch(done);
		});

		it('on subPromise error', function (done) {
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
				return true;
			})
			.catch(() => {
				expect(subject.signalError.calledWith(MOCK_ERROR), 'signalError called').to.be.true;
				expect(SwgController.trackEvent.calledOnce, 'trackEvent calledOnce').to.be.true;
				expect(SwgController.trackEvent.calledWith('exit', {
					errCode: MOCK_ERROR.activityResult.code,
					errData: MOCK_ERROR.activityResult.data
				}), 'track exit called').to.be.true;
				done();
			})
			.catch(done);
		});

	});

	describe('.resolveUser()', function () {
		let subject;
		const MOCK_M_SWG_SUB_SUCCESS_ENDPOINT = 'https://www.ft.com/success';

		beforeEach(() => {
			subject = new SwgController(swgClient, {
				M_SWG_SUB_SUCCESS_ENDPOINT: MOCK_M_SWG_SUB_SUCCESS_ENDPOINT
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

		it('correctly formats request from passed options', function () {
			const MOCK_SWG_RESPONSE = { swgToken: '123' };
			const expectedBody = JSON.stringify({ swg: MOCK_SWG_RESPONSE, source: { 'country-code': 'GBR' }});
			sinon.stub(SwgController, 'fetch').resolves({ json: {}});
			subject.resolveUser(MOCK_SWG_RESPONSE);
			expect(SwgController.fetch.calledWith(MOCK_M_SWG_SUB_SUCCESS_ENDPOINT, {
				method: 'POST',
				body: expectedBody,
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

});
