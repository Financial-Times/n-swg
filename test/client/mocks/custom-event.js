class CustomEvent {
	constructor (type, { detail, bubbles }={}) {
		this.type = type;
		this.detail = detail;
		this.bubbles = bubbles;
	}
}

module.exports = CustomEvent;
