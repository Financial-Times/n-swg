const SwgController = require('./src/client/swg-controller');
const { importClient, importCss } = require('./src/client/utils');

module.exports = {
	SwgController,
	swgLoader: (options={}) => new Promise((resolve, reject) => {
		const loadOptions = { manual: !!options.manualInitDomain, sandbox: !!options.sandbox, withCss: options.subscribeFromButton };

		SwgController.load(loadOptions).then(client => {
			const swg = new SwgController(client, options);
			resolve(swg);
		})
		.catch(reject);
	}),
	importClient: importClient(),
	importCss: importCss()
};
