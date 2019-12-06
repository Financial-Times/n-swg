const SwgController = require('./src/client/swg-controller');
const { importSWG } = require('./src/client/utils');

module.exports = {
	SwgController,
	swgLoader: (options={}) => new Promise((resolve, reject) => {
		const loadOptions = { manual: !!options.manualInitDomain, sandbox: !!options.sandbox };
		SwgController.load(loadOptions).then(client => {
			const swg = new SwgController(client, options);
			resolve(swg);
		})
			.catch(reject);
	}),
	importSWG: importSWG()
};
