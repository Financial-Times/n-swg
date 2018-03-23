const { expect } = require('chai');

const { JSDOM } = require('../mocks/document');
const Overlay = require('../../../src/client/utils/overlay');

describe('Util: overlay.js', function () {
	let dom;

	beforeEach(() => {
		const jsdom = new JSDOM();
		dom = global.document = jsdom.window.document;
	});

	afterEach(() => {
		delete global.document;
	});

	it('exports a class', function () {
		expect(Overlay).to.be.a('Function');
		expect(Overlay).to.deep.equal(Overlay);
	});

	it('creates an overlay element', function () {
		const overlay = new Overlay();
		const el = overlay.el;
		expect(el.classList.contains('o-overlay-shadow')).to.be.true;
	});

	it('overlay.show() adds the overlay to the document', function () {
		const overlay = new Overlay();
		expect(dom.querySelectorAll('.o-overlay-shadow').length).to.equal(0);
		overlay.show();
		expect(dom.querySelectorAll('.o-overlay-shadow').length).to.equal(1);
	});

	it('if passed content overlay.show() adds the overlay to the document with content inside', function () {
		const contentString = '<div>Some content message</div>';
		const overlay = new Overlay();
		expect(dom.querySelectorAll('.o-overlay-shadow').length).to.equal(0);
		overlay.show(contentString);
		expect(dom.querySelectorAll('.o-overlay-shadow').length).to.equal(1);
		expect(dom.querySelectorAll('.o-overlay-inner').length).to.equal(1);
		expect(dom.querySelector('.o-overlay-inner').innerHTML).to.equal(contentString);
	});

	it('will clear inner content on each .show()', function () {
		const contentString = '<div>Some content message</div>';
		const overlay = new Overlay();
		overlay.show(contentString);
		expect(dom.querySelector('.o-overlay-inner').innerHTML).to.equal(contentString);
		overlay.show();
		expect(dom.querySelectorAll('.o-overlay-inner').length).to.equal(0);
	});

	it('overlay.hide() removes the overlay from the document', function () {
		const overlay = new Overlay();
		overlay.show('some content');
		expect(dom.querySelectorAll('.o-overlay-shadow').length).to.equal(1);
		expect(dom.querySelectorAll('.o-overlay-inner').length).to.equal(1);
		overlay.hide();
		expect(dom.querySelectorAll('.o-overlay-shadow').length).to.equal(0);
		expect(dom.querySelectorAll('.o-overlay-inner').length).to.equal(0);
	});

});
