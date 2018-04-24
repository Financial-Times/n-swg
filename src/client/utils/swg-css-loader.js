module.exports = (_document=document) => (href='https://news.google.com/swg/js/v1/swg-button.css') => {
	let stylesheet = _document.createElement('link');
	stylesheet.rel = 'stylesheet';
	stylesheet.href = href;
	stylesheet.media = 'all';

	const nodes = _document.body.childNodes;
	const ref = nodes[ nodes.length - 1 ];
	ref.parentNode.insertBefore( stylesheet, ref.nextSibling);
};
