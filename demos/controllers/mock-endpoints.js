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
	if (body && body.createSession === false) return;
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
			}
		];
	}
};

module.exports = (MOCK_MODE) => (req, res, next) => {
	if (!MOCK_MODE) return next();

	logger.info('handling a proxied request', JSON.stringify(req.body, null, 2));
	/**
	 * Mock Membership endpoints
	 */
	switch (req.params.result) {
		case 'success':
			generateMockCookie(res, generateCookieData(req));
			setTimeout(() => {
				return res.status(201).json({ userInfo: { newlyCreated: true } });
			}, 2000); // fake slower async call
			break;
		case 'entitled':
			generateMockCookie(res, generateCookieData(req));
			setTimeout(() => {
				return res.status(201).json({ userInfo: { newlyCreated: false } });
			}, 2000); // fake slower async call
			break;
		default:
			return next();
	}
};
