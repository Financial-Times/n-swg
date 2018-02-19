import SwgController from './lib/swg-controller';
import { importClient } from './lib/utils';

module.exports = {
	SwgController,
	swgLoader: (options) => new Promise(resolve => {
		const loadOptions = { manual: !!options.manualInitDomain };
		SwgController.load(loadOptions).then(client => {
			const swg = new SwgController(client, options);
			resolve(swg);
		});
	}),
	importClient
};
