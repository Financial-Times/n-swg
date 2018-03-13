const _get = require('lodash/get');

const isRecurringAndRelevantTerm = (term={}) => (charge={}) => {
	const relevantTerm = _get(term, 'iso8601Duration');
	const chargeTerm = _get(charge, 'subscriptionTerm.iso8601Duration');
	const chargeBasis = _get(charge, 'basis');
	return (chargeTerm === relevantTerm) && (chargeBasis === 'RECURRING');
};

const filterPricingByTerm = (offer, term) => {
	return _get(offer, 'offer.pricing', []).map(price => {
		const newCharges = price.charges.filter(isRecurringAndRelevantTerm(term));
		return Object.assign(
			{},
			price,
			{ charges: newCharges }
		);
	});
};

module.exports = (offer) => {
	const terms = _get(offer, 'offer.restrictions.subscriptionTerms');

	// create a duplicate offer for each term with relevant pricing
	return terms.map(term => {
		const pricingByTerm = filterPricingByTerm(offer, term);
		const newOfferData = Object.assign({}, offer.offer, { pricing: pricingByTerm });

		return {
			offerId: _get(offer, 'offer.id'),
			term,
			offer: { offer: newOfferData }
		};
	});

};
