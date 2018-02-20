/* eslint no-console:0 */
import { swgLoader } from '../../main';

document.addEventListener('oTracking.event', e => {
	console.log('oTracking.event', e);
});

const options = {
	manualInitDomain: 'ft.com',
	subscribeFromButton: true,
	M_SWG_SUB_SUCCESS_ENDPOINT: '/cors-endpoint/success'
};

swgLoader(options).then(swg => {
	swg.init();
});
