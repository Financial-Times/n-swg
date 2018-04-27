const { expect } = require('chai');

const splitOfferByCharge = require('../../../src/server/tools/split-offer-by-charge');
const mockOffers = require('./fixtures/offers.json');

describe('Tool: split-offer-by-charge', function () {

	it('split by charge term', function () {
		const result = splitOfferByCharge(mockOffers[1]);
		expect(result).to.be.an('Array');
		expect(result[0].offerId).to.equal('c8ad55e6-ba74-fea0-f9da-a4546ae2ee23');
		expect(result[0].term).to.deep.equal({ displayName: 'Monthly', iso8601Duration: 'P1M' });
		expect(result[1].offerId).to.equal('c8ad55e6-ba74-fea0-f9da-a4546ae2ee23');
		expect(result[1].term).to.deep.equal({ displayName: 'Annual', iso8601Duration: 'P1Y' });
	});

	it('filter pricing to relevant term', function () {
		const result = splitOfferByCharge(mockOffers[1]);
		const checkAll = (term) => (pricing=[]) => pricing.every(({ charges }) => {
			return charges.length > 0
				? charges.every(c => c.subscriptionTerm.iso8601Duration === term)
				: true;
		});

		expect(result).to.be.an('Array');
		expect(result[0].term).to.deep.equal({ displayName: 'Monthly', iso8601Duration: 'P1M' });
		expect(checkAll('P1M')(result[0].offer.offer.pricing), 'all pricing charges are for the relevant term').to.be.true;

		expect(result[1].term).to.deep.equal({ displayName: 'Annual', iso8601Duration: 'P1Y' });
		expect(checkAll('P1Y')(result[1].offer.offer.pricing), 'all pricing charges are for the relevant term').to.be.true;
	});

});
