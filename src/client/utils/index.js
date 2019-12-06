const _get = require('./deep-get');
const browser = require('./browser');
const events = require('./events');
const importGooglePlatform = require('./google-platform-loader');
const importSWG = require('./swg-client-loader');
const Overlay = require('./overlay');
const smartFetch = require('./fetch');
const swgReady = require('./swg-ready');

module.exports = {
	_get,
	browser,
	events,
	importGooglePlatform,
	importSWG,
	Overlay,
	smartFetch,
	swgReady
};
