module.exports = (_document = document) => ({ src, id='google-latform-client' } = {}) => {
	const hasClientAlready = id && !!_document.querySelector('#' + id);

	// Prevent importing more than once.
	if (hasClientAlready) return;

	const meta = _document.createElement('META');

	meta.name = "google-signin-client_id";
	meta.content = process.env.CLIENT_ID;

	const script0 = _document.createElement('SCRIPT');

	script0.type = "application/json"
	
	script0.innerHTML = function init() {
		window.gapi.load('auth2', function() {
			const auth2 = window.gapi.auth2.init({
				client_id: process.env.CLIENT_ID;
				scope: 'profile email'
			}).catch(e => console.log(e));
		}).catch(e => console.log(e));
	}

	  
	const script = _document.createElement('SCRIPT');

	script.id = id;

	script.src = src || "https://apis.google.com/js/platform.js?onload=init";
	script.async = true;

	_document.head.appendChild(meta);

	_document.body.appendChild(script0);
	_document.body.appendChild(script);
};
