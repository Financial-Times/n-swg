const nextJsonLd = require('@financial-times/next-json-ld');
const mockArticle = require('../fixtures/mock-article-es-result');

const markup = (query={}) => {
	const paywall = query['paywall'];
	const accessLevel = paywall === 'premium' ? 'premium' : 'subscribed';
	const content = paywall && accessLevel && mockArticle(accessLevel);
	return { jsonLd: [ nextJsonLd.barrier(content) ], accessLevel, contentPaywall: !!(content) };
};

const getMode = (query={}) => {
	const useProduction = query['production'];
	return useProduction ? 'production' : 'sandbox';
};

const getOffers = (mode) => {
	return {
		production: [
			{ name: 'FT.com trial', sku: 'ft.com_41218b9e.c8ae.c934.43ad.71b13fcb4465_p1m_premium.trial_26.04.18_test' },
			{ name: 'FT.com standard', sku: 'ft.com_c8ad55e6.ba74.fea0.f9da.a4546ae2ee23_p1m' },
			{ name: 'FT.com premium', sku: 'ft.com_713f1e28.0bc5.8261.f1e6.eebab6f7600e_p1m' }
		],
		sandbox: [
			{ name: 'basic_daily_1 Dummy SKU', sku: 'basic_daily_1' },
			{ name: 'premium_daily_1 Dummy SKU', sku: 'premium_daily_1' }
		]
	}[mode] || [];
};

const getManualInitMode = (query={}, contentPaywall) => {
	if (query['manual'] === 'true') return true;
	if (!query['manual'] && !contentPaywall) return true; // will not work otherwise
	return false;
};

module.exports = (req, res, next) => {
	const env = getMode(req.query);
	const { jsonLd, accessLevel, contentPaywall } = markup(req.query);
	const offers = getOffers(env);
	try {
		res.render('index', {
			layout: 'vanilla',
			title: 'Demo',
			jsonLd,
			env,
			accessLevel,
			contentPaywall,
			manualInit: getManualInitMode(req.query, contentPaywall),
			offers,
			offersList: offers.map((offer) => offer.sku).join(','),
			localProxy: process.env.DEMO_MODE
		});
	} catch (e) {
		next(e);
	}
};
