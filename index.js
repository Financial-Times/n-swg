import SubscribeButton from './lib/subscribe-button';
import shouldInit from './lib/utils/should-init';
import importClient from '../swg-client';

module.exports = {
	init: () => {
		let toInit = [];
		
		if (shouldInit('[data-n-swg-button]')) {
			toInit.push(SubscribeButton);
		}

		if (toInit.length) {
			for (let i = 0; i < toInit.length; i++) {
				new toInit[i]();
			}
			
			importClient();
		}
	},
	importClient
};