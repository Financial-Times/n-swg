/* eslint no-console:0 */
const _get = require('lodash.get');
const SESSION_COOKIE_EXPIRY = 15552000000;

const generateMockCookie = (res, { key, val }={}) => {
	const cookie = {
		path: '/',
		domain: '.ft.com',
		expires: new Date(Date.now() + SESSION_COOKIE_EXPIRY)
	};
	res.cookie(key, val, cookie);
};

const debugLog = ({ body }={}) => {
	console.log('handling a proxied request', JSON.stringify(body, null, 2));
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

module.exports = (req, res, next) => {
	switch (req.params.result) {
		case 'success':
			debugLog(req);
			generateMockCookie(res, generateCookieData(req));
			return res.status(201).json({
				example: 'body'
			});
			break;
		default:
			return next();
	}
};
