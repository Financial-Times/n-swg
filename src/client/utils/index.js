const _get = require('./deep-get');
const browser = require('./browser');
const events = require('./events');
const importCss = require('./swg-css-loader');
const importClient = require('./swg-client-loader');
const Overlay = require('./overlay');
const smartFetch = require('./fetch');
const swgReady = require('./swg-ready');

module.exports = {
	_get,
	browser,
	events,
	importClient,
	importCss,
	Overlay,
	smartFetch,
	swgReady
};
