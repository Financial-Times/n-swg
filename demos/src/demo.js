/* eslint no-console:0 */
const { swgLoader } = require('../../main-client');

document.addEventListener('oTracking.event', e => {
	console.log('oTracking.event', e.detail.action, e);
});

document.addEventListener('oErrors.log', e => {
	console.log('oErrors.log', e.detail.action, e);
});

const options = {
	manualInitDomain: !!(document.querySelector('[data-n-swg-demo-manual-mode=true]')) ? 'ft.com:subscribed' : false,
	sandbox: !!(document.querySelector('[data-n-swg-demo-env=sandbox]')),
	subscribeFromButton: true,
	M_SWG_SUB_SUCCESS_ENDPOINT: !!(document.querySelector('[data-n-swg-local-proxy=true]')) && '/cors-endpoint/success',
	handlers: {
		onNativeSubscribeRequest: () => {
			console.log('native sub request received. This is an example of passing a handler into the class');
		}
	}
};

console.log('SwG options:', JSON.stringify(options, null, 2));

swgLoader(options).then(swg => {
	swg.init();

	/* examples of manually invoking swg functions */
	document.querySelector('#func-showSubscribeOption').addEventListener('click', () => {
		swg.swgClient.showSubscribeOption();
	});
	document.querySelector('#func-showAbbrvOffer').addEventListener('click', () => {
		swg.swgClient.showAbbrvOffer();
	});
	document.querySelector('#func-subscribe').addEventListener('click', (ev) => {
		console.log(ev.target.dataset);
		swg.swgClient.subscribe(ev.target.dataset['sku']);
	});
});
