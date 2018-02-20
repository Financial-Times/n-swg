const request = require('request');
const logger = require('@financial-times/n-logger').default;

/*
	Act as a proxy to underlying service for easier demoing and mocking
	- default: proxy requests to https://www.ft.com host
*/
module.exports = (host) => (req, res) => {
	const method = req.method;
	const headers = req.headers;
	const url = host + req.url;

	// avoid cors issues
	delete headers.host;

	logger.info('proxying request', { request: JSON.stringify({ method, headers} ), url });

	request[req.method.toLowerCase()]({ url, headers, method })
		.on('response', (proxyRes) => {
			logger.info(`proxy result STATUS=${proxyRes.statusCode}`);
		})
		.pipe(res);
};
