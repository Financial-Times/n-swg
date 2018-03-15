/* eslint no-console:0 */
const SESSION_COOKIE_EXPIRY = 15552000000;

const generateMockCookie = (res) => {
	const cookie = {
		path: '/',
		domain: '.ft.com',
		expires: new Date(Date.now() + SESSION_COOKIE_EXPIRY)
	};
	res.cookie('N_SWG_MOCK_COOKIE', 'MOCK_COOKIE_VALUE', cookie);
};

const debugLog = ({ body }={}) => {
	console.log('handling a proxied request', JSON.stringify(body));
};

module.exports = (req, res, next) => {
	switch (req.params.result) {
		case 'success':
			debugLog(req);
			generateMockCookie(res);
			return res.status(201).json({
				example: 'body'
			});
			break;
		default:
			return next();
	}
};
