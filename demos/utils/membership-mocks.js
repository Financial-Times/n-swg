const SESSION_COOKIE_EXPIRY = 15552000000;

const generateMockCookie = (res) => {
	const cookie = {
		path: '/',
		domain: '.ft.com',
		expires: new Date(Date.now() + SESSION_COOKIE_EXPIRY)
	};
	res.cookie('N_SWG_MOCK_COOKIE', 'MOCK_COOKIE_VALUE', cookie);
};


module.exports = (req, res, next) => {
	switch (req.params.result) {
		case 'success':
			generateMockCookie(res);
			return res.status(201).send('OK');
			break;
		default:
			return next();
	}
};
