require('./mocks/document');
require('./mocks/self');
require('babel-register')({
	presets: [
		[
			'env',
			{
				targets: {
					browsers: ['last 2 versions', 'ie >= 11']
				}
			}
		]
	],
	plugins: [
		'add-module-exports',
		'transform-runtime'
	]
});
