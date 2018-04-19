/**
 * Wrapped smarter fetch.
 * @param {string} url - absolute url (same as fetch interface)
 * @param {object} options - options object (same as fetch interface)
 * @param {function} _fetch - for mocking
 * @returns {promise}
 */
module.exports.fetch = function (url, options, _fetch=self.fetch) {
	const safeJson = (res) => {
		return res.text().then(text => {
			let json;
			try {
				json = JSON.parse(text);
			}
			catch (e) {
				json = {};
			}
			return json;
		});
	};

	return new Promise((resolve, reject) => {
		const defaults = { method: 'GET' };

		_fetch(url, Object.assign({}, defaults, options))
			.then(res => {
				if (res.status === 200 || res.status === 201) {
					safeJson(res).then(json => {
						resolve({
							json,
							headers: res.headers,
							status: res.status
						});
					});
				} else {
					res.text().then(txt => {
						reject(new Error(`Bad response STATUS=${res.status} TEXT="${txt}"`));
					});
				}
			})
			.catch(reject);
	});
};
