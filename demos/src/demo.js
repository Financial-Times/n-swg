import { swgLoader } from '../../main';

const options = {
	manualInitDomain: 'ft.com',
	subscribeFromButton: true,
	M_SWG_SUB_SUCCESS_ENDPOINT: '/cors-endpoint/success'
};

swgLoader(options).then(swg => {
	swg.init();
});
