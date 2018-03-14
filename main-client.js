import SwgController from './src/client/swg-controller';
import { importClient } from './src/client/utils';

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
	importClient: importClient()
};
