/* eslint no-console:0 */
import { swgLoader } from '../../main-client';

document.addEventListener('oTracking.event', e => {
	console.log('oTracking.event', e.detail.action, e);
});

const options = {
	manualInitDomain: !!(document.querySelector('[data-n-swg-demo-manual-mode=true]')) ? 'ft.com:subscribed' : false,
	sandbox: !!(document.querySelector('[data-n-swg-demo-env=sandbox]')),
	subscribeFromButton: true,
	M_SWG_SUB_SUCCESS_ENDPOINT: '/cors-endpoint/success'
};

console.log('SwG options:', JSON.stringify(options, null, 2));

swgLoader(options).then(swg => {
	swg.init();
});
