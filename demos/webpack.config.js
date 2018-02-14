'use strict';

const nWebpack = require('@financial-times/n-webpack');
const path = require('path');

const webpackConfig = nWebpack({
	withBabelPolyfills: false,
	entry: {
		'./public/main.js': './demos/src/demo.js',
		'./public/main.css': './demos/src/demo.scss'
	},
	includes: [
		path.join(__dirname, '../')
	],
	exclude: [/node_modules/]
});

module.exports = webpackConfig;
