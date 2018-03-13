const _get = require('lodash/get');
const { alpha3ToAlpha2 } = require('i18n-iso-countries');

const splitOfferByCharge = require('./split-offer-by-charge');

/**
 * Default Config
 */
const DEFAULT_ENTITLEMENTS = {
	FREE: 'ft.com:free',
	REGISTERED: 'ft.com:registered',
	SUBSCRIBED: 'ft.com:subscribed',
	PREMIUM: 'ft.com:premium'
};

const DEFAULT_PLAY_CONFIG = {
	PUBLICATION_NAME: 'Financial Times',
	PUBLICATION_HOSTS: [ 'ft.com', 'local.ft.com:5050' ],
	APP_ID: 'com.ft.news',
	SUPPORTED_COUNTRIES: [ 'GBR' ]
};

const safeGet = (offer) => (key) => _get(offer, key);

/**
 * Format a SwG entitlements array
 */
const generateEntitlements = (ENTITLEMENTS={}) => (code) => {
	// any SKU has atleast the base entitlements
	let entitlements = [ ENTITLEMENTS.FREE, ENTITLEMENTS.REGISTERED ];
	// P1 and above is "subscribed"
	if (['P1', 'P2'].includes(code)) entitlements.push(ENTITLEMENTS.SUBSCRIBED);
	// only P2 is "premium"
	if (code === 'P2') entitlements.push(ENTITLEMENTS.PREMIUM);
	return entitlements;
}

/**
 * Product IDs are unique across an app's namespace. A product ID must start
 * with a lowercase letter or a number and must be composed of only lowercase
 * letters (a-z), numbers (0-9), underscores (_), and periods (.)
 */
const generateId = ({ offerId='', termCode='' }) => {
	return 'ft.com_' + offerId.replace(/\-/g, '.') + '_' + termCode.toLowerCase();
}

/**
 * Format `ISO-2-CHAR; MICRO-VAL`;
 * e.g `BR; 6990000; RU; 129000000; IN; 130000000; ID; 27000000000; MX; 37000000;`
 * TODO: format currency as micro-val
 */
const generatePricing = (SUPPORTED_COUNTRIES=[]) => (pricing=[], term={}) => {
	const matchingDuration = (charge) => _get(charge, 'billingFrequency.iso8601Duration') === term.iso8601Duration;
	const filterBySupported = ({ country }={}) => SUPPORTED_COUNTRIES.includes(country);

	return pricing.filter(filterBySupported).map(price => {
		const relevantPrice = price.charges.find(matchingDuration);
		if (relevantPrice) {
			return {
				iso_2_char: alpha3ToAlpha2(price.country),
				amount: _get(relevantPrice, 'amount.value')
			};
		}
	}).filter(v => v);
};

const transformOffer = ({ ENTITLEMENTS, PLAY_CONFIG }={}) => ({ offer, offerId, term={} }={}) => {
	const pick = safeGet(offer);
	const sku_id = generateId({ offerId, termCode: term.iso8601Duration });
	const getEntitlementsByPcode = generateEntitlements(ENTITLEMENTS);
	const getPricingForTerm = generatePricing(PLAY_CONFIG.SUPPORTED_COUNTRIES);

	return {

		'Product ID': sku_id,
		// Setting this value in the CSV file has the same effect as entering a Product ID when creating a new in-app product.

		'Published State': 'published',
		// This value must be set to published or unpublished.
		// if we have a result from production offer api then it must be published

		'Purchase Type': 'managed_by_android',
		// This value must be set to managed_by_android because batch upload of product lists containing subscriptions is not supported.

		'Auto Translate': false,

		'Description': {
			'Locale': 'en_GB',
			'Title': pick('offer.product.name'),
			'Description': pick('offer.product.name')
		},
		// e.g `en_US; Invisibility Cloak; Makes you invisible.; es_ES; Capote Invisible; Se vuelven invisible.`
		// careful to escape characters

		'Auto Fill Prices': false,
		// we provide explicit pricing

		'Price': getPricingForTerm(pick('offer.pricing'), term),
		// format `ISO-2-CHAR; MICRO-VAL`;

		// 'Pricing Template ID': '', // not used

		// SwG
		'Android App ID': PLAY_CONFIG.APP_ID,
		'SKU ID': sku_id,
		'ProductID(s)': getEntitlementsByPcode(pick('offer.product.code')),
		'Publication host(s)': PLAY_CONFIG.PUBLICATION_HOSTS,
		'Publication name': PLAY_CONFIG.PUBLICATION_NAME,
		'Billing period': term.iso8601Duration
	};

};

/**
 * Accepts an offer as returned by https://api.ft.com/offers/<ID> and transforms
 * it into an array of objects that more closely resemble play store SKUs
 */
module.exports = ({ ENTITLEMENTS=DEFAULT_ENTITLEMENTS, PLAY_CONFIG=DEFAULT_PLAY_CONFIG }={}) => (offer) => {
	const transformer = transformOffer({ ENTITLEMENTS, PLAY_CONFIG });
	return splitOfferByCharge(offer).map(transformer);
};
