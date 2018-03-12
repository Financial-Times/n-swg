const { JSDOM } = require('jsdom');

const _helpers = (jsdom) => {
	const document = jsdom.window.document;
	return {
		addElement: ({ name, classString }={}) => {
			const el = document.createElement('div');
			if (name) el.id = name;
			if (classString) el.classList.add(classString.split(',').map(s => s && s.trim()));
			document.body.appendChild(el);
		},
		elements: () => document.querySelectorAll('*'),
		clickElement: (el) => {
			const clickevent = document.createEvent('MouseEvents');
			clickevent.initEvent('click', true, true);
			el.dispatchEvent(clickevent);
		}
	};
};

module.exports = { JSDOM, _helpers };
