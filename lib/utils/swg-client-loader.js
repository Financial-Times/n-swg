let hasClientAlready = !!document.querySelector('#swg-client');

module.exports = ({ manual=false, sandbox=false, id='swg-client' }={}) => {
	// Prevent importing more than once.
	if (hasClientAlready) return;

	let script = document.createElement('SCRIPT');

	script.src = sandbox ? 'https://subscribe.sandbox.google.com/swglib/swg.js' : 'https://news.google.com/swg/js/v1/swg.js';
	script.async = true;
	script.id = id;

	// If we need to manually init, we need to let the swg client know.
	if (manual) {
		script.setAttribute('subscriptions-control', 'manual');
	}

	hasClientAlready = true;

	document.body.appendChild(script);
};
