require('babel-register');
/**
 * !NOTE: Google allows scripts to load on http(s)://local.ft.com:5050
 * https://console.developers.google.com/apis/credentials/oauthclient
 * However it only works properly via https. This script starts the demo app
 * in https mode, using the keys and certs from next-router.
 */
const fs = require('fs');
const https = require('https');
const path = require('path');
const logger = require('@financial-times/n-logger').default;

const app = require('./app');

const NEXT_ROUTER_PATH = process.env.NEXT_ROUTER_PATH || '../next-router';
let KEY_PATH = path.resolve(NEXT_ROUTER_PATH, 'self-signed-ssl-key.pem');
let CERT_PATH = path.resolve(NEXT_ROUTER_PATH, 'self-signed-ssl-certificate.pem');
let opts;

try {
	opts = {
		key: fs.readFileSync(KEY_PATH),
		cert: fs.readFileSync(CERT_PATH)
	};
} catch (err) {
	logger.info('\n\n\x1b[31mYou need to generate self signed certificates to run this locally in https. Ensure that NEXT_ROUTER_PATH is set and points to the next-router install location relative to this folder. eg. NEXT_ROUTER_PATH=~/repos/next-router make run\n\x1b[m');
	logger.error(err);
	process.exit(1);
}
const port = 5050;

https.createServer(opts, app).listen(port);
logger.info('Demo running in https listening on ' + port);
