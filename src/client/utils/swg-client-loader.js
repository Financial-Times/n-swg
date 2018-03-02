let hasClientAlready = !!document.querySelector('#swg-client');

module.exports = ({ manual=false, src='https://subscribe.sandbox.google.com/swglib/swg.js', id='swg-client' }={}) => {
	// Prevent importing more than once.
	if (hasClientAlready) return;

	let script = document.createElement('SCRIPT');

	script.src = src;
	script.async = true;
	script.id = id;

	// If we need to manually init, we need to let the swg client know.
	if (manual) {
		script.setAttribute('subscriptions-control', 'manual');
	}

	hasClientAlready = true;

	document.body.appendChild(script);
};
