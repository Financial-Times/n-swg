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
		let mockImportSWG;

		beforeEach(() => {
			swgReadyMock = Promise.resolve();
			mockImportSWG = () => () => true;
		});

		afterEach(() => {
			swgReadyMock = null;
			mockImportSWG = null;
		});

		it('returns a promise', function () {
			const subject = SwgController.load({ swgPromise: swgReadyMock, loadClient: mockImportSWG });
			expect(subject).to.be.a('Promise');
		});

		it('rejects if loading the swg client fails', function () {
			mockImportSWG = () => () => {
				throw new Error('failure!');
			};
			const subject = SwgController.load({ swgPromise: swgReadyMock, loadClient: mockImportSWG });
			return subject.catch(err => {
				expect(err.message).to.equal('failure!');
			});
		});

		it('resolves if when the loaded swg client invokes the callback', async function () {
			const mockCallbackResult = { mock: 'result' };
			swgReadyMock = Promise.resolve(mockCallbackResult);
			const subject = SwgController.load({ swgPromise: swgReadyMock, loadClient: mockImportSWG });
			const res = await subject;
			expect(res).to.deep.equal(mockCallbackResult);
		});

	});

	describe('.generateTrackingData()', function () {

		it('generates basic tracking data', function () {
			const result = SwgController.generateTrackingData({ sandbox: true });
			expect(result).to.deep.equal({
				category: 'SwG',
				formType: 'swg.signup',
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

		it('defaults to an object with skuId', function () {
			const result = SwgController.generateOfferDataFromSkus(['1']);
			expect(result).to.be.an('object');
			expect(result).to.deep.equal({
				skuId: '1'
			});
		});

		describe('returns an object with extracted offer data from sku id', function () {

			it('standard non trial', function () {
				const result = SwgController.generateOfferDataFromSkus(['ft.com_abcd38.efg89_p1y_standard_31.05.18']);
				expect(result).to.deep.equal({
					offerId: 'abcd38-efg89',
					skuId: 'ft.com_abcd38.efg89_p1y_standard_31.05.18',
					productName: 'standard',
					term: 'annual',
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
					term: 'trial',
					productType: 'Digital',
					isTrial: true,
					isPremium: true
				});
			});

			describe('term codes', function () {

				it('p1y = annual', function () {
					const result = SwgController.generateOfferDataFromSkus(['ft.com_abcd38.efg89_p1y_premium_31.05.18']);
					expect(result.term).to.equal('annual');
				});

				it('p1m = monthly', function () {
					const result = SwgController.generateOfferDataFromSkus(['ft.com_abcd38.efg89_p1m_premium_31.05.18']);
					expect(result.term).to.equal('monthly');
				});

				it('if trial product = monthly', function () {
					const result = SwgController.generateOfferDataFromSkus(['ft.com_abcd38.efg89_p1m_premium.trial_31.05.18']);
					expect(result.term).to.equal('trial');
				});

				it('unknown term code = fallback to the code', function () {
					const result = SwgController.generateOfferDataFromSkus(['ft.com_abcd38.efg89_p3m_premium_31.05.18']);
					expect(result.term).to.equal('p3m');
				});

			});

		});

	});

});
