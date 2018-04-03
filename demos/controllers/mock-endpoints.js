const _get = require('lodash.get');
const logger = require('@financial-times/n-logger').default;
const SESSION_COOKIE_EXPIRY = 15552000000;

const generateMockCookie = (res, { key, val }={}) => {
	const cookie = {
		path: '/',
		domain: '.ft.com',
		expires: new Date(Date.now() + SESSION_COOKIE_EXPIRY)
	};
	res.cookie(key, val, cookie);
};

const generateCookieData = ({ body }={}) => {
	const purchaseData = _get(body, 'purchaseData');
	if (!purchaseData) {
		// entitlements success
		return {
			key: 'N_SWG_MOCK_ENTITLEMENT_SESSION_S',
			val: _get(body, 'entitlements[0].subscriptionToken')
		};
	} else {
		// purchase success
		return {
			key: 'N_SWG_MOCK_PURCHASE_SESSION_S',
			val: purchaseData
		};
	}
};

module.exports = (MOCK_MODE) => (req, res, next) => {
	if (!MOCK_MODE) return next();

	/**
	 * Mock Membership endpoints
	 */
	switch (req.params.result) {
		case 'success':
			logger.info('handling a proxied request', JSON.stringify(req.body, null, 2));
			generateMockCookie(res, generateCookieData(req));
			setTimeout(() => {
				return res.sendStatus(201);
			}, 2000); // fake slower async call
			break;
		default:
			return next();
	}
};
