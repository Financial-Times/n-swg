module.exports = (_document=document) => ({ manual=false, src='https://subscribe.sandbox.google.com/swglib/swg.js', id='swg-client' }={}) => {
	const hasClientAlready = id && !!_document.querySelector('#' + id);
	// Prevent importing more than once.
	if (hasClientAlready) return;

	let script = _document.createElement('SCRIPT');

	script.src = src;
	script.async = true;
	script.id = id;

	// If we need to manually init, we need to let the swg client know.
	if (manual) {
		script.setAttribute('subscriptions-control', 'manual');
	}

	_document.body.appendChild(script);
};
