/* eslint no-console:0 */
'use strict';

const { resolve } = require('path');
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

const PORT = process.env.PORT || 5050; // !NOTE: Google is setup to only allow scripts to load on local.ft.com:5050

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
