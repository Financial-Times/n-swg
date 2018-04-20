module.exports = {
	/**
	 * Dispatch oTracking event
	 * @param {object} detail - event detail
	 * @param {class} eventConstructor - for mocking
	 */
	track: function (detail, eventConstructor=CustomEvent) {
		document.body.dispatchEvent(new eventConstructor('oTracking.event', { detail, bubbles: true }));
	},
	/**
	 * Dispatch namespaced event
	 * @param {string} action - event action
	 * @param {object} context - event data
	 * @param {class} eventConstructor - for mocking
	 */
	signal: function (action, context={}, eventConstructor=CustomEvent) {
		document.body.dispatchEvent(new eventConstructor(`nSwg.${action}`, { detail: context, bubbles: true }));
	},
	/**
	 * Signal a nampspaced error event
	 * @param {error} error
	 * @param {object} info - extra data
	 */
	signalError: function (error, info={}) {
		this.signal('onError', { error, info });
	},
	/**
	 * Listen to namespaced events
	 * @param {string} action - event action to listen for
	 * @param {function} callback
	 */
	listen: function (action, callback) {
		document.body.addEventListener(`nSwg.${action}`, (event={}) => {
			callback(event.detail);
		});
	}
};
