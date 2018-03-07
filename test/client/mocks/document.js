/**
 * Replicate document API
 */
document = {
	elements: {},
	querySelector: function (val) {
		return this.elements[val] || undefined;
	},
	_reset: function () {
		this.elements = {};
	}
};
