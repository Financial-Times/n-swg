const { JSDOM } = require('jsdom');

const _helpers = (jsdom) => {
	const document = jsdom.window.document;
	return {
		clickElement: (el) => {
			const clickevent = document.createEvent('MouseEvents');
			clickevent.initEvent('click', true, true);
			el.dispatchEvent(clickevent);
		}
	};
};

module.exports = { JSDOM, _helpers };
