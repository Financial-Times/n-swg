/* eslint no-console:0 */
const request = require('request');

/*
	Act as a proxy to underlying service for easier demoing and mocking
	- default: proxy requests to https://www.ft.com host
	- process.env.GURU_HOST: proxy requests to defined GURU_HOST host
	- TODO: process.env.MOCK_MODE: return mock responses from config file
*/
module.exports = (host) => (req, res) => {
	const method = req.method;
	const headers = req.headers;
	const url = host + req.url;

	// avoid cors issues
	delete headers.host;

	console.log('proxying request URL=', url, JSON.stringify({ method, headers}));

	request[req.method.toLowerCase()]({ url, headers, method })
		.on('response', (proxyRes) => {
			console.log('proxy result STATUS=', proxyRes.statusCode);
		})
		.pipe(res);
};
