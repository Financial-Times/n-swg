import SubscribeButton from './lib/subscribe-button';
import shouldInit from './lib/utils/should-init';
import importClient from '../swg-client';

module.exports = {
	init: () => {
		if (shouldInit('[data-n-swg-button]')) {
			new SubscribeButton();
		}
	},
	importClient
};