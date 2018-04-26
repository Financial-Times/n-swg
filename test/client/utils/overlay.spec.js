const { expect } = require('chai');
const sinon = require('sinon');

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
		expect(el.classList.contains('overlay__shadow')).to.be.true;
	});

	it('overlay.show() adds the overlay to the document', function () {
		const overlay = new Overlay();
		expect(dom.querySelectorAll('.overlay__shadow').length).to.equal(0);
		overlay.show();
		expect(dom.querySelectorAll('.overlay__shadow').length).to.equal(1);
	});

	it('if passed content overlay.show() adds the overlay to the document with content inside', function () {
		const contentString = '<div>Some content message</div>';
		const overlay = new Overlay();
		expect(dom.querySelectorAll('.overlay__shadow').length).to.equal(0);
		overlay.show(contentString);
		expect(dom.querySelectorAll('.overlay__shadow').length).to.equal(1);
		expect(dom.querySelectorAll('.overlay__inner').length).to.equal(1);
		expect(dom.querySelector('.overlay__inner').innerHTML).to.equal(contentString);
	});

	it('will clear inner content on each .show()', function () {
		const contentString = '<div>Some content message</div>';
		const overlay = new Overlay();
		overlay.show(contentString);
		expect(dom.querySelector('.overlay__inner').innerHTML).to.equal(contentString);
		overlay.show();
		expect(dom.querySelectorAll('.overlay__inner').innerHTML).to.equal(undefined);
	});

	it('overlay.hide() removes the overlay from the document', function () {
		const overlay = new Overlay();
		overlay.show('some content');
		expect(dom.querySelectorAll('.overlay__shadow').length).to.equal(1);
		expect(dom.querySelectorAll('.overlay__inner').length).to.equal(1);
		overlay.hide();
		expect(dom.querySelectorAll('.overlay__shadow').length).to.equal(0);
		expect(dom.querySelectorAll('.overlay__inner').length).to.equal(0);
	});

	it('hides the overlay when pressing the escape key', () => {
		const overlay = new Overlay();
		overlay.show('some content');

		let evt = document.createEvent('HTMLEvents');
		let hideSpy = sinon.spy(overlay, 'hide');

		evt.initEvent('keyup', false, true);
		evt.keyCode = 27;
		dom.body.dispatchEvent(evt);

		expect(hideSpy.getCalls().length).to.equal(1);
	});

	context('close button', () => {

		let overlay;

		beforeEach(() => {
			overlay = new Overlay();
			overlay.show('some content');
		});

		it('shows when rendering the overlay', () => {
			expect(dom.querySelectorAll('.overlay__close').length).to.equal(1);
		});

		it('hides the overlay when clicked on', () => {
			let evt = document.createEvent('HTMLEvents');
			let hideSpy = sinon.spy(overlay, 'hide');

			evt.initEvent('click', false, true);
			dom.querySelector('.overlay__close').dispatchEvent(evt);

			expect(hideSpy.getCalls().length).to.equal(1);
		});

	});

});
