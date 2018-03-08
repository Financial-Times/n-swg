/**
 * Replicate document API
 */
class Document {
	constructor () {
		this.state = Document.defaultState();
		this.listeners = [];
	}

	querySelector (selector) {
		return this.state.elements.find(el => {
			return el.selector === selector;
		});
	}

	querySelectorAll (selector) {
		return this.state.elements.filter(el => {
			return el.selector === selector;
		});
	}

	get body () {
		const self = this;
		return {
			appendChild: function (el) {
				self.state.elements.push(el);
			},
			removeChild: function (el) {
				self.state.elements = self.state.elements.filter(_el => {
					return _el !== el;
				});
			},
			dispatchEvent: function (ev) {
				const toSend = self.listeners.filter(l => l.type === ev.type);
				if (toSend.length > 0) {
					toSend.forEach(({ listener }) => {
						listener(ev);
					});
				}
			},
			addEventListener (type, listener) {
				self.listeners.push({ type, listener });
			}
		};
	}

	createElement (type, opts) {
		return new Element(type, opts);
	}

	_addElement ({ name, val }={}) {
		const el = this.createElement('div', { name, val });
		this.state.elements.push(el);
	}

	get _elements () {
		return this.state.elements;
	}

	_reset () {
		this.state = Document.defaultState();
	}

	static defaultState () {
		return {
			elements: []
		};
	}
}

class Element {

	constructor (type, opts={}) {
		this.type = type;
		this._classList = [];
		this.selector = opts.name;
		this.val = opts.val;
		this.attributes = {};
		this.listeners = [];
	}

	get classList () {
		const self = this;
		return {
			add: function (val) {
				self._classList.push(val);
			}
		};
	}

	setAttribute (name, val) {
		this[name] = val;
	}

	removeAttribute (val) {
		delete this[val];
	}

	addEventListener (type, listener) {
		this.listeners.push({ type, listener });
	}

	_triggerEvent (type, detail) {
		const toSend = this.listeners.filter(l => l.type === type);
		if (toSend.length > 0) {
			const payload = new Event({ target: this, detail });
			toSend.forEach(({ listener }) => {
				listener(payload);
			});
		}
	}

}

class Event {

	constructor ({ target, detail }) {
		this.target = target;
		this.detail = detail;
	}

	preventDefault () {
		return true;
	}

}

module.exports = Document;

// document = new Document();
