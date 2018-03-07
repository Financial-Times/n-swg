const { expect } = require('chai');

const Document = require('../mocks/document');
const Overlay = require('../../../src/client/utils/overlay');

describe('Util: overlay.js', function () {
	let dom;

	beforeEach(() => {
		dom = global.document = new Document();
	});

	afterEach(() => {
		dom._reset();
		dom = global.document = null;
	});

	it('exports a class', function () {
		expect(Overlay).to.be.a('Function');
		expect(Overlay).to.deep.equal(Overlay);
	});

	it('creates an overlay element', function () {
		const overlay = new Overlay();
		const el = overlay.el;
		expect(el.type).to.equal('div');
		expect(el._classList.includes('o-overlay-shadow')).to.be.true;
	});

	it('overlay.show() adds the overlay to the document', function () {
		const overlay = new Overlay();
		expect(dom._elements.length).to.equal(0);
		overlay.show();
		expect(dom._elements.length).to.equal(1);
	});

	it('overlay.hide() removes the overlay from the document', function () {
		const overlay = new Overlay();
		overlay.show();
		expect(dom._elements.length).to.equal(1);
		overlay.hide();
		expect(dom._elements.length).to.equal(0);
	});

});
