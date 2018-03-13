const { expect } = require('chai');

const transformer = require('../../../src/server/tools/offer-to-sku-transformer');
const mockOffers = require('./fixtures/offers');

describe('Tool: offer-to-sku-transformer', function () {
	let subject;

	beforeEach(() => {
		subject = transformer();
	});

	it('formats a SKU based on an offer with one payment term', function () {
		const result = subject(mockOffers[0]);
		expect(result[0]).to.deep.equal({
			'Product ID': 'ft.com_41218b9e.c8ae.c934.43ad.71b13fcb4465_p1m',
			'Published State': 'published',
			'Purchase Type': 'managed_by_android',
			'Auto Translate': false,
			'Description': {
				'Locale': 'en_GB',
				'Title': 'Premium FT.com',
				'Description': 'Premium FT.com'
			},
			'Auto Fill Prices': false,
			'Price': [
				{
					'iso_2_char': 'GB',
					'amount': '48.00'
				}
			],
			'Android App ID': 'com.ft.news',
			'SKU ID': 'ft.com_41218b9e.c8ae.c934.43ad.71b13fcb4465_p1m',
			'ProductID(s)': [
				'ft.com:free',
				'ft.com:registered',
				'ft.com:subscribed',
				'ft.com:premium'
			],
			'Publication host(s)': [
				'ft.com',
				'local.ft.com:5050'
			],
			'Publication name': 'Financial Times',
			'Billing period': 'P1M'
		});
	});

	it('formats mutiple SKUs based on an offer with mutiple payment terms', function () {
		const result = subject(mockOffers[1]);

		expect(result[0]).to.deep.equal({
			'Product ID': 'ft.com_c8ad55e6.ba74.fea0.f9da.a4546ae2ee23_p1m',
			'Published State': 'published',
			'Purchase Type': 'managed_by_android',
			'Auto Translate': false,
			'Description': {
				'Locale': 'en_GB',
				'Title': 'Standard FT.com',
				'Description': 'Standard FT.com'
			},
			'Auto Fill Prices': false,
			'Price': [
				{
				'iso_2_char': 'GB',
				'amount': '30.00'
				}
			],
			'Android App ID': 'com.ft.news',
			'SKU ID': 'ft.com_c8ad55e6.ba74.fea0.f9da.a4546ae2ee23_p1m',
			'ProductID(s)': [
				'ft.com:free',
				'ft.com:registered',
				'ft.com:subscribed'
			],
			'Publication host(s)': [
				'ft.com',
				'local.ft.com:5050'
			],
			'Publication name': 'Financial Times',
			'Billing period': 'P1M'
		});

		expect(result[1]).to.deep.equal({
			'Product ID': 'ft.com_c8ad55e6.ba74.fea0.f9da.a4546ae2ee23_p1y',
			'Published State': 'published',
			'Purchase Type': 'managed_by_android',
			'Auto Translate': false,
			'Description': {
				'Locale': 'en_GB',
				'Title': 'Standard FT.com',
				'Description': 'Standard FT.com'
			},
			'Auto Fill Prices': false,
			'Price': [
				{
				'iso_2_char': 'GB',
				'amount': '278.20'
				}
			],
			'Android App ID': 'com.ft.news',
			'SKU ID': 'ft.com_c8ad55e6.ba74.fea0.f9da.a4546ae2ee23_p1y',
			'ProductID(s)': [
				'ft.com:free',
				'ft.com:registered',
				'ft.com:subscribed'
			],
			'Publication host(s)': [
				'ft.com',
				'local.ft.com:5050'
			],
			'Publication name': 'Financial Times',
			'Billing period': 'P1Y'
		});
	});

	it('formats based upon a custom config', function () {
		const ENTITLEMENTS = {
			FREE: 'markets.ft.com:free',
			REGISTERED: 'markets.ft.com:registered',
			SUBSCRIBED: 'markets.ft.com:subscribed',
			PREMIUM: 'markets.ft.com:premium'
		};
		const PLAY_CONFIG = {
			PUBLICATION_NAME: 'Markets Data',
			PUBLICATION_HOSTS: [ 'markets.ft.com', 'local.markets.ft.com:5050' ],
			APP_ID: 'com.ft.markets',
			SUPPORTED_COUNTRIES: [ 'USA', 'GBR' ]
		};
		subject = transformer({ ENTITLEMENTS, PLAY_CONFIG });
		const result = subject(mockOffers[0]);
		expect(result[0]).to.deep.equal({
			'Product ID': 'ft.com_41218b9e.c8ae.c934.43ad.71b13fcb4465_p1m',
			'Published State': 'published',
			'Purchase Type': 'managed_by_android',
			'Auto Translate': false,
			'Description': {
				'Locale': 'en_GB',
				'Title': 'Premium FT.com',
				'Description': 'Premium FT.com'
			},
			'Auto Fill Prices': false,
			'Price': [
				{
					'iso_2_char': 'GB',
					'amount': '48.00'
				},
				{
					'iso_2_char': 'US',
					'amount': '62.50'
				}
			],
			'Android App ID': 'com.ft.markets',
			'SKU ID': 'ft.com_41218b9e.c8ae.c934.43ad.71b13fcb4465_p1m',
			'ProductID(s)': [
				'markets.ft.com:free',
				'markets.ft.com:registered',
				'markets.ft.com:subscribed',
				'markets.ft.com:premium'
			],
			'Publication host(s)': [
				'markets.ft.com',
				'local.markets.ft.com:5050'
			],
			'Publication name': 'Markets Data',
			'Billing period': 'P1M'
		});
	});

});
