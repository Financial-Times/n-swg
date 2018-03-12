const { expect } = require('chai');

const { JSDOM, _helpers } = require('../mocks/document');
const importClient = require('../../../src/client/utils/swg-client-loader');

describe('Util: swg-client-loader.js', function () {
	let dom;
	let subject;
	let helpers;

	beforeEach(() => {
		const jsdom = new JSDOM();
		dom = global.document = jsdom.window.document;
		subject = importClient(dom);
		helpers = _helpers(jsdom);
	});

	afterEach(() => {
		delete global.document;
	});

	it('exports a function', function () {
		expect(subject).to.be.a('Function');
	});

	it('will return early if element with id already exists on page', function () {
		helpers.addElement({ name: 'foo' });
		subject({ id: 'foo'});
		expect(dom.querySelectorAll('#foo').length).to.equal(1);
	});

	it('creates a new element if id does not already exist', function () {
		helpers.addElement({ name: 'bar' });
		subject({ id: 'foo'});
		expect(dom.querySelectorAll('#foo').length, 'script tag added').to.equal(1);
		expect(dom.querySelectorAll('#bar').length, 'existing div').to.equal(1);
	});

	context('creates and adds a SCRIPT element to the document', function () {
		const defaultSelector = '#swg-client';

		it('with correct default attributes', function () {
			subject();
			const resultEl = dom.querySelector(defaultSelector);
			expect(resultEl.getAttribute('src')).to.equal('https://subscribe.sandbox.google.com/swglib/swg.js');
			expect(resultEl.async).to.equal(true);
			expect(resultEl.getAttribute('subscriptions-control')).to.be.null;
			expect(resultEl.id).to.equal('swg-client');
		});

		it('with correct custom attributes if passed', function () {
			subject({ id: 'bar', manual: true, src: 'https://foo.com/file.js' });
			const resultEl = dom.querySelector('#bar');
			expect(resultEl.getAttribute('src')).to.equal('https://foo.com/file.js');
			expect(resultEl.async).to.equal(true);
			expect(resultEl.getAttribute('subscriptions-control')).to.equal('manual');
			expect(resultEl.id).to.equal('bar');
		});

	});

});
