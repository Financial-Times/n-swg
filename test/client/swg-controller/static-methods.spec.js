const { expect } = require('chai');
const sinon = require('sinon');

const { JSDOM } = require('../mocks/document');
const SwgController = require('../../../src/client/swg-controller');

describe('Swg Controller: static methods', function () {
	let dom;

	beforeEach(() => {
		const jsdom = new JSDOM();
		global.CustomEvent = jsdom.window.CustomEvent;
		dom = global.document = jsdom.window.document;
	});

	afterEach(() => {
		delete global.document;
		delete global.CustomEvent;
	});

	it('exports a class', function () {
		expect(SwgController).to.be.a('Function');
		expect(SwgController).to.deep.equal(SwgController);
	});

	describe('.load()', function () {
		let swgReadyMock;
		let mockImportClient;

		beforeEach(() => {
			swgReadyMock = Promise.resolve();
			mockImportClient = () => () => true;
		});

		afterEach(() => {
			swgReadyMock = null;
			mockImportClient = null;
		});

		it('returns a promise', function () {
			const subject = SwgController.load({ swgPromise: swgReadyMock, loadClient: mockImportClient });
			expect(subject).to.be.a('Promise');
		});

		it('rejects if loading the swg client fails', function (done) {
			mockImportClient = () => () => {
				throw new Error('failure!');
			};
			const subject = SwgController.load({ swgPromise: swgReadyMock, loadClient: mockImportClient });
			subject.catch(err => {
				expect(err.message).to.equal('failure!');
				done();
			});
		});

		it('resolves if when the loaded swg client invokes the callback', function (done) {
			const mockCallbackResult = { mock: 'result' };
			swgReadyMock = Promise.resolve(mockCallbackResult);
			const subject = SwgController.load({ swgPromise: swgReadyMock, loadClient: mockImportClient });
			subject.then(res => {
				expect(res).to.deep.equal(mockCallbackResult);
				done();
			});
		});

	});

	describe('.fetch()', function () {
		let _fetchMock;
		let mockResult;

		beforeEach(() => {
			mockResult = {
				status: 200,
				headers: {},
				json: function () {
					return Promise.resolve(this.body);
				},
				text: function () {
					return Promise.resolve(this.body);
				},
				body: {}
			};
			_fetchMock = () => Promise.resolve(mockResult);
		});

		afterEach(() => {
			mockResult = null;
			_fetchMock = null;
		});

		it('returns a promise', function () {
			const subject = SwgController.fetch('', '', _fetchMock);
			expect(subject).to.be.a('Promise');
		});

		it('formats request from options passed', function (done) {
			const MOCK_URL = 'https://ft.com';
			const MOCK_OPTIONS = { timeout: 5000 };
			const fetchStub = sinon.stub().resolves(mockResult);
			const subject = SwgController.fetch(MOCK_URL, MOCK_OPTIONS, fetchStub);
			subject.then(() => {
				expect(fetchStub.calledOnce).to.be.true;
				const [ url, opts ] = fetchStub.getCall(0).args;
				expect(url).to.equal(MOCK_URL);
				expect(opts).to.contain(MOCK_OPTIONS);
				expect(opts).to.deep.equal({
					credentials: 'same-origin', method: 'GET', timeout: 5000
				});
				done();
			});
		});

		it('handles a 200 with res.json() and resolves with an object', function (done) {
			const MOCK_BODY = mockResult.body = { example: 'json body' };
			const MOCK_HEADERS = mockResult.headers = { 'content-type': 'application/json' };
			const MOCK_STATUS = mockResult.status = 200;
			const subject = SwgController.fetch('', '', _fetchMock);
			subject.then(result => {
				expect(result.json).to.deep.equal(MOCK_BODY);
				expect(result.headers).to.deep.equal(MOCK_HEADERS);
				expect(result.status).to.deep.equal(MOCK_STATUS);
				done();
			});
		});

		it('handles a bad response with res.text() and rejects with an error', function (done) {
			const MOCK_BODY = mockResult.body = 'System Down';
			const MOCK_STATUS = mockResult.status = 500;
			const subject = SwgController.fetch('', '', _fetchMock);
			subject.catch(err => {
				expect(err).to.be.an('Error');
				expect(err.message).to.deep.equal(`Bad response STATUS=${MOCK_STATUS} TEXT="${MOCK_BODY}"`);
				done();
			});
		});

	});

	describe('.trackEvent()', function () {

		it('dispatches a custom oTracking.event on the document.body', function (done) {
			dom.body.addEventListener('oTracking.event', (event) => {
				expect(event.type).to.equal('oTracking.event');
				done();
			});
			SwgController.trackEvent(null, {}, CustomEvent);
		});

		it('correctly formats event detail', function (done) {
			const MOCK_ACTION = 'swg-error';
			const MOCK_CONTEXT = { message: 'something went wrong' };

			dom.body.addEventListener('oTracking.event', (event) => {
				expect(event.type).to.equal('oTracking.event');
				expect(event.bubbles).to.be.true;
				expect(event.detail).to.contain(MOCK_CONTEXT);
				expect(event.detail.action).to.equal(MOCK_ACTION);
				expect(event.detail.category).to.equal('SwG');
				expect(event.detail.system).to.deep.equal({ source: 'n-swg' });
				done();
			});

			SwgController.trackEvent(MOCK_ACTION, MOCK_CONTEXT, CustomEvent);
		});

	});

});
