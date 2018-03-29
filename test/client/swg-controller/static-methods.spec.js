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
			SwgController.trackEvent({}, CustomEvent);
		});

	});

	describe('.signalError()', function () {

		it('signals an onError event with correctly formatted detail', function () {
			const signalStub = sinon.stub(SwgController, 'signal');
			const ERR = new Error('bad');
			const INFO = { some: 'extra info' };
			SwgController.signalError(ERR, INFO);
			expect(signalStub.calledWith('onError', { error: ERR, info: INFO }));
			signalStub.restore();
		});

	});



	describe('.listen()', function () {

		it('will attatch a name spaced event listener to the body', function () {
			sinon.stub(dom.body, 'addEventListener');

			SwgController.listen('load', () => true);
			const [ name, func ] = dom.body.addEventListener.getCall(0).args;
			expect(name).to.equal('nSwg.load');
			expect(func).to.be.a('function');

			dom.body.addEventListener.restore();
		});

	});

	describe('.signal()', function () {

		it('will dispatch a name spaced event to the body', function () {
			sinon.stub(dom.body, 'dispatchEvent');
			const DETAIL = { foo: 'bar' };

			SwgController.signal('load', DETAIL, CustomEvent);
			const event = dom.body.dispatchEvent.getCall(0).args[0];
			expect(event.type).to.equal('nSwg.load');
			expect(event.detail).to.equal(DETAIL);

			dom.body.dispatchEvent.restore();
		});

	});

	describe('.generateTrackingData()', function () {

		it('generates basic tracking data', function () {
			const result = SwgController.generateTrackingData({ sandbox: true });
			expect(result).to.deep.equal({
				category: 'SwG',
				formType: 'signup:swg',
				production: false,
				paymentMethod: 'SWG',
				system: { source: 'n-swg' }
			});
		});

	});

	describe('.generateOfferDataFromSku()', function () {

		it('returns an empty object if mutiple skus', function () {
			const result = SwgController.generateOfferDataFromSku(['1', '2']);
			expect(result).to.be.an('object');
			expect(result).to.be.empty;
		});

		it('returns an empty object sku does not start with \"ft.com\"', function () {
			const result = SwgController.generateOfferDataFromSku(['1']);
			expect(result).to.be.an('object');
			expect(result).to.be.empty;
		});

		describe('returns an object with extracted offer data from sku id', function () {

			it('standard non trial', function () {
				const result = SwgController.generateOfferDataFromSku(['ft.com_abcd38.efg89_p1y_standard_31.05.18']);
				expect(result).to.deep.equal({
					offerId: 'abcd38-efg89',
					skuId: 'ft.com_abcd38.efg89_p1y_standard_31.05.18',
					productName: 'standard',
					term: 'p1y',
					productType: 'Digital',
					isTrial: false,
					isPremium: false
				});
			});

			it('premium trial', function () {
				const result = SwgController.generateOfferDataFromSku(['ft.com_abcd38.efg89_p1m_premium.trial_31.05.18']);
				expect(result).to.deep.equal({
					offerId: 'abcd38-efg89',
					skuId: 'ft.com_abcd38.efg89_p1m_premium.trial_31.05.18',
					productName: 'premium trial',
					term: 'p1m',
					productType: 'Digital',
					isTrial: true,
					isPremium: true
				});
			});

		});

	});


	describe('.redirectTo()', function () {

		it('sets window.location.href to value', function () {
			global.window = { location: {} };
			SwgController.redirectTo('https://www.ft.com');
			expect(global.window.location.href).to.equal('https://www.ft.com');
			delete global.window;
		});

	});

	describe('.getWindowLocation()', function () {

		it('gets window.location value', function () {
			const RESULT = { search: 'this', href: 'that' };
			global.window = { location: RESULT };
			const result = SwgController.getWindowLocation('https://www.ft.com');
			expect(result).to.equal(RESULT);
			delete global.window;
		});

	});

	describe('.getContentUuidFromUrl()', function () {

		beforeEach(() => {
			global.window = {};
		});

		afterEach(() => {
			delete global.window;
		});

		it('defaults to undefined', function () {
			const result = SwgController.getContentUuidFromUrl();
			expect(result).to.be.undefined;
		});

		it('extracts uuid from query string', function () {
			global.window.location = { search: '?ft-content-uuid=12345'};
			const result = SwgController.getContentUuidFromUrl();
			expect(result).to.be.equal('12345');
		});

		it('extracts uuid from url path', function () {
			global.window.location = { href: '/content/12345'};
			const result = SwgController.getContentUuidFromUrl();
			expect(result).to.be.equal('12345');
		});

		it('extracts query string over path', function () {
			global.window.location = { href: '/content/12345', search: '?ft-content-uuid=54321' };
			const result = SwgController.getContentUuidFromUrl();
			expect(result).to.be.equal('54321');
		});

	});

});
