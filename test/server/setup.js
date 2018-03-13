require('babel-register')({
	presets: [
		[
			'env',
			{
				targets: {
					node: true
				}
			}
		]
	],
	plugins: [
		'add-module-exports',
		'transform-runtime'
	]
});
