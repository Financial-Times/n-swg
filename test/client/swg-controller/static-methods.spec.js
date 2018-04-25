const { expect } = require('chai');

const { JSDOM } = require('../mocks/document');
const SwgController = require('../../../src/client/swg-controller');

describe('Swg Controller: static methods', function () {

	beforeEach(() => {
		const jsdom = new JSDOM();
		global.document = jsdom.window.document;
	});

	afterEach(() => {
		delete global.document;
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

	describe('.generateOfferDataFromSkus()', function () {

		it('returns an empty object if mutiple skus', function () {
			const result = SwgController.generateOfferDataFromSkus(['1', '2']);
			expect(result).to.be.an('object');
			expect(result).to.be.empty;
		});

		it('returns an empty object sku does not start with \"ft.com\"', function () {
			const result = SwgController.generateOfferDataFromSkus(['1']);
			expect(result).to.be.an('object');
			expect(result).to.be.empty;
		});

		describe('returns an object with extracted offer data from sku id', function () {

			it('standard non trial', function () {
				const result = SwgController.generateOfferDataFromSkus(['ft.com_abcd38.efg89_p1y_standard_31.05.18']);
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
				const result = SwgController.generateOfferDataFromSkus(['ft.com_abcd38.efg89_p1m_premium.trial_31.05.18']);
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

});
