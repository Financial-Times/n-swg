module.exports = {
	/**
	 * Extracts an ft content uuid from the window.location
	 * @returns {string}
	 */
	getContentUuidFromUrl: function () {
		const ARTICLE_UUID_QS = /ft-content-uuid=([^&]+)/;
		const ARTICLE_UUID_PATH = /content\/([^&?\/]+)/;
		const location = this.getWindowLocation() || {};
		const lookup = (regexp, str) => str && (str.match(regexp) || [])[1];
		return lookup(ARTICLE_UUID_QS, location.search) || lookup(ARTICLE_UUID_PATH, location.href);
	},
	/**
	 * Returns a login url with a relevant location
	 * @returns {string}
	 */
	generateLoginUrl: function () {
		const uuid = this.getContentUuidFromUrl();
		const contentHref = uuid && `https://www.ft.com/content/${uuid}`;
		return 'https://www.ft.com/login?socialEnabled=true' + (contentHref ? `&location=${encodeURIComponent(contentHref)}` : '');
	},
	/**
	 * @param {string} url
	 */
	redirectTo: function (url) {
		window.location.href = url;
	},
	/**
	 * @returns {string}
	 */
	getWindowLocation: function () {
		return window.location;
	},
	/**
	 * @returns {Boolean}
	*/
	isProductSelector: function () {
		return /^\/products/.test(this.getWindowLocation().pathname);
	}
};
