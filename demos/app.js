/* eslint no-console:0 */
'use strict';

const { resolve } = require('path');
const bodyParser = require('body-parser');
const chalk = require('chalk');
const express = require('@financial-times/n-internal-tool');

const app = module.exports = express({
	name: 'public',
	systemCode: 'n-swg-demo',
	withFlags: true,
	withHandlebars: true,
	withNavigation: false,
	withAnonMiddleware: false,
	hasHeadCss: false,
	viewsDirectory: '/demos/templates',
	partialsDirectory: resolve(__dirname, '../public'),
	directory: process.cwd(),
	demo: true,
	s3o: false
});

app.get('/*', (req, res) => {
	res.render('index',{ layout: 'vanilla', title: 'Demo' });
});

app.post('/cors-endpoint/:result?', bodyParser.json(), require('./mock-endpoints.controller')(process.env.DEMO_MODE));
app.post('*', require('./utils/proxy')('https)://www.ft.com'));

// !NOTE: Google is setup to allow scripts to load on http(s)://local.ft.com:5050
// https://console.developers.google.com/apis/credentials/oauthclient
const PORT = process.env.PORT || 5050;

const listen = app.listen(PORT);

function runPa11yTests () {
	const spawn = require('child_process').spawn;
	const pa11y = spawn('pa11y-ci');

	pa11y.stdout.on('data', (data) => {
		console.log(chalk.bold.green(`${data}`)); //eslint-disable-line
	});

	pa11y.stderr.on('data', (error) => {
		console.log(chalk.bold.red(`${error}`)); //eslint-disable-line
	});

	pa11y.on('close', (code) => {
		process.exit(code);
	});
}

listen
	.then(() => console.log(`demo running on port ${PORT}. ENSURE YOU ACCESS VIA LOCAL.FT.COM TO USE COOKIES.`))
	.catch(error => console.log(error));

if (process.env.PA11Y === 'true') {
	listen.then(runPa11yTests);
}
