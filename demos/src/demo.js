import { swgLoader } from '../../main';

const options = {
	manualInitDomain: 'ft.com',
	subscribeFromButton: true
}

swgLoader(options).then(swg => {
	swg.init();
});
