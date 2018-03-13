import SwgController from './lib/swg-controller';
import { importClient } from './lib/utils';

module.exports = {
	SwgController,
	swgLoader: (options) => new Promise((resolve, reject) => {
		const loadOptions = { manual: !!options.manualInitDomain, sandbox: options.sandbox };
		SwgController.load(loadOptions).then(client => {
			const swg = new SwgController(client, options);
			resolve(swg);
		})
		.catch(reject);
	}),
	importClient
};
