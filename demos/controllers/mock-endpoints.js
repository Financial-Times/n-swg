const logger = require('@financial-times/n-logger').default;
const SESSION_COOKIE_EXPIRY = 15552000000;

const generateMockCookie = (res, cookies=[]) => {
	cookies.forEach(({key, val, secure=false}={}) => {
		const cookie = {
			path: '/',
			domain: 'ft.com',
			expires: new Date(Date.now() + SESSION_COOKIE_EXPIRY),
			secure
		};
		res.cookie(key, val, cookie);
	});
};

const generateCookieData = ({ body }={}) => {
	const purchaseData = body && body.purchaseData;
	if (!purchaseData) {
		// entitlements success
		return [{
			key: 'N_SWG_MOCK_ENTITLEMENT_SESSION_S',
			val: 'success'
		}];
	} else {
		// purchase success
		return [
			{
				key: 'N_SWG_MOCK_PURCHASE_SESSION_S',
				val: 'success'
			},
			{
				key: 'FTLogin',
				val: 'beta'
			},
			{
				key: 'FTSession_s',
				val: 'z2Pa7lBiBU1e07kyx4ovJ0wCzwAAAWKLSlnkwsI.MEYCIQCta1jTEbN69ELQs_fnfKRE-aQRlqXx7wetQpDsysrP1wIhAIRhB1SUrjBKw7zCYA1zuTMpnUKuA7Pyn5LHP1pXQ8Yo',
				secure: true
			},
			{
				key: 'FTSession',
				val: 'z2Pa7lBiBU1e07kyx4ovJ0wCzwAAAWKLSlncwsI.MEQCIHlP055qYQWrVIkFh7EqmOt7kEKV0Zlq7q4PjkUq4JeEAiAYGAfXjjCOdZO8k1PA-fIDT6pu2z9W50kuy8HbA9JYHA'
			}
		];
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
